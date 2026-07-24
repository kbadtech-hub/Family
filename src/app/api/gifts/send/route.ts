import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { recipientId, catalogGiftId, message, senderId: reqSenderId } = await req.json();

    if (!recipientId || !catalogGiftId) {
      return NextResponse.json({ error: 'Missing recipientId or catalogGiftId' }, { status: 400 });
    }

    // Try to get sender authenticated user from Supabase auth header if available, or fallback to body senderId
    let senderId = reqSenderId;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await client.auth.getUser();
      if (user) senderId = user.id;
    }

    if (!senderId) {
      return NextResponse.json({ error: 'Unauthorized: Missing sender' }, { status: 401 });
    }

    // 1. Fetch gift catalog details
    const { data: giftItem, error: giftItemErr } = await supabaseAdmin
      .from('gift_catalog')
      .select('*')
      .eq('id', catalogGiftId)
      .single();

    if (giftItemErr || !giftItem) {
      return NextResponse.json({ error: 'Gift catalog item not found' }, { status: 404 });
    }

    const price = Number(giftItem.coin_price);

    // 2. Fetch sender wallet
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', senderId)
      .maybeSingle();

    const currentBalance = wallet ? Number(wallet.coin_balance) : 0;

    if (currentBalance < price) {
      return NextResponse.json({
        error: `Insufficient coins balance (${currentBalance} available, ${price} required)`
      }, { status: 400 });
    }

    const newBalance = currentBalance - price;

    // 3. Record Debit Transaction (coin_transactions) using Admin client
    const { error: txErr } = await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: senderId,
        amount: -price,
        type: 'gift_send'
      });

    if (txErr) throw txErr;

    // 4. Update Wallet Balance
    const { error: walletUpdateErr } = await supabaseAdmin
      .from('user_wallets')
      .upsert({
        id: senderId,
        coin_balance: newBalance,
        updated_at: new Date().toISOString()
      });

    if (walletUpdateErr) throw walletUpdateErr;

    // 5. Insert Gift Record
    const { data: giftRecord, error: giftInsertErr } = await supabaseAdmin
      .from('gifts')
      .insert({
        sender_id: senderId,
        receiver_id: recipientId,
        catalog_gift_id: catalogGiftId,
        gift_type: giftItem.image_url || 'gift',
        amount: price,
        currency: 'COIN',
        message: message || null,
        status: 'completed',
        is_converted: false
      })
      .select(`
        *,
        sender:sender_id(full_name, avatar_url),
        gift_catalog:catalog_gift_id(name_en, name_am, image_url)
      `)
      .single();

    if (giftInsertErr) throw giftInsertErr;

    // 6. Log to financial_transactions for ledger
    try {
      const txRef = `GIFT-SEND-${senderId.substring(0, 8)}-${Date.now()}`;
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', senderId)
        .single();

      await supabaseAdmin.from('financial_transactions').insert({
        tx_ref: txRef,
        user_id: senderId,
        user_name_snapshot: prof?.full_name || prof?.email || 'Beteseb User',
        user_email_snapshot: prof?.email || null,
        revenue_source: 'gift_purchase',
        payment_gateway: 'coin_balance',
        currency: 'COINS',
        gross_amount: price,
        gateway_fee: 0,
        net_amount: price,
        payment_status: 'completed'
      });
    } catch (logErr) {
      console.error('Ledger log error:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Gift sent successfully',
      newBalance,
      gift: giftRecord
    });
  } catch (err: any) {
    console.error('Send gift error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send gift' }, { status: 500 });
  }
}
