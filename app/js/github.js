import { state } from "./state.js";

const API_ROOT = "https://api.github.com";
const OWNER = "sybilsu";
const REPO = "academic_dashboard";
const BRANCH = "main";

function headers() {
  return {
    Authorization: `Bearer ${state.getPat()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function decodeBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export async function testConnection() {
  const res = await fetch(`${API_ROOT}/repos/${OWNER}/${REPO}`, { headers: headers() });
  if (!res.ok) throw new Error(`連線失敗(HTTP ${res.status})`);
  return true;
}

export async function getFile(path) {
  const res = await fetch(`${API_ROOT}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`讀取 ${path} 失敗(HTTP ${res.status})`);
  const json = await res.json();
  return { sha: json.sha, content: decodeBase64(json.content) };
}

export async function putFile(path, text, sha, message) {
  const body = { message, content: encodeBase64(text), branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${API_ROOT}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `寫入 ${path} 失敗(HTTP ${res.status})`);
    err.conflict = res.status === 409 || res.status === 422;
    throw err;
  }
  return res.json();
}

function fmtInboxLine(text, tsIso) {
  const d = new Date(tsIso);
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
  return `- [${stamp}] ${text}`;
}

async function appendInboxLines(lines) {
  const file = await getFile("inbox/inbox.md");
  const base = file ? file.content : "";
  const sep = base && !base.endsWith("\n") ? "\n" : "";
  const appended = lines.map((l) => fmtInboxLine(l.text, l.ts)).join("\n");
  const nextContent = `${base}${sep}${appended}\n`;
  return putFile(
    "inbox/inbox.md",
    nextContent,
    file ? file.sha : undefined,
    `progress: 手機新增 ${lines.length} 筆進度`
  );
}

export async function syncPendingInbox({ silent = true } = {}) {
  if (state.getDemoMode() || !state.getPat()) return { synced: 0 };
  const lines = state.getPendingInboxLines();
  if (!lines.length) return { synced: 0 };

  try {
    await appendInboxLines(lines);
  } catch (err) {
    if (err.conflict) {
      try {
        await appendInboxLines(lines);
      } catch (retryErr) {
        if (!silent) throw retryErr;
        console.warn("syncPendingInbox retry failed", retryErr);
        return { synced: 0, error: retryErr };
      }
    } else {
      if (!silent) throw err;
      console.warn("syncPendingInbox failed", err);
      return { synced: 0, error: err };
    }
  }

  state.removePendingInboxLines(lines);
  return { synced: lines.length };
}

async function applyChecklistOverrides(overrides) {
  const file = await getFile("data/format-checklist.json");
  if (!file) throw new Error("找不到 data/format-checklist.json");
  const data = JSON.parse(file.content);
  const touched = [];

  for (const section of data) {
    for (const item of section.items) {
      if (Object.prototype.hasOwnProperty.call(overrides, item.id)) {
        item.checked = overrides[item.id];
        touched.push(item.label);
      }
    }
  }

  const nextContent = JSON.stringify(data, null, 2) + "\n";
  const summary = touched.length > 2 ? `${touched.length} 個項目` : touched.join("、");
  return putFile("data/format-checklist.json", nextContent, file.sha, `checklist: ${summary}`);
}

export async function syncChecklistOverrides({ silent = true } = {}) {
  if (state.getDemoMode() || !state.getPat()) return { synced: 0 };
  const overrides = state.getChecklistOverrides();
  const ids = Object.keys(overrides);
  if (!ids.length) return { synced: 0 };

  try {
    await applyChecklistOverrides(overrides);
  } catch (err) {
    if (err.conflict) {
      try {
        await applyChecklistOverrides(state.getChecklistOverrides());
      } catch (retryErr) {
        if (!silent) throw retryErr;
        console.warn("syncChecklistOverrides retry failed", retryErr);
        return { synced: 0, error: retryErr };
      }
    } else {
      if (!silent) throw err;
      console.warn("syncChecklistOverrides failed", err);
      return { synced: 0, error: err };
    }
  }

  state.clearChecklistOverrides();
  return { synced: ids.length };
}

export async function syncAll({ silent = true } = {}) {
  const inbox = await syncPendingInbox({ silent });
  const checklist = await syncChecklistOverrides({ silent });
  return { inbox, checklist };
}
