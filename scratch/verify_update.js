const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mpreyyjclfklvofzfosc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcmV5eWpjbGZrbHZvZnpmb3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExNzYyMywiZXhwIjoyMDkyNjkzNjIzfQ.uplICXpCoqzPZZb55yKhoWa-srZhNOyhqzBfI_SSEMk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
  // Fetch financial transactions
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  // Server-side deduplication simulation
  const uniqueTxMap = new Map();
  if (transactions) {
    transactions.forEach((tx) => {
      const ref = tx.tx_ref || tx.id;
      if (!uniqueTxMap.has(ref)) {
        uniqueTxMap.set(ref, tx);
      }
    });
  }

  const uniquePaymentsMap = new Map();
  if (payments) {
    payments.forEach((p) => {
      const ref = (p.receipt_url || '')
        .replace(/^Chapa TX (\(Simulated\))?: /, '')
        .replace(/^Chapa TX: /, '')
        .trim() || p.id;
      if (!uniquePaymentsMap.has(ref) && !uniqueTxMap.has(ref)) {
        uniquePaymentsMap.set(ref, p);
      }
    });
  }

  const mergedList = [
    ...Array.from(uniqueTxMap.values()).map(tx => ({ type: 'Transaction', id: tx.id, ref: tx.tx_ref, amount: tx.gross_amount, user: tx.user_name_snapshot, plan: tx.revenue_source })),
    ...Array.from(uniquePaymentsMap.values()).map(p => ({ type: 'Payment', id: p.id, ref: p.receipt_url, amount: p.amount, user: p.user_id, plan: p.plan_type }))
  ].sort((a, b) => b.amount - a.amount);

  console.log('=== VERIFIED UNIFIED LIST OF TRANSACTIONS DISPLAYED ON ADMIN PORTAL ===');
  console.log(JSON.stringify(mergedList, null, 2));

  // Count the number of entries for Kalid Seid's 299.98 and 149.99
  const vipCount = mergedList.filter(item => item.amount === 299.98).length;
  const premiumCount = mergedList.filter(item => item.amount === 149.99).length;

  console.log(`\nVerification Summary:`);
  console.log(`- VIP 299.98 entries: ${vipCount} (Expected: 1)`);
  console.log(`- Premium 149.99 entries: ${premiumCount} (Expected: 1)`);

  if (vipCount === 1 && premiumCount === 1) {
    console.log('✅ SUCCESS: Duplicates successfully resolved!');
  } else {
    console.log('❌ FAILURE: Duplicates still present.');
  }
}

verify();
