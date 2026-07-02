import { supabase } from './supabase';

/**
 * Beteseb Feature Entitlement System
 * Feature-based gating — no trial periods.
 * Free users get limited quotas; Premium users get full access.
 */

export type UserTier = 'free' | 'premium' | 'locked';

export interface FeatureQuota {
  /** Total seconds of audio call allowed per day (free: 120, premium: unlimited) */
  audioDailySeconds: number | 'unlimited';
  /** Whether video calling is allowed */
  videoEnabled: boolean;
  /** Max text messages per day (free: 5, premium: unlimited) */
  dailyMessages: number | 'unlimited';
  /** Whether sending friend requests is allowed */
  friendRequestsEnabled: boolean;
  /** Whether community posting is allowed */
  communityPostEnabled: boolean;
  /** Whether profile photos are blurred */
  profilePhotosBlurred: boolean;
}

export interface SubscriptionInfo {
  tier: UserTier;
  quota: FeatureQuota;
  premiumUntil: string | null;
  isVerified: boolean;
  region: 'local' | 'global';
  currency: 'ETB' | 'USD';
}

const FREE_QUOTA: FeatureQuota = {
  audioDailySeconds: 120,        // 2 minutes per day
  videoEnabled: false,            // Video locked for free
  dailyMessages: 5,               // 5 messages per day
  friendRequestsEnabled: false,   // Locked
  communityPostEnabled: false,    // Locked
  profilePhotosBlurred: true,     // Blurred
};

const PREMIUM_QUOTA: FeatureQuota = {
  audioDailySeconds: 'unlimited',
  videoEnabled: true,
  dailyMessages: 'unlimited',
  friendRequestsEnabled: true,
  communityPostEnabled: true,
  profilePhotosBlurred: false,
};

export async function getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('premium_until, is_locked, is_verified, verification_status, country, phone')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const premiumUntil = data.premium_until ? new Date(data.premium_until) : null;

  // Determine tier
  let tier: UserTier = 'free';
  if (data.is_locked) {
    tier = 'locked';
  } else if (premiumUntil && premiumUntil > now) {
    tier = 'premium';
  }

  // Determine region based on country or phone prefix
  const isLocalUser = isEthiopianUser(data.country, data.phone);

  return {
    tier,
    quota: tier === 'premium' ? PREMIUM_QUOTA : FREE_QUOTA,
    premiumUntil: data.premium_until ?? null,
    isVerified: data.is_verified || data.verification_status === 'verified',
    region: isLocalUser ? 'local' : 'global',
    currency: isLocalUser ? 'ETB' : 'USD',
  };
}

function isEthiopianUser(country?: string, phone?: string): boolean {
  if (country) {
    const lower = country.toLowerCase();
    if (lower === 'ethiopia' || lower === 'et') return true;
  }
  if (phone && (phone.startsWith('+251') || phone.startsWith('09') || phone.startsWith('07'))) {
    return true;
  }
  return false;
}

/** Check if a specific feature is available for the user */
export function canUseFeature(
  subInfo: SubscriptionInfo | null,
  feature: keyof FeatureQuota
): boolean {
  if (!subInfo) return false;
  if (subInfo.tier === 'locked') return false;
  if (subInfo.tier === 'premium') return true;
  // Free tier: check feature-specific rules
  const val = subInfo.quota[feature];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  return val === 'unlimited';
}

// ============================================
// PRICING PLANS (Region-isolated)
// ============================================
export const SUBSCRIPTION_PLANS = {
  ETB: [
    { id: '1m', name: '1 Month', nameAm: '1 ወር', price: 500, period: 'monthly', currency: 'ETB' },
    { id: '3m', name: '3 Months', nameAm: '3 ወራት', price: 1200, period: 'quarterly', currency: 'ETB' },
    { id: '6m', name: '6 Months', nameAm: '6 ወራት', price: 2200, period: 'semi-annually', currency: 'ETB' },
    { id: '1y', name: '1 Year', nameAm: '1 ዓመት', price: 3500, period: 'yearly', currency: 'ETB' },
    { id: 'lifetime', name: 'Lifetime', nameAm: 'ዕድሜ ልክ', price: 9999, period: 'lifetime', currency: 'ETB' },
  ],
  USD: [
    { id: '1m', name: '1 Month', nameAm: '1 ወር', price: 9.99, period: 'monthly', currency: 'USD' },
    { id: '3m', name: '3 Months', nameAm: '3 ወራት', price: 24.99, period: 'quarterly', currency: 'USD' },
    { id: '6m', name: '6 Months', nameAm: '6 ወራት', price: 44.99, period: 'semi-annually', currency: 'USD' },
    { id: '1y', name: '1 Year', nameAm: '1 ዓመት', price: 79.99, period: 'yearly', currency: 'USD' },
    { id: 'lifetime', name: 'Lifetime', nameAm: 'ዕድሜ ልክ', price: 199.99, period: 'lifetime', currency: 'USD' },
  ],
};

export const BANK_DETAILS = {
  ETB: [
    { bank: 'Commercial Bank of Ethiopia (CBE)', account: '1000123456789', name: 'Beteseb PLC' },
    { bank: 'Awash Bank', account: '0132045678900', name: 'Beteseb PLC' },
    { bank: 'TeleBirr', account: '+251946414018', name: 'Beteseb PLC' },
  ],
  USD: [
    { method: 'PayPal', link: 'https://paypal.me/beteseb', account: 'betesebhub@gmail.com' },
    { method: 'Wire Transfer', details: 'Contact support for SWIFT details', name: 'Beteseb Global' },
  ],
};
