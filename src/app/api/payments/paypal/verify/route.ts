import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    const { txRef, paypalTransactionId, planId } = body;
    if (!paypalTransactionId) {
      return NextResponse.json({ error: 'PayPal transaction ID is required' }, { status: 400 });
    }

    // Update the pending payment record with the PayPal transaction ID
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'pending_review',
        receipt_url: `PayPal TX: ${paypalTransactionId}`,
      })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Admin will review and approve (or automate via PayPal IPN/Webhooks)
    return NextResponse.json({
      success: true,
      message: 'Payment submitted for review. Your premium access will be activated within 24 hours after verification.',
      status: 'pending_review'
    });
  } catch (error: any) {
    console.error('PayPal verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
