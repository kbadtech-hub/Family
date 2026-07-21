import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveCoinAmount } from '@/lib/coins';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventType = body?.type;

    if (eventType === 'checkout.session.completed') {
      const session = body.data?.object;
      const userId = session?.metadata?.userId;
      const planType = session?.metadata?.planType;
      const amountTotal = (session?.amount_total || 0) / 100; // Stripe amounts are in cents

      if (!userId || !planType) {
        return NextResponse.json({ status: 'error', message: 'Missing metadata' }, { status: 400 });
      }

      const isCoins = planType.startsWith('coins_');
      const isVip = planType.startsWith('vip_');

      if (isCoins) {
        const amountCoins = resolveCoinAmount(planType, amountTotal, 'USD');

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: amountTotal,
          currency: 'USD',
          status: 'approved',
          receipt_url: `Stripe Transaction ID: ${session.id || 'Stripe Gateway'}`,
        });

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
          note: `Stripe Coin Purchase (Webhook): ${planType}`
        });

        console.log(`[Stripe Webhook] ✅ User ${userId} credited with ${amountCoins} coins via Stripe.`);
        return NextResponse.json({ status: 'success', message: 'Payment recorded and coins credited successfully' });
      } else if (isVip) {
        let days = 30;
        const cleanPlan = planType.replace('vip_', '');
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
          amount: amountTotal,
          currency: 'USD',
          status: 'approved',
          receipt_url: `Stripe Transaction ID: ${session.id || 'Stripe Gateway'}`,
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
          console.error('[Stripe Webhook] Failed to update user VIP profile status:', profileError);
          return NextResponse.json({ status: 'error', message: 'Profile update failed' }, { status: 500 });
        }

        console.log(`[Stripe Webhook] ✅ User ${userId} upgraded to VIP for ${days} days via Stripe.`);
        return NextResponse.json({ status: 'success', message: 'Payment recorded and VIP status upgraded' });
      } else {
        const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
        let days = 30;
        if (planType === '3m') days = 90;
        if (planType === '6m') days = 180;
        if (planType === '12m' || planType === '1y') days = 365;
        if (isLifetime) days = 36500;

        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + days);

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: amountTotal,
          currency: 'USD',
          status: 'approved',
          receipt_url: `Stripe Transaction ID: ${session.id || 'Stripe Gateway'}`
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
          console.error("Failed to upgrade profile in Stripe webhook:", profileError);
          return NextResponse.json({ status: 'error', message: 'Profile upgrade failed' }, { status: 500 });
        }

        console.log(`Successfully upgraded user ${userId} to premium via Stripe for ${days} days.`);
        return NextResponse.json({ status: 'success', message: 'Payment recorded and profile upgraded' });
      }
    }

    return NextResponse.json({ status: 'success', message: 'Stripe event received' });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
