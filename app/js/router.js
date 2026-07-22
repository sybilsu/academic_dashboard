const ROUTES = ["today", "timeline", "literature", "checklist", "settings"];

function currentRoute() {
  const route = (location.hash || "#today").slice(1).split("?")[0];
  return ROUTES.includes(route) ? route : "today";
}

export function initRouter(views) {
  function apply() {
    const target = currentRoute();
    for (const [name, el] of Object.entries(views)) {
      const active = name === target;
      el.classList.toggle("active", active);
      if (active && typeof el.onActivate === "function") el.onActivate();
    }
  }

  window.addEventListener("hashchange", apply);
  apply();

  return { refresh: apply, currentRoute };
}
