
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Push Notification Handler
self.addEventListener('push', (event) => {
    console.log('[SW] Push Received:', event.data ? event.data.text() : 'NO DATA');
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Nova Mensagem', body: event.data.text() };
        }
    } else {
        data = { title: 'Nova Mensagem', body: 'Você tem uma nova mensagem.' };
    }

    const options = {
        body: data.body || 'Conteúdo não disponível.',
        icon: data.icon || '/pwa-icon.png',
        badge: '/pwa-icon.png', // Small icon for android bar
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Sendd Chat', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open with the target URL
            const urlToOpen = event.notification.data.url || '/';

            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
