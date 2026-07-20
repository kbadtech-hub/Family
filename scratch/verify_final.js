const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mpreyyjclfklvofzfosc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcmV5eWpjbGZrbHZvZnpmb3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExNzYyMywiZXhwIjoyMDkyNjkzNjIzfQ.uplICXpCoqzPZZb55yKhoWa-srZhNOyhqzBfI_SSEMk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyAll() {
  const userId = '317dc156-7331-32f4-aec3-ba636e2f2d4f';

  console.log('--- USER PROFILE & WALLET CHECK ---');
  const { data: profile } = await supabase.from('profiles').select('id, full_name, email').eq('id', userId).single();
  const { data: wallet } = await supabase.from('user_wallets').select('*').eq('id', userId).single();
  const { data: payments } = await supabase.from('payments').select('*').eq('user_id', userId);
  const { data: coinTxs } = await supabase.from('coin_transactions').select('*').eq('user_id', userId);

  console.log('Profile:', profile);
  console.log('Wallet:', wallet);
  console.log('Payments:', payments);
  console.log('Coin Transactions:', coinTxs);
}

verifyAll();
