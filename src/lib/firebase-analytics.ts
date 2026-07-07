/**
 * BETESEB FIREBASE ANALYTICS SERVICE
 * Tracks key user events for App Store / Play Store optimization.
 * Works on Web (via Firebase JS SDK) and Native (via @capacitor-firebase/analytics).
 */

import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from './firebase';

// ── Utility: detect native Capacitor platform ──────────────────────────────
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

// ── Native analytics via @capacitor-firebase/analytics ──────────────────────
async function logNativeEvent(name: string, params?: Record<string, any>) {
  try {
    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    await FirebaseAnalytics.logEvent({ name, params });
  } catch (e) {
    console.warn('Native Firebase Analytics log failed:', e);
  }
}

// ── Web analytics via Firebase JS SDK ───────────────────────────────────────
async function logWebEvent(name: string, params?: Record<string, any>) {
  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return;
    logEvent(analytics, name as any, params);
  } catch (e) {
    console.warn('Web Firebase Analytics log failed:', e);
  }
}

// ── Main dispatcher: routes to correct platform ─────────────────────────────
async function trackEvent(name: string, params?: Record<string, any>) {
  if (isNativePlatform()) {
    await logNativeEvent(name, params);
  } else {
    await logWebEvent(name, params);
  }
}

// ── Beteseb-specific events ──────────────────────────────────────────────────

/** User completed sign up */
export const trackSignUp = (method: 'email' | 'phone' = 'phone') =>
  trackEvent('sign_up', { method });

/** User logged in */
export const trackLogin = (method: 'email' | 'phone' = 'phone') =>
  trackEvent('login', { method });

/** User completed onboarding */
export const trackOnboardingComplete = (gender: string, country: string) =>
  trackEvent('onboarding_complete', { gender, country });

/** User viewed a match profile */
export const trackMatchViewed = (matchId: string) =>
  trackEvent('match_viewed', { match_id: matchId });

/** User sent a connection request */
export const trackConnectionRequest = (toUserId: string) =>
  trackEvent('connection_request_sent', { to_user: toUserId });

/** User started a chat */
export const trackChatStarted = (tier: string) =>
  trackEvent('chat_started', { user_tier: tier });

/** User initiated a payment */
export const trackPaymentInitiated = (plan: string, currency: string, amount: number) =>
  trackEvent('begin_checkout', { plan_type: plan, currency, value: amount });

/** User completed a payment */
export const trackPaymentComplete = (plan: string, currency: string, amount: number) =>
  trackEvent('purchase', {
    plan_type: plan,
    currency,
    value: amount,
    transaction_id: `beteseb_${Date.now()}`
  });

/** User viewed the payment screen */
export const trackPaymentScreenView = () =>
  trackEvent('view_item', { item_name: 'Diamond Premium Plan' });

/** User submitted identity verification */
export const trackVerificationSubmitted = () =>
  trackEvent('verification_submitted');

/** User earned coins */
export const trackCoinsEarned = (amount: number, source: string) =>
  trackEvent('earn_virtual_currency', {
    virtual_currency_name: 'Beteseb Coins',
    value: amount,
    source
  });

/** User spent coins */
export const trackCoinsSpent = (amount: number, reason: string) =>
  trackEvent('spend_virtual_currency', {
    virtual_currency_name: 'Beteseb Coins',
    value: amount,
    item_name: reason
  });

/** User sent a gift */
export const trackGiftSent = (giftName: string, coinPrice: number) =>
  trackEvent('gift_sent', { gift_name: giftName, coin_price: coinPrice });

/** User booked a counselor */
export const trackCounselorBooked = (expertName: string, topic: string) =>
  trackEvent('counselor_booked', { expert_name: expertName, topic });

/** Screen view tracking */
export const trackScreenView = (screenName: string) =>
  trackEvent('screen_view', {
    firebase_screen: screenName,
    firebase_screen_class: screenName
  });

/** Set user properties for segmentation */
export async function setUserProperties(userId: string, tier: string, country: string) {
  try {
    if (isNativePlatform()) {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setUserId({ userId });
      await FirebaseAnalytics.setUserProperty({ key: 'tier', value: tier });
      await FirebaseAnalytics.setUserProperty({ key: 'country', value: country });
    } else {
      const analytics = await getFirebaseAnalytics();
      if (!analytics) return;
      const { setUserId, setUserProperties: setProps } = await import('firebase/analytics');
      setUserId(analytics, userId);
      setProps(analytics, { tier, country });
    }
  } catch (e) {
    console.warn('setUserProperties error:', e);
  }
}
