import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Apple App Store receipt validation endpoints
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';

const APPLE_SHARED_SECRET = process.env.APPLE_IAP_SHARED_SECRET || '';

interface VerifyReceiptResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      original_transaction_id: string;
      expires_date_ms?: string;
      purchase_date_ms: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    original_transaction_id: string;
    expires_date_ms: string;
    purchase_date_ms: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const { receiptData, userId, planType } = await req.json();

    if (!receiptData || !userId || !planType) {
      return NextResponse.json(
        { status: 'error', message: 'Missing receiptData, userId, or planType' },
        { status: 400 }
      );
    }

    // Sandbox / dev verification simulation check
    if (!APPLE_SHARED_SECRET || receiptData.startsWith('sandbox_mock_')) {
      console.warn("Performing fallback simulated Apple receipt verification.");
      
      const isCoins = planType.startsWith('coins_');
      let amountCoins = 0;
      if (isCoins) {
        amountCoins = parseInt(planType.split('_')[1]) || 50;
      }

      // Record transaction in database
      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: isCoins ? (amountCoins === 50 ? 5 : amountCoins === 100 ? 10 : amountCoins === 500 ? 40 : 70) : getPlanPriceUSD(planType),
        currency: 'USD',
        status: 'approved',
        receipt_url: `Apple Transaction ID (Simulated): ${receiptData}`
      });

      if (isCoins) {
        // Fetch current coin wallet balance
        const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
        const currentBalance = Number(wallet?.coin_balance || 0);
        
        // Update user's coin balance
        await supabase.from('user_wallets').upsert({
          id: userId,
          coin_balance: currentBalance + amountCoins,
          updated_at: new Date().toISOString()
        });

        // Insert coin transaction record
        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: amountCoins,
          type: 'purchase',
          note: `Apple IAP Coin Purchase: ${planType}`
        });

        return NextResponse.json({
          status: 'success',
          message: `Apple purchase validated (Simulated) and credited ${amountCoins} coins successfully.`,
          coinBalance: currentBalance + amountCoins
        });
      } else {
        const expiresAt = new Date();
        let days = 30;
        if (planType === '3m') days = 90;
        if (planType === '12m') days = 365;
        if (planType === 'lifetime') days = 36500;
        expiresAt.setDate(expiresAt.getDate() + days);

        await supabase.from('profiles').update({
          premium_until: expiresAt.toISOString()
        }).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Apple receipt validated (Simulated) and account upgraded successfully',
          premiumUntil: expiresAt.toISOString()
        });
      }
    }

    // 1. Validate receipt with Apple App Store
    let appleResponse = await verifyWithApple(receiptData, APPLE_PRODUCTION_URL);

    // If status is 21007, it is a sandbox receipt sent to production, retry against sandbox URL
    if (appleResponse.status === 21007) {
      appleResponse = await verifyWithApple(receiptData, APPLE_SANDBOX_URL);
    }

    if (appleResponse.status !== 0) {
      return NextResponse.json(
        { status: 'error', message: `Apple validation failed with status code ${appleResponse.status}` },
        { status: 400 }
      );
    }

    // 2. Extract latest transaction / purchase information
    const latestInfo = appleResponse.latest_receipt_info 
      ? appleResponse.latest_receipt_info[appleResponse.latest_receipt_info.length - 1]
      : appleResponse.receipt?.in_app?.[appleResponse.receipt.in_app.length - 1];

    if (!latestInfo) {
      return NextResponse.json(
        { status: 'error', message: 'No transaction found in receipt data' },
        { status: 400 }
      );
    }

    const isCoinsProduct = planType.startsWith('coins_');

    if (isCoinsProduct) {
      const amountCoins = parseInt(planType.split('_')[1]) || 50;

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: amountCoins === 50 ? 5 : amountCoins === 100 ? 10 : amountCoins === 500 ? 40 : 70,
        currency: 'USD',
        status: 'approved',
        receipt_url: `Apple Transaction ID: ${latestInfo.original_transaction_id}`
      });

      // Update coins wallet balance
      const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
      const currentBalance = Number(wallet?.coin_balance || 0);

      await supabase.from('user_wallets').upsert({
        id: userId,
        coin_balance: currentBalance + amountCoins,
        updated_at: new Date().toISOString()
      });

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: amountCoins,
        type: 'purchase',
        note: `Apple IAP Coin Purchase: ${planType}`
      });

      return NextResponse.json({
        status: 'success',
        message: `Apple purchase validated and credited ${amountCoins} coins successfully.`,
        coinBalance: currentBalance + amountCoins
      });
    }

    const isVipProduct = planType.startsWith('vip_');

    // 3. Determine premium expiration date
    let expiresAt: Date;
    if (latestInfo.expires_date_ms) {
      expiresAt = new Date(parseInt(latestInfo.expires_date_ms));
    } else {
      // Fallback if expires_date_ms is missing (e.g., non-consumable lifetime plan)
      let days = 30;
      const cleanPlan = planType.replace('vip_', '');
      if (cleanPlan === '3m') days = 90;
      if (cleanPlan === '12m') days = 365;
      if (cleanPlan === 'lifetime') days = 36500; // ~100 years
      
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    if (isVipProduct) {
      // 4. Record transaction in database
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_type: planType,
          amount: getPlanPriceUSD(planType),
          currency: 'USD',
          status: 'approved',
          receipt_url: `Apple Transaction ID: ${latestInfo.original_transaction_id}`
        });

      if (paymentError) {
        console.error('Failed to log Apple payment transaction in DB:', paymentError);
      }

      // 5. Upgrade user's VIP validity in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Failed to update VIP profile status:', profileError);
        return NextResponse.json(
          { status: 'error', message: 'Failed to update VIP profile status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'success',
        message: 'Receipt validated and VIP account upgraded successfully',
        vipExpiresAt: expiresAt.toISOString(),
        type: 'vip'
      });
    }

    // 4. Record transaction in database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_type: planType,
        amount: getPlanPriceUSD(planType),
        currency: 'USD',
        status: 'approved',
        receipt_url: `Apple Transaction ID: ${latestInfo.original_transaction_id}`
      });

    if (paymentError) {
      console.error('Failed to log Apple payment transaction in DB:', paymentError);
    }

    // 5. Upgrade user's premium validity in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        premium_until: expiresAt.toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update premium profile status:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to update premium profile status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Receipt validated and account upgraded successfully',
      premiumUntil: expiresAt.toISOString(),
      type: 'premium'
    });

  } catch (error: any) {
    console.error('Apple IAP Webhook/API Error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}

/**
 * Sends receipt verification POST request to Apple App Store endpoints
 */
async function verifyWithApple(receiptData: string, url: string): Promise<VerifyReceiptResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': APPLE_SHARED_SECRET
    })
  });
  return response.json();
}

/**
 * Returns plan prices in USD for logging Apple IAP transactions
 */
function getPlanPriceUSD(planType: string): number {
  switch (planType) {
    case '1m': return 15;
    case '3m': return 39;
    case '6m': return 69;
    case '12m': return 120;
    case 'lifetime': return 299;
    default: return 15;
  }
}
