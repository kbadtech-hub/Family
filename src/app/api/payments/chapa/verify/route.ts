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
      .select('id, status')
      .eq('receipt_url', `Chapa TX: ${tx_ref}`)
      .maybeSingle();

    if (existing) {
      console.log(`[Chapa Verify] tx_ref ${tx_ref} already processed — skipping.`);
      return NextResponse.json({
        status: 'success',
        message: 'Payment already verified and processed',
        alreadyProcessed: true,
      });
    }

    // ── 2. Verify with Chapa API ───────────────────────────────────────────────
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

    if (!chapaSecretKey) {
      // Dev/demo mode: no key configured — simulate success
      console.warn('[Chapa Verify] CHAPA_SECRET_KEY not set. Running in demo mode.');

      const parts = tx_ref.split('-');
      const extractedUserId = parts[0];
      const planType = parts[1];

      if (extractedUserId !== userId) {
        return NextResponse.json(
          { status: 'error', message: 'User ID mismatch in tx_ref' },
          { status: 403 }
        );
      }

      const days = PLAN_DAYS[planType] ?? 30;
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: 0,
        currency: 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      await supabase.from('profiles').update({
        premium_until: premiumUntil.toISOString(),
      }).eq('id', userId);

      return NextResponse.json({
        status: 'success',
        message: 'Demo: Payment verified and profile upgraded',
        premiumUntil: premiumUntil.toISOString(),
      });
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
    const parts = tx_ref.split('-');
    const extractedUserId = parts[0];
    const planType = parts[1];

    if (extractedUserId !== userId) {
      console.error(`[Chapa Verify] UserId mismatch: expected ${userId}, got ${extractedUserId}`);
      return NextResponse.json(
        { status: 'error', message: 'User ID mismatch — transaction does not belong to this user' },
        { status: 403 }
      );
    }

    if (!planType) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid transaction reference format — missing plan type' },
        { status: 400 }
      );
    }

    // ── 4. Calculate premium duration ──────────────────────────────────────────
    const days = PLAN_DAYS[planType] ?? 30;
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + days);

    // ── 5. Record payment in DB ────────────────────────────────────────────────
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      plan_type: planType,
      amount: parseFloat(String(txData?.amount || 0)),
      currency: txData?.currency || 'ETB',
      status: 'approved',
      receipt_url: `Chapa TX: ${tx_ref}`,
    });

    if (paymentError) {
      console.error('[Chapa Verify] Failed to insert payment record:', paymentError);
      // Don't fail — still try to upgrade the profile
    }

    // ── 6. Upgrade user profile ────────────────────────────────────────────────
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ premium_until: premiumUntil.toISOString() })
      .eq('id', userId);

    if (profileError) {
      console.error('[Chapa Verify] Failed to update user profile:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'Payment verified but profile upgrade failed' },
        { status: 500 }
      );
    }

    console.log(
      `[Chapa Verify] ✅ User ${userId} upgraded for ${days} days via Chapa (plan: ${planType}, tx_ref: ${tx_ref}).`
    );

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified and profile upgraded successfully',
      premiumUntil: premiumUntil.toISOString(),
      planType,
    });

  } catch (error: any) {
    console.error('[Chapa Verify] Unhandled error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
