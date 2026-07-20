const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mpreyyjclfklvofzfosc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcmV5eWpjbGZrbHZvZnpmb3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExNzYyMywiZXhwIjoyMDkyNjkzNjIzfQ.uplICXpCoqzPZZb55yKhoWa-srZhNOyhqzBfI_SSEMk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function creditCoins() {
  const userId = '317dc156-7331-32f4-aec3-ba636e2f2d4f';
  const txRef = '317dc156-7331-32f4-aec3-ba636e2f2d4f-c100-tp89px';
  const chapaRef = 'APLc8aT770PM';

  console.log(`Crediting 100 coins to user ${userId} for Chapa Ref ${chapaRef}...`);

  // 1. Insert into payments table
  const { data: payData, error: payErr } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      plan_type: 'coins_100',
      amount: 100,
      currency: 'ETB',
      status: 'approved',
      receipt_url: `Chapa TX: ${txRef} (Ref: ${chapaRef})`
    })
    .select()
    .single();

  if (payErr) {
    console.error('Payment record insert error:', payErr);
  } else {
    console.log('Payment recorded:', payData);
  }

  // 2. Insert into coin_transactions (triggers handle_coin_transaction in DB)
  const { data: coinData, error: coinErr } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: userId,
      amount: 100,
      type: 'purchase',
      note: `Chapa Coin Purchase: 100 coins (Chapa Ref: ${chapaRef})`
    })
    .select()
    .single();

  if (coinErr) {
    console.error('Coin transaction insert error:', coinErr);
  } else {
    console.log('Coin transaction recorded:', coinData);
  }

  // 3. Verify user wallet balance
  const { data: wallet, error: wErr } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('Updated user wallet:', wallet, wErr);
}

creditCoins();
