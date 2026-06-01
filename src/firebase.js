/* ========================================
   FIREBASE — FCM client init & token
   ======================================== */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken as fcmGetToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

function init() {
    if (!app) {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    }
    return messaging;
}

async function getSwRegistration() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) return registrations[0];
    return navigator.serviceWorker.register('/firebase-messaging-sw.js');
}

export async function requestToken() {
    const m = init();
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permission denied');

    const swReg = await getSwRegistration();
    const token = await fcmGetToken(m, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
    });
    return token;
}

export function onForegroundMessage(callback) {
    const m = init();
    onMessage(m, (payload) => {
        if (callback) callback(payload);
    });
}
