import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

      // Calculate premium duration
      let days = 30;
      if (planType === '3m') days = 90;
      if (planType === '12m') days = 365;
      if (planType === 'lifetime') days = 36500;

      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      // Record transaction
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_type: planType,
          amount: amountTotal,
          currency: 'USD',
          status: 'approved',
          receipt_url: 'Stripe Automated Gateway'
        });

      if (paymentError) {
        console.error("Failed to insert payment record in Stripe webhook:", paymentError);
      }

      // Upgrade profile premium validity
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          premium_until: premiumUntil.toISOString(),
          trial_ends_at: premiumUntil.toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error("Failed to upgrade profile in Stripe webhook:", profileError);
        return NextResponse.json({ status: 'error', message: 'Profile upgrade failed' }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${userId} to premium via Stripe for ${days} days.`);
      return NextResponse.json({ status: 'success', message: 'Payment recorded and profile upgraded' });
    }

    return NextResponse.json({ status: 'success', message: 'Stripe event received' });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
