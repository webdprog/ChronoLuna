// ChronoLuna Service Worker
// Provides offline support and enables PWA installability on GitHub Pages

const CACHE_NAME = 'chronoluna-v1';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  // Google Fonts — cache the CSS and font files
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&family=Noto+Serif+SC:wght@400;700&display=swap',
];

// ── INSTALL: pre-cache the app shell ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        // If some resources fail (e.g. fonts offline during install), continue
        console.warn('[SW] Some resources failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: network-first for API calls, cache-first for app shell ──────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for Supabase API calls — never cache DB responses
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.com')) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({ error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // For CDN scripts (Supabase SDK etc.) — network first, fall back to cache
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('cdnjs')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For everything else (app shell, fonts) — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and no cache, return the app shell for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'ChronoLuna 🏮', {
      body: data.body || 'You have an upcoming event!',
      icon: './icon-192.svg',
      badge: './icon-192.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'chronoluna',
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || './')
  );
});
