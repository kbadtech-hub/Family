import { supabaseAdmin as supabase } from './src/lib/supabase-admin';

async function runCleanup() {
  try {
    // 1. Clean financial_transactions duplicate tx_ref
    const { data: allFts, error: ftErr } = await supabase
      .from('financial_transactions')
      .select('id, tx_ref, created_at')
      .order('created_at', { ascending: true });

    let deletedFtCount = 0;
    if (allFts) {
      const seenTxRefs = new Set<string>();
      const idsToDelete: string[] = [];

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

    // 2. Clean payments duplicate receipt_url
    const { data: allPayments, error: payErr } = await supabase
      .from('payments')
      .select('id, user_id, plan_type, receipt_url, amount, created_at')
      .order('created_at', { ascending: true });

    let deletedPayCount = 0;
    if (allPayments) {
      const seenReceipts = new Set<string>();
      const payIdsToDelete: string[] = [];

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

    console.log(`Database Cleanup Completed Successfully! Deleted ${deletedFtCount} duplicate financial transactions and ${deletedPayCount} duplicate payment records.`);
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

runCleanup();
