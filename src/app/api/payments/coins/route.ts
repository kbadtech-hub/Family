import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Beteseb Coin Ledger API Endpoint (/api/payments/coins)
 * Allows users to fetch their current coin balance, transaction history,
 * and purchase virtual coin packages natively.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ status: 'error', message: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Fetch user coin balance from user_wallets
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') { // PGRST116 is empty results / not found
      return NextResponse.json({ status: 'error', message: walletError.message }, { status: 500 });
    }

    // 2. Fetch user coin transactions history
    const { data: transactions, error: txError } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (txError) {
      return NextResponse.json({ status: 'error', message: txError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      balance: Number(wallet?.coin_balance || 0),
      transactions: transactions || []
    });

  } catch (error: any) {
    console.error('Coin ledger fetch error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, amount, type, referenceId, note } = await req.json();

    if (!userId || !amount || !type) {
      return NextResponse.json({ status: 'error', message: 'Missing userId, amount, or type' }, { status: 400 });
    }

    // Insert coin transaction into database
    // The DB trigger on_coin_transaction_inserted updates user_wallets balance automatically
    const { data, error } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        type,
        reference_id: referenceId || null,
        note: note || ''
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }

    // Fetch updated balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      status: 'success',
      message: 'Coin transaction recorded successfully',
      transaction: data,
      balance: Number(wallet?.coin_balance || 0)
    });

  } catch (error: any) {
    console.error('Coin transaction record error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
