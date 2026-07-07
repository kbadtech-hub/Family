// BETESEB Firebase Cloud Messaging Service Worker
// Required for web background push notifications
// This file must be placed at /public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Firebase config — same as your web app config
const firebaseConfig = {
  apiKey:            self.FIREBASE_API_KEY || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN || '',
  projectId:         self.FIREBASE_PROJECT_ID || '',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.FIREBASE_APP_ID || '',
};

// Initialize Firebase in service worker scope
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (when app is closed or not focused)
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW:FCM] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Beteseb';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    image: payload.notification?.image,
    data: payload.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open App' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click → open app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  if (data.type === 'new_message') {
    url = `/dashboard?tab=chat&match=${data.matchId || ''}`;
  } else if (data.type === 'new_match') {
    url = '/dashboard';
  } else if (data.type === 'payment_approved') {
    url = '/dashboard?tab=payment';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Focus existing window if open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
