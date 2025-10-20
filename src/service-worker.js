const CACHE_NAME = 'oclean-v1.0.0';
const STATIC_ASSETS = [
    './',
    './index.html',
    './index.css',
    './game.js',
    './manifest.json',
    './statics/ship.png',
    './statics/hook.png',
    'https://cdn.tailwindcss.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached');
                return self.skipWaiting();
            })
            .catch((err) => console.error('[SW] Cache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Service worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - cache-first strategy with dynamic caching
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle image requests specially
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    // Only cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    console.log('[SW] Fetch failed for:', request.url);
                    // Return a placeholder or continue without the image
                    return new Response('', { status: 404, statusText: 'Not Found' });
                });
            })
        );
        return;
    }

    // Cache-first strategy for other assets
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, response.clone());
                    return response;
                });
            }).catch(() => {
                console.log('[SW] Fetch failed for:', request.url);
            });
        })
    );
});

// Message event - for manual cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});