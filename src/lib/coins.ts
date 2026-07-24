/**
 * Beteseb Coin Purchase Calculation Engine (Blueprint v4.2)
 *
 * Currency Parity: $1 USD = 200 ETB
 * Base Conversion Baseline: $15 USD = 3,000 ETB = 10,000 Base Coins
 *
 * Formulas:
 *  - Base Coins (ETB) = Math.round(amountInETB * (10000 / 3000))
 *  - Base Coins (USD) = Math.round(amountInUSD * (10000 / 15))
 */

export interface CoinPackage {
  id: string;
  baseCoins: number;
  bonusPercent: number;
  bonusCoins: number;
  coins: number;
  priceEtb: number;
  priceUsd: number;
  discount?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coins_100',   baseCoins: 100,   bonusPercent: 0,  bonusCoins: 0,    coins: 100,   priceEtb: 30,   priceUsd: 0.15 },
  { id: 'coins_500',   baseCoins: 500,   bonusPercent: 0,  bonusCoins: 0,    coins: 500,   priceEtb: 150,  priceUsd: 0.75 },
  { id: 'coins_1000',  baseCoins: 1000,  bonusPercent: 0,  bonusCoins: 0,    coins: 1000,  priceEtb: 300,  priceUsd: 1.50 },
  { id: 'coins_3000',  baseCoins: 3000,  bonusPercent: 3,  bonusCoins: 90,   coins: 3090,  priceEtb: 900,  priceUsd: 4.50,  discount: '+3% BONUS' },
  { id: 'coins_5000',  baseCoins: 5000,  bonusPercent: 5,  bonusCoins: 250,  coins: 5250,  priceEtb: 1500, priceUsd: 7.50,  discount: '+5% BONUS' },
  { id: 'coins_7000',  baseCoins: 7000,  bonusPercent: 7,  bonusCoins: 490,  coins: 7490,  priceEtb: 2100, priceUsd: 10.50, discount: '+7% BONUS' },
  { id: 'coins_10000', baseCoins: 10000, bonusPercent: 10, bonusCoins: 1000, coins: 11000, priceEtb: 3000, priceUsd: 15.00, discount: '+10% BONUS' }
];

/**
 * Calculates base coins from ETB using 3000 ETB = 10000 base coins formula
 * Formula: Base Coins = Math.round(amountInETB * (10000 / 3000))
 */
export function calculateBaseCoinsETB(amountInETB: number): number {
  return Math.round(amountInETB * (10000 / 3000));
}

/**
 * Calculates base coins from USD using $15 USD = 10000 base coins formula
 * Formula: Base Coins = Math.round(amountInUSD * (10000 / 15))
 */
export function calculateBaseCoinsUSD(amountInUSD: number): number {
  return Math.round(amountInUSD * (10000 / 15));
}

/**
 * Resolves the exact total coin balance to credit for a purchase.
 * Prevents exchange-rate arbitrage by matching package tier definitions or using conversion formulas.
 */
export function resolveCoinAmount(planType: string, paidAmount?: number, currency: 'ETB' | 'USD' = 'ETB'): number {
  const cleanId = planType.startsWith('coins_') ? planType : `coins_${planType.replace(/^c_?/, '')}`;
  const pack = COIN_PACKAGES.find(p => p.id === cleanId || p.id === planType);
  
  if (pack) {
    return pack.coins;
  }

  // Check if planType string contains baseCoins or coins count (e.g. 'coins_3000' or 'coins_10000')
  const rawNum = parseInt(planType.replace(/^(coins_|c_?)/, ''), 10);
  if (!isNaN(rawNum) && rawNum > 0) {
    const foundByCoins = COIN_PACKAGES.find(p => p.coins === rawNum || p.baseCoins === rawNum);
    if (foundByCoins) {
      return foundByCoins.coins;
    }
  }

  // Fallback calculation using monetary amount if provided
  if (paidAmount && paidAmount > 0) {
    if (currency === 'USD') {
      const base = calculateBaseCoinsUSD(paidAmount);
      // Check bonus tiers
      if (base >= 10000) return Math.round(base * 1.10);
      if (base >= 7000) return Math.round(base * 1.07);
      if (base >= 5000) return Math.round(base * 1.05);
      if (base >= 3000) return Math.round(base * 1.03);
      return base;
    } else {
      const base = calculateBaseCoinsETB(paidAmount);
      if (base >= 10000) return Math.round(base * 1.10);
      if (base >= 7000) return Math.round(base * 1.07);
      if (base >= 5000) return Math.round(base * 1.05);
      if (base >= 3000) return Math.round(base * 1.03);
      return base;
    }
  }

  return rawNum > 0 ? rawNum : 100;
}

/**
 * Deducts coins from a user's wallet for ANY paid platform service (course, counseling, gift, etc.)
 */
export async function deductCoinsForService({
  userId,
  amount,
  serviceType,
  note,
  referenceId
}: {
  userId: string;
  amount: number;
  serviceType: 'course_purchase' | 'counselor_booking' | 'gift_send' | 'premium_feature' | 'service_fee';
  note: string;
  referenceId?: string;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const { supabase } = await import('./supabase');

    // 1. Fetch current wallet balance
    const { data: wallet, error: walletErr } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (walletErr || !wallet) {
      return { success: false, error: 'የዋሌት መረጃ ማግኘት አልተቻለም (Wallet not found).' };
    }

    const currentBalance = Number(wallet.coin_balance || 0);

    if (currentBalance < amount) {
      return { 
        success: false, 
        error: `በቂ ኮይን የሎትም። ለዚህ አገልግሎት ${amount} ኮይን ያስፈልጋል። የአሁኑ ባላንስዎ ${currentBalance} ኮይን ነው።` 
      };
    }

    // 2. Insert negative transaction (triggers automatic wallet balance deduction via handle_coin_transaction trigger)
    const { error: txErr } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: -Math.abs(amount),
        type: serviceType === 'gift_send' ? 'gift_send' : 'admin_adjustment',
        reference_id: referenceId || null,
        note: `[${serviceType.toUpperCase()}] ${note}`
      });

    if (txErr) {
      return { success: false, error: txErr.message };
    }

    const newBalance = currentBalance - Math.abs(amount);
    return { success: true, newBalance };
  } catch (err: any) {
    return { success: false, error: err.message || 'ለአገልግሎቱ ኮይን የመቁረጥ ሂደት አልተሳካም።' };
  }
}

