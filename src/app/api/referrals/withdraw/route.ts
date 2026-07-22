import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, coinsAmount, bankName, accountNumber, accountName } = body as {
      userId: string;
      coinsAmount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
    };

    if (!userId || !coinsAmount || !bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (coinsAmount < 10000) {
      return NextResponse.json(
        { error: 'Minimum withdrawal requirement is 10,000 coins' },
        { status: 400 }
      );
    }

    // 1. Verify user wallet balance
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (walletErr || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const currentBalance = Number(wallet.coin_balance || 0);
    if (currentBalance < coinsAmount) {
      return NextResponse.json(
        { error: `Insufficient coin balance. You have ${currentBalance.toLocaleString()} coins.` },
        { status: 400 }
      );
    }

    // 2. Fetch current dynamic exchange rate from settings
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('cms_content')
      .limit(1)
      .single();

    // Default rate: 10,000 Coins = 500 ETB (0.05 ETB per coin)
    let ratePerCoin = 0.05;
    if (settingsData?.cms_content?.coin_exchange_rate_etb) {
      const configuredRate = Number(settingsData.cms_content.coin_exchange_rate_etb);
      if (!isNaN(configuredRate) && configuredRate > 0) {
        // If stored as ETB per 10,000 coins e.g. 500 ETB
        ratePerCoin = configuredRate > 10 ? configuredRate / 10000 : configuredRate;
      }
    }

    const grossEtb = Math.round(coinsAmount * ratePerCoin * 100) / 100;
    const feeEtb = Math.round(grossEtb * 0.30 * 100) / 100;
    const netEtb = Math.round((grossEtb - feeEtb) * 100) / 100;

    // 3. Deduct coins from user balance by inserting a negative coin_transaction
    const { error: txErr } = await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: -coinsAmount,
        type: 'admin_adjustment',
        note: `Withdrawal Request (${coinsAmount.toLocaleString()} Coins for Net ETB ${netEtb.toLocaleString()})`
      });

    if (txErr) {
      return NextResponse.json(
        { error: `Failed to deduct coins: ${txErr.message}` },
        { status: 500 }
      );
    }

    // 4. Insert withdrawal request
    const { data: requestData, error: reqErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        coins_amount: coinsAmount,
        exchange_rate: ratePerCoin,
        gross_etb: grossEtb,
        fee_etb: feeEtb,
        net_etb: netEtb,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: 'pending'
      })
      .select()
      .single();

    if (reqErr) {
      // Revert coin deduction if request fails
      await supabaseAdmin.from('coin_transactions').insert({
        user_id: userId,
        amount: coinsAmount,
        type: 'admin_adjustment',
        note: 'Revert failed withdrawal request'
      });

      return NextResponse.json(
        { error: `Failed to create withdrawal request: ${reqErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: requestData
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
