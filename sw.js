var CACHE_NAME = 'albowry-v15';
var urls = ['./', './index.html', './style.css', './mobile.css', './app.js', './manual.js', './history.js', './manifest.json', './logo.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urls).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      var promises = [];
      for (var i = 0; i < names.length; i++) {
        if (names[i] !== CACHE_NAME) {
          promises.push(caches.delete(names[i]));
        }
      }
      return Promise.all(promises);
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (url.indexOf('firebase') > -1 || url.indexOf('firestore') > -1 || url.indexOf('googleapis') > -1 || url.indexOf('gstatic') > -1 || url.indexOf('cdnjs') > -1) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
