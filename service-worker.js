const CACHE_NAME = "spirit-farm-game-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./concept-v2/styles.css",
  "./concept-v2/app.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/concept-v2/oasis.png",
  "./assets/concept-v2/tasks.png",
  "./assets/concept-v2/mountain.png",
  "./assets/concept-v2/observatory.png",
  "./assets/concept-v2/trees/health.png",
  "./assets/concept-v2/trees/wisdom.png",
  "./assets/concept-v2/trees/wealth.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
