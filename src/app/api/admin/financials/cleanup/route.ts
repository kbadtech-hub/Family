import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

/**
 * BETESEB — Admin Financials Cleanup Endpoint
 *
 * Scans `financial_transactions` and `payments` tables for duplicate transactions
 * sharing the same `tx_ref` or receipt reference, keeping only 1 unique record per transaction.
 *
 * POST /api/admin/financials/cleanup
 */
export async function POST() {
  try {
    let deletedFtCount = 0;
    let deletedPaymentsCount = 0;

    // ── 1. Deduplicate financial_transactions ─────────────────────────────────
    const { data: allFts, error: ftErr } = await supabase
      .from('financial_transactions')
      .select('id, tx_ref, created_at, payment_status')
      .order('created_at', { ascending: true });

    if (!ftErr && allFts) {
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
        const { error: deleteFtErr } = await supabase
          .from('financial_transactions')
          .delete()
          .in('id', idsToDelete);
        
        if (!deleteFtErr) {
          deletedFtCount = idsToDelete.length;
        } else {
          console.error('[Financials Cleanup] Failed deleting duplicate financial_transactions:', deleteFtErr.message);
        }
      }
    }

    // ── 2. Deduplicate payments table ─────────────────────────────────────────
    const { data: allPayments, error: payErr } = await supabase
      .from('payments')
      .select('id, user_id, plan_type, receipt_url, amount, created_at')
      .order('created_at', { ascending: true });

    if (!payErr && allPayments) {
      const seenReceipts = new Set<string>();
      const paymentIdsToDelete: string[] = [];

      for (const p of allPayments) {
        // Extract canonical transaction ref
        const cleanRef = (p.receipt_url || '')
          .replace(/^Chapa TX (\(Simulated\))?: /, '')
          .replace(/^Chapa TX: /, '')
          .trim();

        const key = cleanRef || `${p.user_id}-${p.plan_type}-${p.amount}`;
        if (seenReceipts.has(key)) {
          paymentIdsToDelete.push(p.id);
        } else {
          seenReceipts.add(key);
        }
      }

      if (paymentIdsToDelete.length > 0) {
        const { error: deletePayErr } = await supabase
          .from('payments')
          .delete()
          .in('id', paymentIdsToDelete);

        if (!deletePayErr) {
          deletedPaymentsCount = paymentIdsToDelete.length;
        } else {
          console.error('[Financials Cleanup] Failed deleting duplicate payments:', deletePayErr.message);
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Cleanup completed successfully. Removed ${deletedFtCount} duplicate financial transactions and ${deletedPaymentsCount} duplicate payment records.`,
      deletedFinancialTransactions: deletedFtCount,
      deletedPayments: deletedPaymentsCount
    });
  } catch (err: any) {
    console.error('[Financials Cleanup] Error during execution:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
