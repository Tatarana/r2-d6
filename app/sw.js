// sw.js - pre-cache do shell no install; depois network-first (timeout 3 s) com fallback ao cache.
// Assim atualizacoes chegam sozinhas e o app segue funcionando offline. Mude CACHE so para limpar caches antigos.
const CACHE = 'r2d6-shell-v2';
const TIMEOUT_MS = 3000;
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'css/app.css', 'data/bundle.json',
  'js/main.js', 'js/dice.js', 'js/rules.js', 'js/store.js', 'js/state.js', 'js/data.js', 'js/util.js', 'js/markdown.js', 'js/seals.js', 'js/layout.js',
  'js/views/reference.js', 'js/views/sheet.js', 'js/views/print.js', 'js/views/mesa.js', 'js/views/creation.js', 'js/views/characters.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const res = await fetch(req, { signal: ctl.signal, cache: 'no-cache' });
    clearTimeout(t);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
    return Response.error();
  }
}
