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

  try {
    // 1. Initialize Firebase app
    const { getFirebaseApp } = await import('@/lib/firebase');
    getFirebaseApp(); // Singleton — safe to call multiple times

    // 2. Initialize Firebase Analytics
    const { getFirebaseAnalytics } = await import('@/lib/firebase');
    await getFirebaseAnalytics();
    console.log('[Firebase] Analytics initialized.');

    // 3. Initialize Crashlytics (native only)
    const { initCrashlytics } = await import('@/lib/firebase-crashlytics');
    await initCrashlytics();

    // 4. Register Push Notifications
    const { registerPushNotifications } = await import('@/lib/push-notifications');
    await registerPushNotifications();

    console.log('[Firebase] All services initialized.');
  } catch (e) {
    console.warn('[Firebase] Service initialization warning:', e);
  }
}
