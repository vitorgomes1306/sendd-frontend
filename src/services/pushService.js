
import api from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPush() {
    console.log('[PushService] Initializing subscription...');

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('[PushService] Push notifications not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        console.log('[PushService] Service Worker ready:', registration);

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            console.log('[PushService] No existing subscription. Requesting new one...');

            if (!VAPID_PUBLIC_KEY) {
                console.error('[PushService] VAPID Public Key not found in env');
                return;
            }

            const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            console.log('[PushService] New Subscription created:', subscription);
        } else {
            console.log('[PushService] Found existing subscription:', subscription);
        }

        // Send to backend
        console.log('[PushService] Sending subscription to backend...');
        const response = await api.post('/private/notifications/subscribe', { subscription });
        console.log('[PushService] Backend response:', response.data);

    } catch (error) {
        console.error('[PushService] Failed to subscribe to push:', error);
    }
}
