// Erzeugt von werkzeuge/handy_bauen.py – macht die Quizfabrik offline-fähig
const CACHE = 'quizfabrik-7-7371ebf2759b';
const DATEIEN = [
  "./",
  "./app.js",
  "./atkinson-hyperlegible-400-latin-ext.woff2",
  "./atkinson-hyperlegible-400-latin.woff2",
  "./atkinson-hyperlegible-700-latin-ext.woff2",
  "./atkinson-hyperlegible-700-latin.woff2",
  "./bricolage-grotesque-500-800-latin-ext.woff2",
  "./bricolage-grotesque-500-800-latin.woff2",
  "./favicon.ico",
  "./fonts.css",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./index.html",
  "./lokal-api.js",
  "./manifest.webmanifest",
  "./quizze-daten.js",
  "./style.css"
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Erst aus dem Speicher (offline), sonst aus dem Netz; Seitenaufrufe fallen auf index.html zurück
  e.respondWith(caches.match(e.request, { ignoreSearch: true })
    .then((r) => r || fetch(e.request).catch(() => caches.match('./index.html'))));
});
