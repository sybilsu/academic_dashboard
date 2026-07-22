import { state } from "./state.js";

let cache = null;
let cacheDemoMode = null;

function dataRoot() {
  return state.getDemoMode() ? "../data/demo/" : "../data/";
}

async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export async function loadAll({ force = false } = {}) {
  const demoMode = state.getDemoMode();
  if (cache && !force && cacheDemoMode === demoMode) return cache;

  const root = dataRoot();
  const [projects, tasks, milestones, literature, books, checklist] =
    await Promise.all([
      fetchJSON(root + "projects.json"),
      fetchJSON(root + "tasks.json"),
      fetchJSON(root + "milestones.json"),
      fetchJSON(root + "literature.json"),
      fetchJSON(root + "books.json"),
      fetchJSON(root + "format-checklist.json"),
    ]);

  cache = { projects, tasks, milestones, literature, books, checklist };
  cacheDemoMode = demoMode;
  return cache;
}

export function invalidate() {
  cache = null;
  cacheDemoMode = null;
}

export async function fetchNote(notePath) {
  if (!notePath) return null;
  try {
    const res = await fetch("../" + notePath, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function recentActivity(data, limit = 6) {
  const entries = [];

  for (const t of data.tasks) {
    const ts = t.updatedAt || t.createdAt;
    if (!ts) continue;
    entries.push({
      ts,
      icon: "✓",
      text: `${t.title}${t.status === "done" ? "已完成" : "有進度更新"}`,
      projectId: t.projectId,
    });
  }

  for (const p of data.projects) {
    if (!p.updatedAt) continue;
    entries.push({
      ts: p.updatedAt,
      icon: "◎",
      text: `${p.name} 進度更新至 ${p.progress}%`,
      projectId: p.id,
    });
  }

  for (const l of data.literature) {
    const ts = l.updatedDate || l.addedDate;
    if (!ts) continue;
    entries.push({
      ts,
      icon: "📄",
      text: `文獻《${l.title}》${l.status}`,
      projectId: null,
    });
  }

  for (const b of data.books) {
    if (!b.updatedAt) continue;
    entries.push({
      ts: b.updatedAt,
      icon: "📖",
      text: `《${b.title}》${b.status}`,
      projectId: null,
    });
  }

  entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return entries.slice(0, limit);
}

export function projectById(data, id) {
  return data.projects.find((p) => p.id === id) || null;
}
