import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveCoinAmount } from '@/lib/coins';

/**
 * BETESEB — Chapa Payment Verification Endpoint
 *
 * Called from the client after Chapa redirects the user back to the app.
 * Verifies the transaction with Chapa's official verify API, then
 * records the payment and upgrades the user profile automatically.
 *
 * POST /api/payments/chapa/verify
 * Body: { tx_ref: string, userId: string }
 */

const PLAN_DAYS: Record<string, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '12m': 365,
  'lifetime': 36500,
};

export async function POST(req: Request) {
  try {
    const { tx_ref, userId } = await req.json();

    if (!tx_ref || !userId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing tx_ref or userId' },
        { status: 400 }
      );
    }

    // ── 1. Idempotency — prevent double-processing the same tx_ref ────────────
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status, plan_type')
      .eq('receipt_url', `Chapa TX: ${tx_ref}`)
      .maybeSingle();

    if (existing) {
      console.log(`[Chapa Verify] tx_ref ${tx_ref} already processed — skipping.`);
      // Extract type so the client can correctly route the user
      const existingPlanType = existing.plan_type || tx_ref.split('-')[1] || '';
      const existingType = existingPlanType.startsWith('coins_') ? 'coins'
        : existingPlanType.startsWith('vip_') ? 'vip'
        : 'premium';
      return NextResponse.json({
        status: 'success',
        message: 'Payment already verified and processed',
        alreadyProcessed: true,
        type: existingType,
      });
    }

    // ── 2. Verify with Chapa API ───────────────────────────────────────────────
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

    if (!chapaSecretKey) {
      // Dev/demo mode: no key configured — simulate success
      console.warn('[Chapa Verify] CHAPA_SECRET_KEY not set. Running in demo mode.');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const match = tx_ref.match(uuidRegex);
      let extractedUserId = '';
      let planType = '';
      if (match) {
        extractedUserId = match[0];
        planType = tx_ref.substring(extractedUserId.length + 1).split('-')[0];
      } else {
        const parts = tx_ref.split('-');
        extractedUserId = parts[0];
        planType = parts[1];
      }

      if (extractedUserId !== userId) {
        return NextResponse.json(
          { status: 'error', message: `User ID mismatch in tx_ref (Expected: ${userId}, Got: ${extractedUserId})` },
          { status: 403 }
        );
      }

      const isCoins = planType.startsWith('coins_') || planType.startsWith('c');
      const isVip = planType.startsWith('vip_') || planType.startsWith('v');

      if (isCoins) {
        const amountCoins = resolveCoinAmount(planType, 0, 'ETB');

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: `coins_${amountCoins}`,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });

        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: amountCoins,
          type: 'purchase',
          note: `Chapa Coin Purchase (Simulated): ${planType}`
        });

        const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
        const currentBalance = Number(wallet?.coin_balance || 0);

        return NextResponse.json({
          status: 'success',
          message: `Demo: Coin purchase verified and credited ${amountCoins} coins successfully.`,
          coinBalance: currentBalance,
          type: 'coins',
        });
      } else if (isVip) {
        let days = 30;
        const cleanPlan = planType.startsWith('vip_') ? planType.replace('vip_', '') : planType.replace(/^v_?/, '');
        const isLifetime = cleanPlan === 'lifetime' || planType.endsWith('lifetime');
        if (cleanPlan === '3m') days = 90;
        if (cleanPlan === '6m') days = 180;
        if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
        if (isLifetime) days = 36500;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });

        const updatePayload: any = {
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString(),
        };
        if (isLifetime) {
          updatePayload.is_lifetime = true;
        }

        await supabase.from('profiles').update(updatePayload).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Demo: VIP purchase verified and profile upgraded',
          vipExpiresAt: expiresAt.toISOString(),
          isLifetime,
          type: 'vip',
        });
      } else {
        const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
        const days = PLAN_DAYS[planType] ?? (isLifetime ? 36500 : 30);
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + days);

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });

        const updatePayload: any = {
          premium_until: premiumUntil.toISOString(),
        };
        if (isLifetime) {
          updatePayload.is_lifetime = true;
        }

        await supabase.from('profiles').update(updatePayload).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Demo: Payment verified and profile upgraded',
          premiumUntil: premiumUntil.toISOString(),
          isLifetime,
          type: 'premium',
        });
      }
    }

    // Real Chapa verification
    const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const chapaData = await chapaRes.json();

    if (chapaData.status !== 'success') {
      console.error('[Chapa Verify] Chapa API returned non-success:', chapaData);
      return NextResponse.json(
        { status: 'error', message: `Chapa verification failed: ${chapaData.message || 'Unknown error'}` },
        { status: 400 }
      );
    }

    const txData = chapaData.data;
    const txStatus = txData?.status;

    // Chapa transaction statuses: 'success', 'pending', 'failed'
    if (txStatus !== 'success') {
      return NextResponse.json(
        { status: 'error', message: `Transaction status is "${txStatus}" — not completed yet` },
        { status: 400 }
      );
    }

    // ── 3. Validate the tx_ref belongs to this user ────────────────────────────
    // tx_ref format: "userId-planType-timestamp"
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = tx_ref.match(uuidRegex);
    let extractedUserId = '';
    let planType = '';
    if (match) {
      extractedUserId = match[0];
      planType = tx_ref.substring(extractedUserId.length + 1).split('-')[0];
    } else {
      const parts = tx_ref.split('-');
      extractedUserId = parts[0];
      planType = parts[1];
    }

    if (extractedUserId !== userId) {
      console.error(`[Chapa Verify] UserId mismatch: expected ${userId}, got ${extractedUserId}`);
      return NextResponse.json(
        { status: 'error', message: `User ID mismatch — transaction does not belong to this user (Expected: ${userId}, Got: ${extractedUserId})` },
        { status: 403 }
      );
    }

    if (!planType) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid transaction reference format — missing plan type' },
        { status: 400 }
      );
    }

    const isCoins = planType.startsWith('coins_') || planType.startsWith('c');
    const isVip = planType.startsWith('vip_') || planType.startsWith('v');

    const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('id', userId).maybeSingle();

    if (isCoins) {
      const coinAmt = parseFloat(String(txData?.amount || 0));
      const amountCoins = resolveCoinAmount(planType, coinAmt, 'ETB');

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: `coins_${amountCoins}`,
        amount: parseFloat(String(txData?.amount || 0)),
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      // Mirror into financial_transactions master ledger
      const coinFee = Math.round(coinAmt * 0.035 * 100) / 100;
      try {
        await supabase.from('financial_transactions').insert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
          user_email_snapshot: profileData?.email || null,
          revenue_source: 'coin_sale',
          payment_gateway: 'chapa',
          currency: txData?.currency || 'ETB',
          gross_amount: coinAmt,
          gateway_fee: coinFee,
          net_amount: Math.max(0, coinAmt - coinFee),
          payment_status: 'completed'
        });
      } catch (err) {}

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: amountCoins,
        type: 'purchase',
        note: `Chapa Coin Purchase: ${amountCoins} coins (${tx_ref})`
      });

      const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
      const currentBalance = Number(wallet?.coin_balance || 0);

      return NextResponse.json({
        status: 'success',
        message: `Chapa purchase verified and credited ${amountCoins} coins successfully.`,
        coinBalance: currentBalance,
        type: 'coins',
      });
    } else if (isVip) {
      let days = 30;
      const cleanPlan = planType.startsWith('vip_') ? planType.replace('vip_', '') : planType.replace(/^v_?/, '');
      const isLifetime = cleanPlan === 'lifetime' || planType.endsWith('lifetime');
      if (cleanPlan === '3m') days = 90;
      if (cleanPlan === '6m') days = 180;
      if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
      if (isLifetime) days = 36500;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const vipAmt = parseFloat(String(txData?.amount || 0));
      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: vipAmt,
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      // Mirror into financial_transactions master ledger
      const vipFee = Math.round(vipAmt * 0.035 * 100) / 100;
      try {
        await supabase.from('financial_transactions').insert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
          user_email_snapshot: profileData?.email || null,
          revenue_source: 'subscription_vip',
          payment_gateway: 'chapa',
          currency: txData?.currency || 'ETB',
          gross_amount: vipAmt,
          gateway_fee: vipFee,
          net_amount: Math.max(0, vipAmt - vipFee),
          payment_status: 'completed'
        });
      } catch (err) {}

      const vipUpdatePayload: any = {
        is_vip_member: true,
        vip_expires_at: expiresAt.toISOString(),
      };
      if (isLifetime) {
        vipUpdatePayload.is_lifetime = true;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(vipUpdatePayload)
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ status: 'error', message: 'Failed to update user VIP profile status' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Chapa VIP purchase verified and profile upgraded',
        vipExpiresAt: expiresAt.toISOString(),
        isLifetime,
        type: 'vip',
      });
    } else {
      const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
      const days = PLAN_DAYS[planType] ?? (isLifetime ? 36500 : 30);
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      const premAmt = parseFloat(String(txData?.amount || 0));
      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: premAmt,
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      // Mirror into financial_transactions master ledger
      const premFee = Math.round(premAmt * 0.035 * 100) / 100;
      try {
        await supabase.from('financial_transactions').insert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
          user_email_snapshot: profileData?.email || null,
          revenue_source: 'subscription_premium',
          payment_gateway: 'chapa',
          currency: txData?.currency || 'ETB',
          gross_amount: premAmt,
          gateway_fee: premFee,
          net_amount: Math.max(0, premAmt - premFee),
          payment_status: 'completed'
        });
      } catch (err) {}

      const premUpdatePayload: any = {
        premium_until: premiumUntil.toISOString()
      };
      if (isLifetime) {
        premUpdatePayload.is_lifetime = true;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(premUpdatePayload)
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ status: 'error', message: 'Failed to update user premium profile status' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified and profile upgraded successfully',
        premiumUntil: premiumUntil.toISOString(),
        isLifetime,
        planType,
        type: 'premium',
      });
    }
  } catch (error: any) {
    console.error('[Chapa Verify] Unhandled error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
