import { supabase } from './supabase';

export type UserSubscriptionStatus = 'trial' | 'premium' | 'expired' | 'locked' | 'pending';

export interface SubscriptionInfo {
  status: UserSubscriptionStatus;
  daysRemaining: number;
  premiumUntil: string | null;
  trialEndsAt: string;
  isVerified: boolean;
}

export async function getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('trial_ends_at, premium_until, is_locked, is_verified, verification_status')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const trialEnds = new Date(data.trial_ends_at);
  const premiumUntil = data.premium_until ? new Date(data.premium_until) : null;
  
  // Calculate status
  let status: UserSubscriptionStatus = 'trial';
  let daysRemaining = 0;

  if (data.is_locked) {
    status = 'locked';
  } else if (premiumUntil && premiumUntil > now) {
    status = 'premium';
    daysRemaining = Math.ceil((premiumUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else if (trialEnds > now) {
    status = 'trial';
    daysRemaining = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // Check for grace period (3 days after expiration)
    const expirationDate = premiumUntil || trialEnds;
    const gracePeriodEnd = new Date(expirationDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    if (now < gracePeriodEnd) {
      status = 'expired';
      daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      status = 'locked';
    }
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
    trialEndsAt: data.trial_ends_at,
    isVerified: data.is_verified || data.verification_status === 'verified'
  };
}

export const SUBSCRIPTION_PLANS = {
  ETB: [
    { id: '1m', name: '1 Month', price: 500, period: 'monthly' },
    { id: '3m', name: '3 Months', price: 1200, period: 'quarterly' },
    { id: '6m', name: '6 Months', price: 2200, period: 'semi-annually' },
    { id: '1y', name: '1 Year', price: 3500, period: 'yearly' },
    { id: 'lifetime', name: 'Lifetime', price: 9999, period: 'lifetime' }
  ],
  USD: [
    { id: '1m', name: '1 Month', price: 50, period: 'monthly' },
    { id: '3m', name: '3 Months', price: 120, period: 'quarterly' },
    { id: '6m', name: '6 Months', price: 220, period: 'semi-annually' },
    { id: '1y', name: '1 Year', price: 350, period: 'yearly' },
    { id: 'lifetime', name: 'Lifetime', price: 999, period: 'lifetime' }
  ]
};

export const BANK_DETAILS = {
  ETB: [
    { bank: 'Commercial Bank of Ethiopia (CBE)', account: '1000123456789', name: 'Beteseb PLC' },
    { bank: 'Awash Bank', account: '0132045678900', name: 'Beteseb PLC' },
    { bank: 'TeleBirr', account: '+251946414018', name: 'Beteseb PLC' }
  ],
  USD: [
    { method: 'PayPal', link: 'https://paypal.me/beteseb', account: 'betesebhub@gmail.com' },
    { method: 'Bank Swift', details: 'SWIFT: XXXX, IBAN: XXXX', name: 'Beteseb Global' }
  ]
};
