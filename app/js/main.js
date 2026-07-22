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

const root = document.getElementById("view-root");
const views = {
  today: document.createElement("today-view"),
  timeline: document.createElement("timeline-view"),
  literature: document.createElement("literature-view"),
  checklist: document.createElement("checklist-view"),
  settings: document.createElement("settings-view"),
};

for (const el of Object.values(views)) root.appendChild(el);

initRouter(views);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline shell caching is a progressive enhancement, ignore failures */
    });
  });
}
