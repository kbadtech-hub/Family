/**
 * BETESEB FIREBASE CONFIGURATION
 * Firebase SDK initialization for Web + Capacitor Native Shell.
 * Used for: FCM Push Notifications, Analytics, Crashlytics.
 * Supabase remains the primary database/auth backend.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getMessaging, Messaging } from 'firebase/messaging';

// Firebase project configuration
// Get these from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Singleton Firebase App instance
let firebaseApp: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Initialize Firebase App (singleton pattern to avoid duplicate initialization)
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null; // Server-side guard

  // Check if Firebase config is provided
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase: Missing configuration. Add NEXT_PUBLIC_FIREBASE_* to .env.local');
    return null;
  }

  // Return existing app or initialize new
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

/**
 * Get Firebase Analytics instance (Web only, gracefully disabled on unsupported environments)
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;

  try {
    const app = getFirebaseApp();
    if (!app) return null;

    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Analytics not supported in this environment.');
      return null;
    }

    if (!analyticsInstance) {
      analyticsInstance = getAnalytics(app);
    }
    return analyticsInstance;
  } catch (e) {
    console.warn('Firebase Analytics init error:', e);
    return null;
  }
}

/**
 * Get Firebase Messaging instance (Web Push, not native)
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;

  try {
    const app = getFirebaseApp();
    if (!app) return null;

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (e) {
    console.warn('Firebase Messaging init error:', e);
    return null;
  }
}
