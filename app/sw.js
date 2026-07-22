const CACHE_NAME = "trellis-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.webmanifest",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./js/main.js",
  "./js/router.js",
  "./js/state.js",
  "./js/data.js",
  "./js/toast.js",
  "./js/components/glass-card.js",
  "./js/components/progress-ring.js",
  "./js/components/nav-bar.js",
  "./js/components/demo-badge.js",
  "./js/views/today-view.js",
  "./js/views/timeline-view.js",
  "./js/views/literature-view.js",
  "./js/views/checklist-view.js",
  "./js/views/settings-view.js",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShellFile = url.origin === location.origin && url.pathname.includes("/app/");

  if (!isShellFile || event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
