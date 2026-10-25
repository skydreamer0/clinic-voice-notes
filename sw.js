/* Cache only this app's static shell; never inspect/store note contents. */
const CACHE_PREFIX = `clinic-mobile-shell-${encodeURIComponent(self.registration.scope)}-`;
const CACHE = `${CACHE_PREFIX}a6a5157ea96d3fa9ff20`;
const ASSETS = ['./','./index.html','./styles.css','./app.js','./state.js','./manifest.webmanifest','./icons/app.svg'];
const allowed = new Set(ASSETS.map(path => new URL(path,self.registration.scope).href));
self.addEventListener('install',event => {event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...allowed])));});
// No skipWaiting/clients.claim: no forced reload or mid-session replacement.
self.addEventListener('activate',event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))));});
self.addEventListener('fetch',event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.search || !allowed.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request)).then(cached => cached || fetch(request)));
});
