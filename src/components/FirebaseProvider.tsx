'use client';
/**
 * BETESEB FIREBASE PROVIDER
 * Initializes Firebase services (Analytics, Crashlytics, Push Notifications)
 * on the client side at app startup.
 * Drop this into the root layout to enable Firebase across all pages.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize Firebase services once at app mount
  useEffect(() => {
    initFirebaseServices();

    // Register Service Worker for offline-first support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[Service Worker] Registered successfully with scope:', reg.scope);
      }).catch((err) => {
        console.error('[Service Worker] Registration failed:', err);
      });
    }
  }, []);

  // Track page/screen views on route change
  useEffect(() => {
    if (!pathname) return;
    const screenName = pathname.replace(/^\/[a-z]{2}\//, '/').replace(/\//g, '_').slice(1) || 'home';
    import('@/lib/firebase-analytics').then(({ trackScreenView }) => {
      trackScreenView(screenName);
    });
  }, [pathname]);

  return <>{children}</>;
}

async function initFirebaseServices() {
  if (typeof window === 'undefined') return;

  // 1. Initialize Firebase App
  try {
    const { getFirebaseApp } = await import('@/lib/firebase');
    getFirebaseApp();
  } catch (e) {
    console.warn('[Firebase] App init warning:', e);
  }

  // 2. Initialize Firebase Analytics
  try {
    const { getFirebaseAnalytics } = await import('@/lib/firebase');
    await getFirebaseAnalytics();
    console.log('[Firebase] Analytics initialized.');
  } catch (e) {
    console.warn('[Firebase] Analytics warning:', e);
  }

  // 3. Initialize Crashlytics (native only)
  try {
    const { initCrashlytics } = await import('@/lib/firebase-crashlytics');
    await initCrashlytics();
  } catch (e) {
    console.warn('[Firebase] Crashlytics warning:', e);
  }

  // 4. Initialize AdMob (Native only)
  try {
    const { initializeAdMob } = await import('@/lib/ads');
    await initializeAdMob();
  } catch (e) {
    console.warn('[Firebase] AdMob warning:', e);
  }

  // 5. Register Push Notifications (delayed slightly to avoid pop-up collision during splash load)
  try {
    const { registerPushNotifications } = await import('@/lib/push-notifications');
    setTimeout(() => {
      registerPushNotifications().catch((err) => console.warn('[FCM] Push registration warning:', err));
    }, 2500);
  } catch (e) {
    console.warn('[Firebase] Push registration error:', e);
  }
}
