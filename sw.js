const CACHE_NAME='albowry-v11';
const urls=['./','./index.html','./style.css','./mobile.css','./app.js','./manual.js','./manifest.json','./logo.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urls).catch(()=>{})));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(n=>Promise.all(n.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.url.includes('firebase')||e.request.url.includes('firestore')||e.request.url.includes('googleapis')||e.request.url.includes('gstatic')||e.request.url.includes('cdnjs'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))));});
