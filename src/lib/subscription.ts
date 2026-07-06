import { supabase } from './supabase';

/**
 * Beteseb Subscription Status — Freemium Model (Blueprint v4.0)
 *
 * ❌ REMOVED: 'trial' status — 7-Day Free Trial model has been fully removed.
 * ✅ MODEL: Freemium + Usage Limits (Tier-based daily communication limits)
 *
 * Status flow:
 *  - 'freemium' → Default for all users; tier-based daily limits apply (Bronze/Silver/Gold/Platinum)
 *  - 'premium'  → Active Diamond subscription; all limits removed
 *  - 'expired'  → Premium lapsed, in 3-day grace period; limits re-apply at Platinum level
 *  - 'pending'  → Payment submitted, awaiting admin confirmation
 *  - 'locked'   → Account suspended by admin
 */
export type UserSubscriptionStatus = 'freemium' | 'premium' | 'expired' | 'locked' | 'pending';

export interface SubscriptionInfo {
  status: UserSubscriptionStatus;
  daysRemaining: number;
  premiumUntil: string | null;
  isVerified: boolean;
}

export async function getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('premium_until, is_locked, is_verified, verification_status')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const premiumUntil = data.premium_until ? new Date(data.premium_until) : null;

  // Calculate status — NO trial logic
  let status: UserSubscriptionStatus = 'freemium';
  let daysRemaining = 0;

  if (data.is_locked) {
    // Admin-suspended account
    status = 'locked';
  } else if (premiumUntil && premiumUntil > now) {
    // Active Diamond subscription
    status = 'premium';
    daysRemaining = Math.ceil((premiumUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else if (premiumUntil) {
    // Premium expired — check 3-day grace period
    const gracePeriodEnd = new Date(premiumUntil.getTime() + (3 * 24 * 60 * 60 * 1000));
    if (now < gracePeriodEnd) {
      status = 'expired';
      daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // Grace period also over — back to freemium with tier-based limits
      status = 'freemium';
    }
  } else {
    // No subscription ever — default freemium; Trust Tier limits apply
    status = 'freemium';
  }

  // Check if there is a pending payment
  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (payment) {
    status = 'pending';
  }

  return {
    status,
    daysRemaining,
    premiumUntil: data.premium_until,
    isVerified: data.is_verified || data.verification_status === 'verified'
  };
}

/**
 * Helper: Is user on active Diamond (premium) subscription?
 */
export function isPremiumActive(info: SubscriptionInfo | null): boolean {
  return info?.status === 'premium';
}

/**
 * Helper: Is user in freemium mode? (includes expired grace period lapsed)
 * Freemium users are subject to Trust Tier daily communication limits.
 */
export function isFreemiumUser(info: SubscriptionInfo | null): boolean {
  return !info || info.status === 'freemium' || info.status === 'expired';
}

// ─── Subscription Plans (Diamond Tier Pricing) ──────────────────────────────

export const SUBSCRIPTION_PLANS = {
  ETB: [
    { id: '1m',       name: '1 Month',    price: 500,   period: 'monthly'       },
    { id: '3m',       name: '3 Months',   price: 1200,  period: 'quarterly'     },
    { id: '6m',       name: '6 Months',   price: 2200,  period: 'semi-annually' },
    { id: '1y',       name: '1 Year',     price: 3500,  period: 'yearly'        },
    { id: 'lifetime', name: 'Lifetime',   price: 9999,  period: 'lifetime'      }
  ],
  USD: [
    { id: '1m',       name: '1 Month',    price: 15,    period: 'monthly'       },
    { id: '3m',       name: '3 Months',   price: 39,    period: 'quarterly'     },
    { id: '6m',       name: '6 Months',   price: 69,    period: 'semi-annually' },
    { id: '1y',       name: '1 Year',     price: 120,   period: 'yearly'        },
    { id: 'lifetime', name: 'Lifetime',   price: 299,   period: 'lifetime'      }
  ]
};

// ─── Bank / Manual Payment Details (Ethiopia) ───────────────────────────────

export const BANK_DETAILS = {
  ETB: [
    { bank: 'Commercial Bank of Ethiopia (CBE)', account: '1000123456789', name: 'Beteseb PLC' },
    { bank: 'Awash Bank',                        account: '0132045678900', name: 'Beteseb PLC' },
    { bank: 'TeleBirr',                          account: '+251946414018', name: 'Beteseb PLC' }
  ],
  USD: [
    { method: 'PayPal',      link: 'https://paypal.me/beteseb', account: 'betesebhub@gmail.com' },
    { method: 'Bank (SWIFT)', details: 'Contact support for SWIFT/IBAN details', name: 'Beteseb Global' }
  ]
};
