const CACHE_NAME = 'oclean';

// List ALL your assets here for offline caching
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './statics/ship.png',
  './statics/hook.png',
  './statics/fishes/fish1.png',
  './statics/fishes/fish2.png',
  './statics/fishes/fish3.png',
  './statics/fishes/fish4.png',
  './statics/fishes/fish5.png',
  './statics/trashes/trash1.png',
  './statics/trashes/trash2.png',
  './statics/trashes/trash3.png',
  './statics/trashes/trash4.png',
  './statics/trashes/trash5.png',
  'https://cdn.tailwindcss.com'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('Service Worker: Cache failed', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache new resources
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        // If both cache and network fail, you could return a fallback page
        console.log('Service Worker: Fetch failed for', event.request.url);
      })
  );
});