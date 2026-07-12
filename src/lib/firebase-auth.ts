/**
 * BETESEB FIREBASE SOCIAL AUTH
 * Handles Google and Facebook Social Login via Firebase Auth.
 * After Firebase Auth succeeds, we sync the user with Supabase
 * using the Firebase ID Token so RLS policies remain intact.
 *
 * HYBRID ARCHITECTURE:
 *  - Firebase Auth → handles Google + Facebook + Apple OAuth flow
 *  - Supabase     → remains primary database + RLS backend
 *  - Sync         → Firebase ID Token is used to create/update Supabase profile
 */

import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  linkWithCredential,
  PhoneAuthProvider,
} from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

// ─── Singleton Firebase Auth Instance ────────────────────────────────────────

let authInstance: Auth | null = null;

/**
 * Get (or create) the Firebase Auth instance.
 * Returns null on server side (SSR guard).
 */
export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (authInstance) return authInstance;

  const app = getFirebaseApp();
  if (!app) {
    console.warn('[FirebaseAuth] Firebase app not initialized.');
    return null;
  }

  authInstance = getAuth(app);
  return authInstance;
}

// ─── Social Login Result Type ─────────────────────────────────────────────────

export interface SocialAuthResult {
  success: boolean;
  isNewUser: boolean;
  hasPhone: boolean;
  firebaseUser: FirebaseUser | null;
  error?: string;
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────

/**
 * Opens a Google Sign-In popup.
 * On success, syncs the Firebase user with Supabase profiles table.
 */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not available');

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const syncRes = await syncFirebaseUserWithSupabase(firebaseUser);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser };
  } catch (error: any) {
    console.error('[FirebaseAuth] Google Sign-In error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}

// ─── Facebook Sign-In ─────────────────────────────────────────────────────────

/**
 * Opens a Facebook Sign-In popup.
 * On success, syncs the Firebase user with Supabase profiles table.
 */
export async function signInWithFacebook(): Promise<SocialAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not available');

    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');

    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const syncRes = await syncFirebaseUserWithSupabase(firebaseUser);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser };
  } catch (error: any) {
    console.error('[FirebaseAuth] Facebook Sign-In error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}

// ─── Apple Sign-In ────────────────────────────────────────────────────────────

/**
 * Opens an Apple Sign-In popup.
 * On success, syncs the Firebase user with Supabase profiles table.
 */
export async function signInWithApple(): Promise<SocialAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not available');

    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const syncRes = await syncFirebaseUserWithSupabase(firebaseUser);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser };
  } catch (error: any) {
    console.error('[FirebaseAuth] Apple Sign-In error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}

// ─── Supabase Sync via Server-Side API Route ──────────────────────────────────

interface SyncResult {
  isNewUser: boolean;
  hasPhone: boolean;
}

/**
 * After Firebase Auth succeeds, calls our secure server-side API route
 * to create/sync the user in Supabase auth.users + profiles table.
 */
async function syncFirebaseUserWithSupabase(firebaseUser: FirebaseUser): Promise<SyncResult> {
  // Get a fresh Firebase ID token to send to our server
  const idToken = await firebaseUser.getIdToken();

  const res = await fetch('/api/auth/firebase-sync', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    let errorMsg = '';
    try {
      const errData = await res.json();
      errorMsg = errData.error || `HTTP Error ${res.status}`;
    } catch {
      try {
        const text = await res.text();
        errorMsg = text ? (text.length > 200 ? `${text.substring(0, 200)}...` : text) : `HTTP Error ${res.status}`;
      } catch {
        errorMsg = `HTTP Error ${res.status}`;
      }
    }
    console.error('[FirebaseAuth] Sync API error:', errorMsg);
    throw new Error(errorMsg);
  }

  const data = await res.json();
  
  // Sign into Supabase client-side to set cookies and establish local session
  const { error: supabaseAuthError } = await supabase.auth.signInWithPassword({
    email:    data.loginEmail,
    password: data.derivedPassword
  });

  if (supabaseAuthError) {
    console.error('[FirebaseAuth] Client-side Supabase auth failed:', supabaseAuthError);
    throw new Error(supabaseAuthError.message || 'Failed to establish database session');
  }

  return {
    isNewUser: data.isNewUser === true,
    hasPhone: data.hasPhone === true
  };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Signs the user out of Firebase Auth.
 * Also signs out of Supabase to clear any local session.
 */
export async function socialSignOut(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    await supabase.auth.signOut();
  } catch (error) {
    console.error('[FirebaseAuth] Sign-out error:', error);
  }
}

// ─── Auth State Observer ──────────────────────────────────────────────────────

/**
 * Subscribe to Firebase Auth state changes.
 * Use this in pages/components to reactively know when a user logs in or out.
 */
export function onFirebaseAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ─── Error Translation ────────────────────────────────────────────────────────

function translateFirebaseError(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';
  
  // Extract error code if it's an object with a code property, or if it's a string. Otherwise, set code to undefined.
  const code = (error && typeof error === 'object' && 'code' in error) 
    ? error.code 
    : (typeof error === 'string' ? error : undefined);
  
  if (!code) {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) return error.message;
    return 'An unknown authentication error occurred.';
  }

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already in use by another account.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/weak-password':
      return 'The password is too weak. Must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please check and try again.';
    case 'auth/code-expired':
      return 'The verification code has expired. Please request a new one.';
    case 'auth/unauthorized-domain':
      return 'This domain or IP address is not authorized in your Firebase Console under Authorized Domains.';
    case 'auth/too-many-requests':
      return 'Too many SMS requests sent. Please wait a few minutes before trying again.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Please check the number and try again.';
    case 'auth/captcha-check-failed':
      return 'Security verification failed. Please refresh the page and try again.';
    case 'auth/internal-error':
      return 'Firebase internal error. Please try again in a moment.';
    case 'auth/missing-client-identifier':
      return 'Security check failed. Please ensure you are on the official site and try again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for this project. Please try again later.';
    case 'auth/app-not-authorized':
      return 'This app is not authorized to use Firebase Authentication. Please contact support.';
    default:
      const details = (error && typeof error === 'object' && error.message) ? `: ${error.message}` : '';
      return `Authentication error (${code || 'unknown'})${details}. Please try again.`;
  }
}

