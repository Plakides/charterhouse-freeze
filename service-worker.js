const BUILD = "8I1";
const CACHE_PREFIX = "charterhouse-freeze-static-";
const CACHE_NAME = "charterhouse-freeze-static-8I1";
const PRECACHE_URLS = [
  "./",
  "./assets/branding/baden-powell.png",
  "./assets/branding/charterhouse-logo.png",
  "./assets/branding/portman.png",
  "./assets/branding/thackeray.png",
  "./assets/branding/wesley.png",
  "./assets/challenge-1/amina-card.png",
  "./assets/challenge-1/daniyar-card.png",
  "./assets/challenge-1/sofia-card.png",
  "./assets/challenge-1/timur-card.png",
  "./assets/game/final-scene-snowy.svg",
  "./assets/game/final-scene-thawed.svg",
  "./assets/game/final-scene.svg",
  "./assets/game/ice-cracks.svg",
  "./assets/kazakh-pattern.svg",
  "./assets/mountain-silhouette.svg",
  "./css/animations.css",
  "./css/components.css",
  "./css/main.css",
  "./index.html",
  "./js/answer-engine.js",
  "./js/api.js",
  "./js/app.js",
  "./js/challenges/challenge-01-logic.js",
  "./js/challenges/challenge-02-almaty.js",
  "./js/challenges/challenge-03-language.js",
  "./js/challenges/challenge-04-telegram.js",
  "./js/challenges/challenge-05-timetable.js",
  "./js/challenges/challenge-06-brain-freeze.js",
  "./js/challenges/challenge-07-crossword.js",
  "./js/challenges/challenge-08-memory.js",
  "./js/challenges/registry.js",
  "./js/config.js",
  "./js/diagnostics.js",
  "./js/field-kit.js",
  "./js/leaderboard.js",
  "./js/pwa.js",
  "./js/recovery.js",
  "./js/state.js",
  "./js/sync-queue.js",
  "./js/sync-transport.js",
  "./leaderboard.html",
  "./manifest.webmanifest"
];

function scopeUrl(relative) {
  return new URL(relative, self.registration.scope).toString();
}

async function precacheAll() {
  const cache = await caches.open(CACHE_NAME);
  const requests = PRECACHE_URLS.map(relative =>
    new Request(scopeUrl(relative), { cache: "reload" })
  );
  await cache.addAll(requests);
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await precacheAll();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function cachedResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(request, { ignoreSearch: true });
}

async function cacheNetworkResponse(request, response) {
  if (!response || !response.ok || response.type !== "basic") return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  if (url.origin !== scope.origin) return;
  if (!url.pathname.startsWith(scope.pathname)) return;

  event.respondWith((async () => {
    const cached = await cachedResponse(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      return cacheNetworkResponse(request, response);
    } catch (error) {
      if (request.mode === "navigate") {
        const fallbackName = url.pathname.endsWith("/leaderboard.html")
          ? "./leaderboard.html"
          : "./index.html";
        const fallback = await caches.match(scopeUrl(fallbackName), { ignoreSearch: true });
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type !== "CHECK_OFFLINE_READY") return;

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const matches = await Promise.all(
      PRECACHE_URLS.map(relative => cache.match(scopeUrl(relative), { ignoreSearch: true }))
    );
    const missing = PRECACHE_URLS.filter((_, index) => !matches[index]);
    const reply = {
      type: "OFFLINE_READY_RESULT",
      build: BUILD,
      ready: missing.length === 0,
      cachedItems: PRECACHE_URLS.length - missing.length,
      requiredItems: PRECACHE_URLS.length,
      missing
    };
    if (event.ports?.[0]) event.ports[0].postMessage(reply);
  })());
});
