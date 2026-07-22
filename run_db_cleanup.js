const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parse .env.local for credentials
const envText = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function clean() {
  console.log("Starting Database Deduplication Cleanup...");

  // 1. Clean financial_transactions
  const { data: allFts, error: ftErr } = await supabase
    .from('financial_transactions')
    .select('id, tx_ref, created_at')
    .order('created_at', { ascending: true });

  if (ftErr) console.error("FT fetch error:", ftErr.message);

  let deletedFtCount = 0;
  if (allFts && allFts.length > 0) {
    const seenTxRefs = new Set();
    const idsToDelete = [];

    for (const ft of allFts) {
      if (!ft.tx_ref) continue;
      if (seenTxRefs.has(ft.tx_ref)) {
        idsToDelete.push(ft.id);
      } else {
        seenTxRefs.add(ft.tx_ref);
      }
    }

    if (idsToDelete.length > 0) {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .in('id', idsToDelete);
      if (!error) deletedFtCount = idsToDelete.length;
      else console.error("Error deleting FT duplicates:", error.message);
    }
  }

  // 2. Clean payments
  const { data: allPayments, error: payErr } = await supabase
    .from('payments')
    .select('id, user_id, plan_type, receipt_url, amount, created_at')
    .order('created_at', { ascending: true });

  if (payErr) console.error("Payments fetch error:", payErr.message);

  let deletedPayCount = 0;
  if (allPayments && allPayments.length > 0) {
    const seenReceipts = new Set();
    const payIdsToDelete = [];

    for (const p of allPayments) {
      const cleanRef = (p.receipt_url || '')
        .replace(/^Chapa TX (\(Simulated\))?: /, '')
        .replace(/^Chapa TX: /, '')
        .trim();

      const key = cleanRef || `${p.user_id}-${p.plan_type}-${p.amount}`;
      if (seenReceipts.has(key)) {
        payIdsToDelete.push(p.id);
      } else {
        seenReceipts.add(key);
      }
    }

    if (payIdsToDelete.length > 0) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .in('id', payIdsToDelete);
      if (!error) deletedPayCount = payIdsToDelete.length;
      else console.error("Error deleting Payment duplicates:", error.message);
    }
  }

  console.log(`✅ DATABASE CLEANUP COMPLETE! Deleted ${deletedFtCount} duplicate financial transactions and ${deletedPayCount} duplicate payment records.`);
}

clean();