// ─── Email & Password Auth ───────────────────────────────────────────────────

/**
 * Registers a new user with Email & Password via Firebase Auth,
 * then syncs them with Supabase.
 */
export async function signUpWithEmail(email: string, password: string): Promise<SocialAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not available');

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const syncRes = await syncFirebaseUserWithSupabase(result.user);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser: result.user };
  } catch (error: any) {
    console.error('[FirebaseAuth] Email sign-up error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}

/**
 * Logs in an existing user with Email & Password via Firebase Auth,
 * then syncs/logs them into Supabase.
 */
export async function signInWithEmail(email: string, password: string): Promise<SocialAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not available');

    const result = await signInWithEmailAndPassword(auth, email, password);
    const syncRes = await syncFirebaseUserWithSupabase(result.user);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser: result.user };
  } catch (error: any) {
    console.error('[FirebaseAuth] Email login error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}

// ─── Phone OTP Auth ──────────────────────────────────────────────────────────

// Module-level singleton to track the active reCAPTCHA verifier.
// Having more than one active verifier causes "already initialized" errors.
let _recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Creates (or re-creates) the invisible reCAPTCHA verifier for Phone Auth.
 * Destroys any existing verifier + clears the DOM container first so every
 * call is idempotent and safe to call on retry.
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    // 1. Destroy any previously active verifier to prevent stale widget errors
    if (_recaptchaVerifier) {
      try {
        _recaptchaVerifier.clear();
      } catch (_) {
        // Ignore errors during cleanup — widget may already be gone
      }
      _recaptchaVerifier = null;
    }

    // 2. Clear the DOM container so no leftover iframes/widgets remain
    const element = document.getElementById(containerId);
    if (!element) {
      console.warn(`[FirebaseAuth] reCAPTCHA container #${containerId} not found.`);
      return null;
    }
    element.innerHTML = '';

    // 3. Create a fresh invisible verifier
    _recaptchaVerifier = new RecaptchaVerifier(auth, element, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved — phone auth will proceed automatically
      },
    });

    return _recaptchaVerifier;
  } catch (error) {
    console.error('[FirebaseAuth] reCAPTCHA initialization error:', error);
    _recaptchaVerifier = null;
    return null;
  }
}

/**
 * Sends a 6-digit SMS OTP to the provided phone number.
 * Returns a ConfirmationResult containing the verification flow reference.
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<{ success: boolean; confirmationResult: ConfirmationResult | null; error?: string }> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not available');

    // Sends real SMS using Google infrastructure
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return { success: true, confirmationResult };
  } catch (error: any) {
    console.error('[FirebaseAuth] Send OTP error:', error);
    const message = translateFirebaseError(error);
    return { success: false, confirmationResult: null, error: message };
  }
}

/**
 * Verifies the 6-digit SMS OTP code entered by the user.
 * On success, syncs the phone user with Supabase.
 */
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<SocialAuthResult> {
  try {
    const result = await confirmationResult.confirm(otpCode);
    const syncRes = await syncFirebaseUserWithSupabase(result.user);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser: result.user };
  } catch (error: any) {
    console.error('[FirebaseAuth] OTP confirmation error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}

/**
 * Links a verified phone number to the currently logged in Firebase user.
 * This is used when an email/social user verifies their phone number via OTP.
 */
export async function linkPhoneWithCurrentUser(
  verificationId: string,
  otpCode: string
): Promise<SocialAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) throw new Error('No authenticated user found');

    // Build the phone credential from the verification flow
    const credential = PhoneAuthProvider.credential(verificationId, otpCode);
    
    // Link the credential to the current user
    const result = await linkWithCredential(auth.currentUser, credential);
    
    // Sync the updated user profile (with the new phone number) to Supabase
    const syncRes = await syncFirebaseUserWithSupabase(result.user);

    return { success: true, isNewUser: syncRes.isNewUser, hasPhone: syncRes.hasPhone, firebaseUser: result.user };
  } catch (error: any) {
    console.error('[FirebaseAuth] Phone linking error:', error);
    const message = translateFirebaseError(error);
    return { success: false, isNewUser: false, hasPhone: false, firebaseUser: null, error: message };
  }
}
