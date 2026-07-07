/**
 * BETESEB FIREBASE PUSH NOTIFICATIONS SERVICE
 * Handles FCM token registration and push notification routing.
 * On native (iOS/Android): uses @capacitor-firebase/messaging
 * On web: uses Firebase JS SDK Web Push
 */

import { supabase } from './supabase';

// ── Utility ──────────────────────────────────────────────────────────────────
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return 'web';
  return cap.getPlatform?.() === 'ios' ? 'ios' : 'android';
}

// ── Store FCM token in Supabase user profile ─────────────────────────────────
async function storeFcmToken(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_tokens')
      .eq('id', user.id)
      .single();

    const existing: string[] = profile?.fcm_tokens || [];
    if (!existing.includes(token)) {
      await supabase
        .from('profiles')
        .update({ fcm_tokens: [...existing, token] })
        .eq('id', user.id);
      console.log('[FCM] Token stored in Supabase profile.');
    }
  } catch (e) {
    console.error('[FCM] Failed to store token:', e);
  }
}

// ── NATIVE: iOS / Android via @capacitor-firebase/messaging ──────────────────
async function registerNativePushNotifications() {
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    // Request permission
    const { receive } = await FirebaseMessaging.requestPermissions();
    if (receive !== 'granted') {
      console.warn('[FCM] Push notification permission denied.');
      return;
    }

    // Get FCM token
    const { token } = await FirebaseMessaging.getToken();
    console.log('[FCM] Native token:', token);
    if (token) await storeFcmToken(token);

    // Listen for token refresh
    FirebaseMessaging.addListener('tokenReceived', async ({ token: newToken }) => {
      console.log('[FCM] Token refreshed:', newToken);
      if (newToken) await storeFcmToken(newToken);
    });

    // Foreground message handler — show in-app notification
    FirebaseMessaging.addListener('notificationReceived', ({ notification }) => {
      console.log('[FCM] Foreground notification:', notification);
      // Show custom in-app banner (handled by NotificationBanner component)
      window.dispatchEvent(new CustomEvent('beteseb:notification', { detail: notification }));
    });

    // Background / tap action handler
    FirebaseMessaging.addListener('notificationActionPerformed', ({ notification }) => {
      console.log('[FCM] Notification tapped:', notification);
      // Route to relevant screen based on data payload
      handleNotificationNavigation(notification?.data as Record<string, any> | undefined);
    });

    console.log('[FCM] Native push notifications registered successfully.');
  } catch (e) {
    console.error('[FCM] Native setup failed:', e);
  }
}

// ── WEB: Firebase JS SDK Web Push ────────────────────────────────────────────
async function registerWebPushNotifications() {
  try {
    const { getFirebaseMessaging } = await import('./firebase');
    const { getToken, onMessage } = await import('firebase/messaging');

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.warn('[FCM] Web messaging not available (missing Firebase config?)');
      return;
    }

    // Register service worker for background push
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY for web push.');
      return;
    }

    // Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Browser notification permission denied.');
      return;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log('[FCM] Web token:', token);
    if (token) await storeFcmToken(token);

    // Handle foreground web push messages
    onMessage(messaging, (payload) => {
      console.log('[FCM] Web foreground message:', payload);
      window.dispatchEvent(new CustomEvent('beteseb:notification', { detail: payload.notification }));
    });

    console.log('[FCM] Web push notifications registered successfully.');
  } catch (e) {
    console.warn('[FCM] Web push setup failed:', e);
  }
}

// ── Navigation handler for notification tap ──────────────────────────────────
function handleNotificationNavigation(data?: Record<string, any>) {
  if (!data) return;
  const locale = document.documentElement.lang || 'en';

  if (data.type === 'new_message') {
    window.location.href = `/${locale}/dashboard?tab=chat&match=${data.matchId}`;
  } else if (data.type === 'new_match') {
    window.location.href = `/${locale}/dashboard`;
  } else if (data.type === 'verification_approved') {
    window.location.href = `/${locale}/dashboard`;
  } else if (data.type === 'payment_approved') {
    window.location.href = `/${locale}/dashboard?tab=payment`;
  }
}

// ── Main entry point ─────────────────────────────────────────────────────────
/**
 * Call this once when the app loads (e.g., in root layout or dashboard).
 * Automatically routes to native or web push registration.
 */
export async function registerPushNotifications() {
  if (typeof window === 'undefined') return; // SSR guard

  try {
    if (isNativePlatform()) {
      console.log(`[FCM] Registering native push for platform: ${getPlatform()}`);
      await registerNativePushNotifications();
    } else {
      console.log('[FCM] Registering web push notifications...');
      await registerWebPushNotifications();
    }
  } catch (e) {
    console.error('[FCM] registerPushNotifications failed:', e);
  }
}

/**
 * Unregister FCM token (call on logout)
 */
export async function unregisterPushNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clear all stored FCM tokens for this user on logout
    await supabase
      .from('profiles')
      .update({ fcm_tokens: [] })
      .eq('id', user.id);

    if (isNativePlatform()) {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      await FirebaseMessaging.deleteToken();
    }

    console.log('[FCM] Push notifications unregistered.');
  } catch (e) {
    console.error('[FCM] Unregister failed:', e);
  }
}
