import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * BETESEB — Chapa Webhook Handler
 * Verifies the HMAC-SHA256 signature from Chapa before processing.
 * Set CHAPA_WEBHOOK_SECRET in your environment variables (from Chapa dashboard).
 */

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-chapa-signature') || '';
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || '';

    // ── 1. Signature Verification ─────────────────────────────────────────────
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('[Chapa Webhook] Invalid signature — possible spoofed request.');
        return NextResponse.json({ status: 'error', message: 'Invalid webhook signature' }, { status: 401 });
      }
    } else if (webhookSecret && !signature) {
      // Webhook secret is set but no signature header — reject in production
      console.warn('[Chapa Webhook] Missing X-Chapa-Signature header.');
      return NextResponse.json({ status: 'error', message: 'Missing webhook signature' }, { status: 401 });
    }
    // If CHAPA_WEBHOOK_SECRET is not set: allow (dev mode only)

    const body = JSON.parse(rawBody);
    const { tx_ref, status, amount } = body;

    // ── 2. Only process successful transactions ────────────────────────────────
    if (status !== 'success' && status !== 'completed') {
      return NextResponse.json({ status: 'success', message: 'Event received — payment not successful, ignored.' });
    }

    // tx_ref format: "userId-planType-timestamp"
    const parts = tx_ref.split('-');
    const userId = parts[0];
    const planType = parts[1];

    if (!userId || !planType) {
      return NextResponse.json({ status: 'error', message: 'Invalid transaction reference format' }, { status: 400 });
    }

    // ── 3. Idempotency check — prevent double-processing the same tx_ref ──────
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('receipt_url', `Chapa TX: ${tx_ref}`)
      .maybeSingle();

    if (existing) {
      console.log(`[Chapa Webhook] tx_ref ${tx_ref} already processed — skipping.`);
      return NextResponse.json({ status: 'success', message: 'Already processed' });
    }

    // ── 4. Calculate premium duration ─────────────────────────────────────────
    const PLAN_DAYS: Record<string, number> = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '12m': 365,
      'lifetime': 36500,
    };
    const days = PLAN_DAYS[planType] ?? 30;

    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + days);

    // ── 5. Record payment ──────────────────────────────────────────────────────
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_type: planType,
        amount: parseFloat(String(amount || 0)),
        currency: 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

    if (paymentError) {
      console.error('[Chapa Webhook] Failed to insert payment record:', paymentError);
    }

    // ── 6. Upgrade user profile ────────────────────────────────────────────────
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ premium_until: premiumUntil.toISOString() })
      .eq('id', userId);

    if (profileError) {
      console.error('[Chapa Webhook] Failed to update user profile:', profileError);
      return NextResponse.json({ status: 'error', message: 'Profile update failed' }, { status: 500 });
    }

    console.log(`[Chapa Webhook] ✅ User ${userId} upgraded to Diamond for ${days} days via Chapa (plan: ${planType}).`);
    return NextResponse.json({ status: 'success', message: 'Payment recorded and profile upgraded' });

  } catch (error: any) {
    console.error('[Chapa Webhook] Unhandled error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
