const CACHE_NAME = 'timerra-v2-cache';
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install Event - Pre-cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Timerra SW] Pre-caching core skeleton assets');
      return cache.addAll(PRE_CACHE_ASSETS).catch(err => {
        console.warn('[Timerra SW] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Timerra SW] Clearing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper to determine if a request should be cached
const shouldCache = (request) => {
  if (request.method !== 'GET') return false;
  
  const url = request.url;
  
  // Exclude API calls and system services
  if (url.includes('/api/') || url.includes('chrome-extension') || url.includes('sockjs-node')) {
    return false;
  }
  
  // Cache local origin requests, google fonts, and unpkg/jsdelivr assets
  const isLocal = url.startsWith(self.location.origin);
  const isGoogleFont = url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
  const isCdn = url.includes('unpkg.com') || url.includes('jsdelivr.net');
  
  return isLocal || isGoogleFont || isCdn;
};

// Network-First, falling back to cache Strategy
self.addEventListener('fetch', (event) => {
  if (!shouldCache(event.request)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we get a valid response, cache it and return it
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch((err) => {
        console.log('[Timerra SW] Network failed, searching cache for:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If both network and cache fail, return fallback for html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          throw err;
        });
      })
  );
});
