const CACHE_NAME = 'beteseb-offline-cache-v2';

// Core assets to cache immediately on SW install
const ASSETS_TO_CACHE = [
  '/',
  '/logo.png',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching initial assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Dynamic stale-while-revalidate strategy for same-origin and static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Cache only GET requests
  if (request.method !== 'GET') return;

  // Cache only same-origin requests or Google Fonts / static content
  const isAllowedOrigin = 
    url.origin.includes('beteseb1.online') || 
    url.origin.includes('localhost') || 
    url.origin.includes('googleapis.com') || 
    url.origin.includes('gstatic.com') ||
    url.origin.includes('unsplash.com');

  if (!isAllowedOrigin) return;

  // Do not cache API endpoints, Supabase calls, or OAuth callback handlers
  const isExcludedPath = 
    url.pathname.includes('/api/') || 
    url.pathname.includes('/__/auth') || 
    url.pathname.includes('/auth-callback') ||
    url.pathname.includes('/v1/'); // supabase paths

  if (isExcludedPath) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache successful GET responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Network request failed:', err);
      });

      // Serve from cache if available, else fetch from network
      return cachedResponse || fetchPromise;
    })
  );
});
