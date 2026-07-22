const TABS = [
  { route: "today", label: "今天", icon: "🏠" },
  { route: "timeline", label: "時間軸", icon: "🗓️" },
  { route: "literature", label: "文獻", icon: "📚" },
  { route: "checklist", label: "檢核", icon: "✅" },
  { route: "settings", label: "設定", icon: "⚙️" },
];

export class NavBar extends HTMLElement {
  connectedCallback() {
    const inner = document.createElement("div");
    inner.className = "nav-inner glass";

    for (const tab of TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-tab";
      btn.dataset.route = tab.route;
      btn.innerHTML = `<span class="icon" aria-hidden="true">${tab.icon}</span><span>${tab.label}</span>`;
      btn.addEventListener("click", () => {
        location.hash = "#" + tab.route;
      });
      inner.appendChild(btn);
    }

    this.appendChild(inner);
    this.updateActive(this.currentRoute());
    window.addEventListener("hashchange", () => this.updateActive(this.currentRoute()));
  }

  currentRoute() {
    return (location.hash || "#today").slice(1).split("?")[0];
  }

  updateActive(route) {
    this.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === route);
    });
  }
}

customElements.define("nav-bar", NavBar);
