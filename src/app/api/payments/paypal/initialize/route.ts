import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// PayPal hosted checkout — redirect user to PayPal payment page
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, amount, currency } = body;

    if (!planId || !amount || currency !== 'USD') {
      return NextResponse.json({ error: 'Invalid plan or currency. PayPal only accepts USD.' }, { status: 400 });
    }

    // Build PayPal.me URL with amount
    // tx_ref encodes: userId-planId for webhook verification
    const txRef = `${user.id}-${planId}-${Date.now()}`;
    
    // Store pending payment record
    await supabaseAdmin.from('payments').insert({
      user_id: user.id,
      plan_type: planId,
      amount: amount,
      currency: 'USD',
      status: 'pending',
      receipt_url: `PayPal pending - ref: ${txRef}`,
    });

    // Return PayPal link
    const paypalLink = `https://www.paypal.com/paypalme/beteseb/${amount}USD`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://beteseb.com'}/payment/success?ref=${txRef}&plan=${planId}`;

    return NextResponse.json({
      success: true,
      paypalLink,
      txRef,
      returnUrl,
      instructions: 'Complete the PayPal payment, then submit your transaction ID below for manual verification.'
    });
  } catch (error: any) {
    console.error('PayPal initialize error:', error);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}
