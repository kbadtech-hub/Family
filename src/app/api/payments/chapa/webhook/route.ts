import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveCoinAmount } from '@/lib/coins';
import crypto from 'crypto';

/** Maps premium plan type strings to their duration in days */
const PLAN_DAYS: Record<string, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '12m': 365,
  '1y': 365,
  'lifetime': 36500,
};

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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = tx_ref.match(uuidRegex);
    let userId = '';
    let planType = '';
    if (match) {
      userId = match[0];
      planType = tx_ref.substring(userId.length + 1).split('-')[0];
    } else {
      const parts = tx_ref.split('-');
      userId = parts[0];
      planType = parts[1];
    }

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

    const isCoins = planType.startsWith('coins_') || planType.startsWith('c');
    const isVip = planType.startsWith('vip_') || planType.startsWith('v');

    if (isCoins) {
      const paidAmt = parseFloat(String(amount || 0));
      const amountCoins = resolveCoinAmount(planType, paidAmt, 'ETB');

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: `coins_${amountCoins}`,
        amount: parseFloat(String(amount || 0)),
        currency: 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: amountCoins,
        type: 'purchase',
        note: `Chapa Coin Purchase (Webhook): ${amountCoins} coins (${tx_ref})`
      });

      console.log(`[Chapa Webhook] ✅ User ${userId} credited with ${amountCoins} coins via Chapa.`);
      return NextResponse.json({ status: 'success', message: 'Payment recorded and coins credited successfully' });
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
        amount: parseFloat(String(amount || 0)),
        currency: 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

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
        console.error('[Chapa Webhook] Failed to update user VIP profile status:', profileError);
        return NextResponse.json({ status: 'error', message: 'Profile update failed' }, { status: 500 });
      }

      console.log(`[Chapa Webhook] ✅ User ${userId} upgraded to VIP for ${days} days via Chapa.`);
      return NextResponse.json({ status: 'success', message: 'Payment recorded and VIP status upgraded' });
    } else {
      const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
      const days = PLAN_DAYS[planType] ?? (isLifetime ? 36500 : 30);
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: parseFloat(String(amount || 0)),
        currency: 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

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
        console.error('[Chapa Webhook] Failed to update user profile:', profileError);
        return NextResponse.json({ status: 'error', message: 'Profile update failed' }, { status: 500 });
      }

      console.log(`[Chapa Webhook] ✅ User ${userId} upgraded to Diamond for ${days} days via Chapa (plan: ${planType}).`);
      return NextResponse.json({ status: 'success', message: 'Payment recorded and profile upgraded' });
    }
  } catch (error: any) {
    console.error('[Chapa Webhook] Unhandled error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
