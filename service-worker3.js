const CACHE_NAME = 'door-guard-v7';
const FILES_TO_CACHE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Throw away every older cache. Without this, caches.match() below can
  // still find a stale copy of the page in a previous version's cache.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Tapping the alarm notification brings the app back to the front.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list){
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});

// Network first, cache only as an offline fallback. The old cache-first
// version meant a redeployed page could never reach you.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, copy))
          .catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request, { cacheName: CACHE_NAME }))
  );
});
