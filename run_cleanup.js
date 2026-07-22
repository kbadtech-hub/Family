const http = require('http');

// Simple script to invoke cleanup endpoint locally or via code
async function runCleanup() {
  try {
    const { supabaseAdmin: supabase } = require('./src/lib/supabase-admin');
    
    // 1. Clean financial_transactions duplicate tx_ref
    const { data: allFts } = await supabase
      .from('financial_transactions')
      .select('id, tx_ref, created_at')
      .order('created_at', { ascending: true });

    let deletedFtCount = 0;
    if (allFts) {
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
      }
    }

    // 2. Clean payments duplicate receipt_url
    const { data: allPayments } = await supabase
      .from('payments')
      .select('id, user_id, plan_type, receipt_url, amount, created_at')
      .order('created_at', { ascending: true });

    let deletedPayCount = 0;
    if (allPayments) {
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
      }
    }

    console.log(`Database Cleanup Completed Successfully! Deleted ${deletedFtCount} duplicate financial transactions and ${deletedPayCount} duplicate payment records.`);
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

runCleanup();
