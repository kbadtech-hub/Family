import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
        const amountCoins = planType.startsWith('coins_')
          ? (parseInt(planType.replace('coins_', '')) || 50)
          : (parseInt(planType.replace(/^c_?/, '')) || 50);

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
        if (cleanPlan === '3m') days = 90;
        if (cleanPlan === '6m') days = 180;
        if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
        if (cleanPlan === 'lifetime') days = 36500;

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

        await supabase.from('profiles').update({
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString(),
        }).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Demo: VIP purchase verified and profile upgraded',
          vipExpiresAt: expiresAt.toISOString(),
          type: 'vip',
        });
      } else {
        const days = PLAN_DAYS[planType] ?? 30;
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

        await supabase.from('profiles').update({
          premium_until: premiumUntil.toISOString(),
        }).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Demo: Payment verified and profile upgraded',
          premiumUntil: premiumUntil.toISOString(),
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

    if (isCoins) {
      const amountCoins = planType.startsWith('coins_')
        ? (parseInt(planType.replace('coins_', '')) || 50)
        : (parseInt(planType.replace(/^c_?/, '')) || 50);

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: `coins_${amountCoins}`,
        amount: parseFloat(String(txData?.amount || 0)),
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

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
      if (cleanPlan === '3m') days = 90;
      if (cleanPlan === '6m') days = 180;
      if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
      if (cleanPlan === 'lifetime') days = 36500;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: parseFloat(String(txData?.amount || 0)),
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ status: 'error', message: 'Failed to update user VIP profile status' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Chapa VIP purchase verified and profile upgraded',
        vipExpiresAt: expiresAt.toISOString(),
        type: 'vip',
      });
    } else {
      const days = PLAN_DAYS[planType] ?? 30;
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: parseFloat(String(txData?.amount || 0)),
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ premium_until: premiumUntil.toISOString() })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ status: 'error', message: 'Failed to update user premium profile status' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified and profile upgraded successfully',
        premiumUntil: premiumUntil.toISOString(),
        planType,
        type: 'premium',
      });
    }
  } catch (error: any) {
    console.error('[Chapa Verify] Unhandled error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
