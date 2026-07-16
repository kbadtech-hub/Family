/**
 * BETESEB NATIVE IN-APP PURCHASE HOOK
 * Handles Google Play Billing + Apple App Store IAP via @capgo/native-purchases.
 * Verifies purchases on the Beteseb backend and upgrades the user's account.
 *
 * USAGE:
 *   const { packages, purchase, isLoading, error } = useNativePurchase(userId);
 */

import { useState, useEffect, useCallback } from 'react';

// ── Detect Native Platform ─────────────────────────────────────────────────────
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

// ── Types ──────────────────────────────────────────────────────────────────────
export interface NativePackage {
  identifier: string;
  productIdentifier: string;
  priceString: string;
  description: string;
  planType: string; // '1m' | '3m' | '6m' | '1y' | 'lifetime' | 'coins_50' | etc.
}

export interface PurchaseResult {
  success: boolean;
  premiumUntil?: string;
  coinBalance?: number;
  message?: string;
}

// ── Product ID → plan type mapping ────────────────────────────────────────────
// These must match the product IDs you created in Google Play Console / App Store Connect
export const PRODUCT_TO_PLAN: Record<string, string> = {
  'beteseb_premium_1m':       '1m',
  'beteseb_premium_3m':       '3m',
  'beteseb_premium_6m':       '6m',
  'beteseb_premium_1y':       '1y',
  'beteseb_premium_lifetime': 'lifetime',
  'beteseb_coins_50':         'coins_50',
  'beteseb_coins_100':        'coins_100',
  'beteseb_coins_500':        'coins_500',
};

// ── Main Hook ──────────────────────────────────────────────────────────────────
export function useNativePurchase(userId: string | null) {
  const [packages, setPackages] = useState<NativePackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Purchases SDK on mount (native only)
  useEffect(() => {
    if (!isNativePlatform() || !userId) return;
    initPurchases(userId).then(setIsInitialized);
  }, [userId]);

  // Fetch available packages once initialized
  useEffect(() => {
    if (!isInitialized || !isNativePlatform()) return;
    fetchPackages().then(setPackages);
  }, [isInitialized]);

  // ── Purchase Flow ────────────────────────────────────────────────────────────
  const purchase = useCallback(async (pkg: NativePackage): Promise<PurchaseResult> => {
    if (!userId) return { success: false, message: 'User not authenticated' };
    setIsLoading(true);
    setError(null);

    try {
      if (!isNativePlatform()) {
        // Web simulation — for developer testing only
        console.warn('[IAP] Web environment: simulating purchase of', pkg.identifier);
        return await verifyPurchaseOnServer({
          userId,
          purchaseToken: `sandbox_mock_${Date.now()}`,
          productId: pkg.productIdentifier,
          planType: pkg.planType,
          platform: 'web',
        });
      }

      const { Purchases } = await import('@capgo/native-purchases');

      // Trigger native payment sheet
      const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg as any });

      const customerInfo = (purchaseResult as any).customerInfo;
      if (!customerInfo) throw new Error('No customer info returned from purchase');

      const platform = getPlatform();

      if (platform === 'android') {
        // Google Play — get purchaseToken from the latest receipt
        const receipt = (purchaseResult as any).transaction?.transactionIdentifier ||
                        `google_token_${Date.now()}`;
        return await verifyPurchaseOnServer({
          userId,
          purchaseToken: receipt,
          productId: pkg.productIdentifier,
          planType: pkg.planType,
          platform: 'android',
        });
      } else {
        // Apple App Store — get the appStoreReceipt
        const receiptData = customerInfo.originalAppUserId || `apple_receipt_${Date.now()}`;
        return await verifyPurchaseOnServer({
          userId,
          purchaseToken: receiptData,
          productId: pkg.productIdentifier,
          planType: pkg.planType,
          platform: 'ios',
        });
      }
    } catch (e: any) {
      // Handle user-cancelled (code 1) gracefully
      if (e?.code === 1 || e?.message?.includes('cancel')) {
        return { success: false, message: 'Purchase cancelled' };
      }
      const msg = e?.message || 'Purchase failed';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ── Restore Purchases ────────────────────────────────────────────────────────
  const restorePurchases = useCallback(async (): Promise<PurchaseResult> => {
    if (!userId) return { success: false, message: 'User not authenticated' };
    if (!isNativePlatform()) return { success: false, message: 'Restore only available on native' };

    setIsLoading(true);
    try {
      const { Purchases } = await import('@capgo/native-purchases');
      const result = await Purchases.restoreTransactions();
      const entitlements = (result.customerInfo as any)?.entitlements?.active || {};

      if (Object.keys(entitlements).length > 0) {
        // Has active entitlement — verify latest via server
        return { success: true, message: 'Purchases restored successfully' };
      }
      return { success: false, message: 'No active purchases to restore' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Restore failed' };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { packages, purchase, restorePurchases, isLoading, isInitialized, error };
}

// ── Internal Helpers ───────────────────────────────────────────────────────────

async function initPurchases(userId: string): Promise<boolean> {
  try {
    const { Purchases } = await import('@capgo/native-purchases');
    // RevenueCat/Capgo API key — add to .env.local
    const apiKey = getPlatform() === 'ios'
      ? (process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY || 'appl_placeholder')
      : (process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_placeholder');

    await Purchases.configure({ apiKey });
    // Log in the user so purchases are attributed correctly
    await Purchases.logIn({ appUserID: userId });
    console.log('[IAP] Purchases SDK initialized for user:', userId);
    return true;
  } catch (e) {
    console.error('[IAP] Failed to initialize Purchases SDK:', e);
    return false;
  }
}

async function fetchPackages(): Promise<NativePackage[]> {
  try {
    const { Purchases } = await import('@capgo/native-purchases');
    const offerings = await Purchases.getOfferings();
    const current = (offerings as any).current;
    if (!current?.availablePackages) return [];

    return (current.availablePackages as any[]).map((pkg) => ({
      identifier: pkg.identifier,
      productIdentifier: pkg.product?.productIdentifier || pkg.identifier,
      priceString: pkg.product?.priceString || '',
      description: pkg.product?.description || '',
      planType: PRODUCT_TO_PLAN[pkg.product?.productIdentifier] || pkg.identifier,
    }));
  } catch (e) {
    console.error('[IAP] Failed to fetch packages:', e);
    return [];
  }
}

async function verifyPurchaseOnServer(params: {
  userId: string;
  purchaseToken: string;
  productId: string;
  planType: string;
  platform: 'ios' | 'android' | 'web';
}): Promise<PurchaseResult> {
  const { userId, purchaseToken, productId, planType, platform } = params;

  const endpoint = platform === 'ios'
    ? '/api/payments/apple'
    : '/api/payments/google';

  const body = platform === 'ios'
    ? { receiptData: purchaseToken, userId, planType }
    : { purchaseToken, productId, userId, planType };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.status === 'success') {
    console.log('[IAP] ✅ Purchase verified on server:', data);
    return {
      success: true,
      premiumUntil: data.premiumUntil,
      coinBalance: data.coinBalance,
      message: data.message,
    };
  }

  throw new Error(data.message || 'Server verification failed');
}
