const CACHE_NAME = 'buddio-pwa-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k))),
    ).then(() => clients.claim())
  );
});

// Do not intercept or hijack application page navigations or API calls
// Let the browser handle network requests naturally so 401s and auth redirects aren't mangled.
self.addEventListener('fetch', (event) => {
  // Pass-through to avoid TypeError: Failed to convert value to 'Response'
  return;
});

// Push notification handling
self.addEventListener('push', (event) => {
  let data = {
    title: 'Buddio Alert',
    body: 'You have a scheduled reminder or task update.',
    icon: '/buddio-icon.png',
    badge: '/buddio-icon.png',
    url: '/dashboard',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/buddio-icon.png',
      badge: data.badge || '/buddio-icon.png',
      data: { url: data.url || '/dashboard' },
      vibrate: [100, 50, 100],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
