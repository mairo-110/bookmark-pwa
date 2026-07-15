const CACHE_NAME = 'bookmark-pwa-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './setting.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/appp.js',
  './js/bookmark.js',
  './js/render.js',
  './js/router.js',
  './js/settings.js',
  './js/storage.js',
  './js/providers/default.js',
  './js/providers/provider1.js',
  './js/providers/provider2.js',
  './js/providers/provider3.js',
  './js/providers/shared.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

async function respondWithNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cachedIndex = await caches.match('./index.html');
    return cachedIndex ?? caches.match('./setting.html');
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(respondWithNavigation(event.request));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(async (networkResponse) => {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }),
    );
  }
});