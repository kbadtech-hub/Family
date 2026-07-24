import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { giftId, userId: reqUserId } = await req.json();

    if (!giftId) {
      return NextResponse.json({ error: 'Missing giftId' }, { status: 400 });
    }

    // Determine authenticated user
    let userId = reqUserId;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await client.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    // 1. Fetch gift record
    const { data: gift, error: giftErr } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (giftErr || !gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // Verify recipient
    if (gift.receiver_id !== userId) {
      return NextResponse.json({ error: 'You are not the recipient of this gift' }, { status: 403 });
    }

    // Check if already converted
    if (gift.is_converted || gift.status === 'converted') {
      return NextResponse.json({ error: 'ይህ ስጦታ ከዚህ በፊት ወደ ኮይን ተቀይሯል!' }, { status: 400 });
    }

    // 2. Calculate 20% conversion fee & net coins received
    const originalAmount = Number(gift.amount || 0);
    const feeRate = 0.20; // 20% conversion fee
    const fee = Math.floor(originalAmount * feeRate);
    const netCoins = originalAmount - fee;

    if (netCoins <= 0) {
      return NextResponse.json({ error: 'Gift amount is too low for conversion' }, { status: 400 });
    }

    // 3. Fetch user wallet
    const { data: wallet } = await supabaseAdmin
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', userId)
      .maybeSingle();

    const currentBalance = wallet ? Number(wallet.coin_balance) : 0;
    const newBalance = currentBalance + netCoins;

    // 4. Insert positive transaction in coin_transactions
    const { error: txErr } = await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: netCoins,
        type: 'gift_convert'
      });

    if (txErr) throw txErr;

    // 5. Update user wallet balance
    const { error: walletUpdateErr } = await supabaseAdmin
      .from('user_wallets')
      .upsert({
        id: userId,
        coin_balance: newBalance,
        updated_at: new Date().toISOString()
      });

    if (walletUpdateErr) throw walletUpdateErr;

    // 6. Update gift status to converted
    const { data: updatedGift, error: updateGiftErr } = await supabaseAdmin
      .from('gifts')
      .update({
        is_converted: true,
        status: 'converted',
        converted_at: new Date().toISOString(),
        conversion_fee: fee,
        net_coins_received: netCoins
      })
      .eq('id', giftId)
      .select(`
        *,
        sender:sender_id(full_name, avatar_url),
        gift_catalog:catalog_gift_id(name_en, name_am, image_url)
      `)
      .single();

    if (updateGiftErr) throw updateGiftErr;

    return NextResponse.json({
      success: true,
      message: `Gift converted to ${netCoins} coins (20% fee: ${fee} coins)`,
      netCoins,
      fee,
      newBalance,
      gift: updatedGift
    });
  } catch (err: any) {
    console.error('Convert gift error:', err);
    return NextResponse.json({ error: err.message || 'Failed to convert gift' }, { status: 500 });
  }
}
