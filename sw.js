const CACHE = 'aya-kf-v5';
const ASSETS = ['./index.html', './manifest.json'];

// ── Install ────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: wipe all old caches ─────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE))
      .then(c => c.addAll(ASSETS))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Network-first for HTML
  if(url.pathname === '/' || url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if(res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for assets
  e.respondWith(
    caches.match(e.request).then(r => r ||
      fetch(e.request).then(res => {
        if(res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
    )
  );
});

// ── Skip waiting on request ────────────────────────────────────
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
