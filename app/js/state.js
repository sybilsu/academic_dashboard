const KEYS = {
  demoMode: "trellis.demoMode",
  pat: "trellis.pat",
  checklistOverrides: "trellis.checklistOverrides",
  pendingInboxLines: "trellis.pendingInboxLines",
  theme: "trellis.theme",
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export const state = {
  getDemoMode() {
    return readJSON(KEYS.demoMode, false);
  },
  setDemoMode(value) {
    writeJSON(KEYS.demoMode, !!value);
    emit("trellis:demo-mode-changed", { demoMode: !!value });
  },

  getPat() {
    return localStorage.getItem(KEYS.pat) || "";
  },
  setPat(value) {
    if (value) localStorage.setItem(KEYS.pat, value);
    else localStorage.removeItem(KEYS.pat);
  },

  getChecklistOverrides() {
    return readJSON(KEYS.checklistOverrides, {});
  },
  setChecklistOverride(id, checked) {
    const overrides = state.getChecklistOverrides();
    overrides[id] = checked;
    writeJSON(KEYS.checklistOverrides, overrides);
    emit("trellis:checklist-overrides-changed", { overrides });
  },
  clearChecklistOverrides() {
    localStorage.removeItem(KEYS.checklistOverrides);
    emit("trellis:checklist-overrides-changed", { overrides: {} });
  },

  getPendingInboxLines() {
    return readJSON(KEYS.pendingInboxLines, []);
  },
  addPendingInboxLine(text) {
    const lines = state.getPendingInboxLines();
    lines.push({ text, ts: new Date().toISOString() });
    writeJSON(KEYS.pendingInboxLines, lines);
    emit("trellis:pending-inbox-changed", { lines });
    return lines;
  },
  clearPendingInboxLines() {
    localStorage.removeItem(KEYS.pendingInboxLines);
    emit("trellis:pending-inbox-changed", { lines: [] });
  },

  getTheme() {
    return localStorage.getItem(KEYS.theme) || "auto";
  },
  setTheme(value) {
    localStorage.setItem(KEYS.theme, value);
    applyTheme(value);
    emit("trellis:theme-changed", { theme: value });
  },
};

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
}

applyTheme(state.getTheme());
