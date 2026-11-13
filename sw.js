/* Amable Life (antes Equilibra): service worker. Subir CACHE con cada versión (igual que VERSION en index.html). */
const CACHE = 'equilibra-v5.95';
const BASE = ['./', 'index.html', 'manifest.json', 'img/icono-life-192.png', 'img/gaia-2.jpg',
  'img/salud.jpg', 'img/pareja.jpg', 'img/familia.jpg', 'img/trabajo.jpg',
  'img/crecimiento.jpg', 'img/ocio.jpg', 'img/proposito.jpg', 'img/hogar.jpg', 'sonido/inicio.mp3'];

// 5.29: la copia sin conexión se baja del servidor (cache:'reload'), nunca de la caché del navegador
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  // solo sus propias cachés viejas (las de otras apps de gcalabro12.github.io no se tocan)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('equilibra-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // solo lo de Amable Life: el botón de Grow Panel y las otras apps de gcalabro12.github.io van siempre a la red
  if(!url.pathname.startsWith('/Amable-Life/')) return;   // 4.17: antes /Equilibra/
  if(e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('.apk') || url.pathname.endsWith('.mp4') || url.searchParams.has('v')) return;
  // 5.29 (receta de Amable Sleep): todo primero de la red, preguntando al servidor (GitHub Pages guarda 10 minutos); sin red, la copia guardada
  // (solo de su propia caché, no las de otras apps). Antes las imágenes iban primero de la caché.
  const nav = e.request.mode === 'navigate';
  e.respondWith(fetch(new Request(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}))
    .then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.open(CACHE).then(k => k.match(e.request, {ignoreSearch: true}).then(r => r || (nav ? k.match('index.html') : Response.error())))));
});
// al tocar un aviso de Amable Life: se abre (o se trae delante) la pestaña de la app
// 5.17: los botones de la alarma (Enterado, Posponer 5 min) se mandan a la app abierta sin traerla delante
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {}, acc = e.action;
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => {
    const mias = cs.filter(x => x.url.includes('/Amable-Life/')), c = mias[0];
    if(acc && d.ev && c){ mias.forEach(x => x.postMessage({tipo: 'alarma', acc, ev: d.ev, k: d.k, ul: d.ul})); return; }
    return c ? c.focus() : self.clients.openWindow('./');
  }));
});
