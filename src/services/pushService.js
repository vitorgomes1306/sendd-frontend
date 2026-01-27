
import { api } from './api';

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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log('User is already subscribed to push');
            // send to backend just in case to ensure it's synced (idempotent on backend)
            await api.post('/private/notifications/subscribe', { subscription: existingSubscription });
            return;
        }

        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID Public Key not found in env');
            return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        console.log('Push Subscription successful:', subscription);

        // Send to backend
        await api.post('/private/notifications/subscribe', { subscription });

    } catch (error) {
        console.error('Failed to subscribe to push:', error);
    }
}
