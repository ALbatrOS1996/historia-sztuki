// Service worker: powłoka aplikacji w pamięci podręcznej, ilustracje i czcionki zapamiętywane przy pierwszym użyciu.
const V = 'ars-26c613fedb';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ars-') && k !== V && k !== 'ars-img').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isImg = u.pathname.includes('/img/');
  const isFont = u.host.includes('fonts.g');
  if (isImg || isFont) {
    e.respondWith(caches.open(isImg ? 'ars-img' : V).then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && u.origin === location.origin) { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
