import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch financial transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('financial_transactions')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (txError) {
      console.warn('[Admin Financials API] Error fetching financial_transactions:', txError);
    }

    // 2. Fetch payments
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (payError) {
      console.warn('[Admin Financials API] Error fetching payments:', payError);
    }

    // 3. Fetch coin transactions
    const { data: coins, error: coinError } = await supabaseAdmin
      .from('coin_transactions')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (coinError) {
      console.warn('[Admin Financials API] Error fetching coin_transactions:', coinError);
    }

    return NextResponse.json({
      transactions: transactions || [],
      payments: payments || [],
      coinTransactions: coins || []
    });
  } catch (err: any) {
    console.error('[Admin Financials API] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
