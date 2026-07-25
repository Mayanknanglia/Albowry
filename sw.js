const CACHE = 'albowry-v8';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firebase') || e.request.url.includes('gstatic') || e.request.url.includes('cdnjs')) return;
});
