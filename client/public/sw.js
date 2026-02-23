const CACHE_NAME = "czech-trip-v1";
const API_CACHE = "czech-trip-api-v1";
const PHOTO_CACHE = "czech-trip-photos-v1";

const STATIC_ASSETS = [
  "/",
  "/favicon.png",
  "/manifest.json",
];

const API_ROUTES = [
  "/api/trip-days",
  "/api/accommodations",
  "/api/currency-rates",
  "/api/tips",
  "/api/photos",
  "/api/family-members",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE && k !== PHOTO_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/uploads/")) {
    event.respondWith(
      caches.open(PHOTO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => new Response("", { status: 404 }));
        })
      )
    );
    return;
  }

  if (API_ROUTES.some((r) => url.pathname === r) || url.pathname.match(/^\/api\/trip-days\/\d+\/(events|attractions)$/)) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request).then((cached) => cached || new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } })))
      )
    );
    return;
  }

  if (event.request.method === "GET" && !url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached || caches.match("/"));
        return cached || fetched;
      })
    );
    return;
  }
});