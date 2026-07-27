// AL BOWRY CARPENTRY LLC - Service Worker v16
var CACHE_NAME = 'albowry-v16';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './mobile.css',
  './app.js',
  './manual.js',
  './history.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).catch(function(err) {
      console.log('[SW] Cache install error:', err);
    })
  );
});

// Activate - clear old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch - Network first for Firebase/CDN, Cache first for assets
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Skip Firebase, CDN, Google APIs - always network
  if (
    url.indexOf('firestore.googleapis.com') !== -1 ||
    url.indexOf('firebase') !== -1 ||
    url.indexOf('gstatic.com') !== -1 ||
    url.indexOf('googleapis.com') !== -1 ||
    url.indexOf('cdnjs.cloudflare.com') !== -1 ||
    url.indexOf('fonts.googleapis.com') !== -1 ||
    url.indexOf('fonts.gstatic.com') !== -1
  ) {
    return;
  }

  // For same-origin assets: Cache first, then network
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, response);
            });
          }
        }).catch(function() {});
        return cached;
      }

      // Not in cache - fetch from network
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200 && e.request.method === 'GET') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback
        return caches.match('./index.html');
      });
    })
  );
});

// Message handler
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'GET_VERSION') {
    e.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] AL BOWRY v16 Service Worker loaded');
