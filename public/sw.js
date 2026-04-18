const CACHE_NAME = 'stefy-beauty-v2'; // Incremented version to clear old broken cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Use Network First strategy for all requests to ensure updates are picked up
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clear old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network First strategy (especially for index.html and manifest)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, update the cache
        if (response.status === 200 && (event.request.url.startsWith(self.location.origin) || ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname))) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline, try the cache
        return caches.match(event.request);
      })
  );
});
