/* Myenge ma Bonakristo — service worker (offline reading). Keep in sync with
   src/components/offline/offline-store.ts (DATA_CACHE, BUNDLE_URL). */
const VERSION = "v3";
const STATIC = `mmb-static-${VERSION}`;
const PAGES = "mmb-pages";
const DATA = "mmb-data";
const MAX_PAGES = 400;
const PRECACHE = ["/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];
const PRIVATE = /^\/(admin|dashboard|auth|api)(\/|$)/;

/**
 * The offline reader must work even if it was never opened: cache its HTML and every script, style
 * and font it references (Next lists them all in the page, including lazily loaded chunks).
 */
async function cacheOfflineReader() {
  const cache = await caches.open(STATIC);
  const res = await fetch("/offline", { cache: "no-store" });
  if (!res.ok) return;
  const html = await res.clone().text();
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
  await Promise.all(assets.map((u) => caches.match(u).then((hit) => hit || cache.add(u)).catch(() => undefined)));
  await cache.put("/offline", res);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => undefined))))
      .then(() => cacheOfflineReader().catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

// Sent by the page after its background sync, so the reader follows new deploys.
self.addEventListener("message", (event) => {
  if (event.data === "refresh-offline") event.waitUntil(cacheOfflineReader().catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("mmb-static-") && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) (await caches.open(STATIC)).put(request, res.clone());
  return res;
}

async function pageNetworkFirst(request, url) {
  try {
    const res = await fetch(request);
    if (res.ok && !PRIVATE.test(url.pathname)) {
      const copy = res.clone();
      caches.open(PAGES).then((c) => c.put(request, copy)).then(() => trim(PAGES, MAX_PAGES));
    }
    return res;
  } catch {
    const cached = (await caches.match(request, { ignoreVary: true })) || (await caches.match(url.pathname, { ignoreSearch: true }));
    if (cached) return cached;
    const m = /^\/songs\/(\d+)/.exec(url.pathname);
    return Response.redirect(m ? `/offline?n=${m[1]}` : "/offline", 302);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.svg") {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname === "/api/offline/bundle") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA).then((c) => c.put("/api/offline/bundle", copy));
          }
          return res;
        })
        .catch(() => caches.match("/api/offline/bundle").then((r) => r || Response.error())),
    );
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(request, url));
  }
  // Everything else (RSC payloads, API): network only. When it fails offline, Next falls
  // back to a full navigation, which the handler above serves from the cache.
});
