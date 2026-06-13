/* ========================================
   SERVICE WORKER — Workbox + FCM
   ======================================== */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

/* ===== Push (mobile PWAs need explicit handler) ===== */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let title = 'Spendly Reminder';
    let options = { body: "Don't forget to log your expenses today!", icon: '/icon-192.png' };

    try {
        const payload = event.data.json();
        const n = payload.notification || {};
        if (n.title) title = n.title;
        if (n.body) options.body = n.body;
        if (n.icon) options.icon = n.icon;
    } catch { /* use defaults */ }

    event.waitUntil(self.registration.showNotification(title, options));
});

/* ===== Notification Click ===== */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
