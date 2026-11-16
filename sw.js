// Simple offline cache for a static GitHub Pages PWA (versioned for updates).
const CACHE = 'puzzle-box-v2-drag';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest', './icons/icon.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './src/app.js', './src/block-drag.js', './src/storage.js', './src/sudoku.js', './src/gates.js', './src/blocks.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
