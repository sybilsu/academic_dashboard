import "./components/glass-card.js";
import "./components/progress-ring.js";
import "./components/nav-bar.js";
import "./components/demo-badge.js";

import "./views/today-view.js";
import "./views/timeline-view.js";
import "./views/literature-view.js";
import "./views/checklist-view.js";
import "./views/settings-view.js";

import { initRouter } from "./router.js";
import { state } from "./state.js";
import { syncAll } from "./github.js";

const root = document.getElementById("view-root");
const views = {
  today: document.createElement("today-view"),
  timeline: document.createElement("timeline-view"),
  literature: document.createElement("literature-view"),
  checklist: document.createElement("checklist-view"),
  settings: document.createElement("settings-view"),
};

for (const el of Object.values(views)) root.appendChild(el);

const router = initRouter(views);

function backgroundSync() {
  if (!state.getPat() || state.getDemoMode()) return;
  syncAll({ silent: true })
    .then(({ inbox, checklist }) => {
      if (inbox.synced || checklist.synced) router.refresh();
    })
    .catch((err) => console.warn("background sync failed", err));
}

window.addEventListener("load", backgroundSync);
window.addEventListener("online", backgroundSync);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline shell caching is a progressive enhancement, ignore failures */
    });
  });
}
