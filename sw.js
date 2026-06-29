// sw.js — The Final Third Service Worker
const CACHE = 'tft-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());

// ── Push event — fired when server sends a push ──────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'The Final Third';
  const options = {
    body: data.body || 'New update from The Final Third',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'tft-notification',
    renotify: true,
    data: { url: data.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — open the site ──────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const client of list) {
      if (client.url.includes('final-third') && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});

// ── Background sync — check for new posts ───────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-new-post') {
    e.waitUntil(checkNewPost());
  }
});

async function checkNewPost() {
  try {
    const res = await fetch('/latest-post.json?t=' + Date.now());
    const data = await res.json();
    const cache = await caches.open(CACHE);
    const cached = await cache.match('latest-post-id');
    const cachedId = cached ? await cached.text() : null;
    if (data.id && data.id !== cachedId) {
      await cache.put('latest-post-id', new Response(data.id));
      await self.registration.showNotification('New analysis: ' + data.title, {
        body: data.summary,
        icon: '/icon-192.png',
        tag: 'new-post-' + data.id,
        data: { url: '/' + data.file }
      });
    }
  } catch(e) {}
}
