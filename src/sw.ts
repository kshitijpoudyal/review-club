/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Every new deploy ships a new service worker — take over immediately instead
// of leaving it "waiting" until every open tab is closed. Without this, a
// device that's visited across several deploys can end up straddling two
// SW versions and serving a mismatched mix of old/new cached assets.
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  })
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = { title: 'Review Club', body: 'You have an update.' };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: payload.tag,
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const target = new URL(url, self.location.origin);
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = allClients.find((c) => new URL(c.url).pathname === target.pathname) as
        | WindowClient
        | undefined;
      if (existing) {
        const focused = (await existing.focus()) ?? existing;
        // Same path but different query (e.g. a status filter): load the
        // exact URL so the page picks the filter up.
        if (new URL(focused.url).search !== target.search && 'navigate' in focused) {
          await focused.navigate(target.href);
        }
      } else {
        await self.clients.openWindow(url);
      }
    })()
  );
});
