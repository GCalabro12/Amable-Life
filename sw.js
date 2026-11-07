/* Amable Life (antes Equilibra): service worker. Subir CACHE con cada versión (igual que VERSION en index.html). */
const CACHE = 'equilibra-v4.22';
const BASE = ['./', 'index.html', 'manifest.json', 'img/icono-life-192.png',
  'img/salud.jpg', 'img/pareja.jpg', 'img/familia.jpg', 'img/trabajo.jpg',
  'img/crecimiento.jpg', 'img/ocio.jpg', 'img/proposito.jpg', 'img/hogar.jpg', 'sonido/inicio.mp3'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  // solo sus propias cachés viejas (las de otras apps de gcalabro12.github.io no se tocan)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('equilibra-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // solo lo de Amable Life: el botón de Grow Panel y las otras apps de gcalabro12.github.io van siempre a la red
  if(!url.pathname.startsWith('/Amable-Life/')) return;   // 4.17: antes /Equilibra/
  if(e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('.apk') || url.searchParams.has('v')) return;
  // La página, primero de la red (para recibir versiones nuevas); las imágenes, primero de la caché
  if(e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')){
    // sin caché del navegador (GitHub Pages deja guardada la página 10 minutos)
    e.respondWith(fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
      .catch(() => caches.open(CACHE).then(k => k.match(e.request).then(r => r || k.match('index.html')))));
  }else{
    e.respondWith(caches.open(CACHE).then(k => k.match(e.request)).then(r => r || fetch(e.request)));   // solo su propia caché, no las de otras apps
  }
});
// al tocar un aviso de Amable Life: se abre (o se trae delante) la pestaña de la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => {
    const c = cs.find(x => x.url.includes('/Amable-Life/'));
    return c ? c.focus() : self.clients.openWindow('./');
  }));
});
