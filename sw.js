// Increment when any offline page or asset changes.
const CACHE = 'vietnam-trip-offline-v1';
const FILES = ['./', './index.html', './vietnam-map.html', './hanoi-food.html',
  './trip-itinerary.html', './trip-expenses.html', './pins.json', './offline.js'];
const URLS = new Set(FILES.map(path => new URL(path, self.location).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('vietnam-trip-offline-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  url.search = ''; url.hash = '';
  if (event.request.method !== 'GET' || !URLS.has(url.href)) return;
  // Keep one coherent offline version; an updated worker refreshes all files together.
  event.respondWith(caches.open(CACHE).then(async cache =>
    (await cache.match(url.href)) || fetch(event.request)));
});
