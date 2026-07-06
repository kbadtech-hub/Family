import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tx_ref, status, amount } = body;

    // Chapa returns status: 'success' for successful transactions
    if (status === 'success' || status === 'completed') {
      // tx_ref contains: "user_id-plan_type-timestamp"
      const [userId, planType] = tx_ref.split('-');

      if (!userId || !planType) {
        return NextResponse.json({ status: 'error', message: 'Invalid transaction reference format' }, { status: 400 });
      }

      // Calculate premium days based on package type
      let days = 30;
      if (planType === '3m') days = 90;
      if (planType === '12m') days = 365;
      if (planType === 'lifetime') days = 36500; // ~100 years

      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      // Insert record in payments table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_type: planType,
          amount: parseFloat(amount),
          currency: 'ETB',
          status: 'approved',
          receipt_url: 'Chapa Automated Gateway'
        });

      if (paymentError) {
        console.error("Failed to insert payment record in webhook:", paymentError);
      }

      // Upgrade profile premium dates in profiles table
      // Note: trial_ends_at removed — Beteseb uses Freemium model (Blueprint v4.0)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          premium_until: premiumUntil.toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error("Failed to update user profile in webhook:", profileError);
        return NextResponse.json({ status: 'error', message: 'Profile update failed' }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${userId} to premium via Chapa for ${days} days.`);
      return NextResponse.json({ status: 'success', message: 'Payment recorded and profile upgraded' });
    }

    return NextResponse.json({ status: 'success', message: 'Event received and ignored (payment not successful)' });
  } catch (error: any) {
    console.error("Chapa Webhook Error:", error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
