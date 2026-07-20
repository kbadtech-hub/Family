const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mpreyyjclfklvofzfosc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcmV5eWpjbGZrbHZvZnpmb3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExNzYyMywiZXhwIjoyMDkyNjkzNjIzfQ.uplICXpCoqzPZZb55yKhoWa-srZhNOyhqzBfI_SSEMk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  console.log('--- PROFILES ---');
  const { data: profiles, error: prErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, premium_until, is_vip_member, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('Profiles:', profiles, prErr);

  console.log('--- USER WALLETS ---');
  const { data: wallets, error: wErr } = await supabase
    .from('user_wallets')
    .select('*')
    .limit(10);
  console.log('Wallets:', wallets, wErr);

  console.log('--- PAYMENTS COUNT ---');
  const { count, error: pCountErr } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true });
  console.log('Payments Count:', count, pCountErr);
}

check();
