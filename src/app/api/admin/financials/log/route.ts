import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * BETESEB — Secure Admin Financial Transaction Logger
 *
 * Allows admin to manually log a financial transaction via server-side
 * service-role access. Prevents direct client-side Supabase writes.
 *
 * POST /api/admin/financials/log
 * Body: { tx_ref, user_name, user_email, revenue_source, payment_gateway, currency, gross_amount, notes? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tx_ref,
      user_name,
      user_email,
      revenue_source,
      payment_gateway,
      currency,
      gross_amount,
      notes,
    } = body;

    // Validation
    if (!revenue_source || !payment_gateway || !currency || gross_amount === undefined) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: revenue_source, payment_gateway, currency, gross_amount' },
        { status: 400 }
      );
    }

    const grossAmt = parseFloat(String(gross_amount));
    if (isNaN(grossAmt) || grossAmt < 0) {
      return NextResponse.json(
        { status: 'error', message: 'gross_amount must be a non-negative number' },
        { status: 400 }
      );
    }

    // Duplicate check on tx_ref
    if (tx_ref) {
      const { data: existing } = await supabaseAdmin
        .from('financial_transactions')
        .select('id')
        .eq('tx_ref', tx_ref)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { status: 'error', message: `Transaction reference "${tx_ref}" already exists in the ledger.` },
          { status: 409 }
        );
      }
    }

    // Compute gateway fee and net amount
    const gatewayFeeRate = payment_gateway === 'chapa' ? 0.035 : 0.029;
    const gatewayFee = Math.round(grossAmt * gatewayFeeRate * 100) / 100;
    const netAmount = Math.max(0, grossAmt - gatewayFee);

    // Insert into financial_transactions using service-role client
    const insertPayload: Record<string, any> = {
      user_name_snapshot: user_name || 'Admin Manual Entry',
      user_email_snapshot: user_email || null,
      revenue_source,
      payment_gateway,
      currency: currency || 'ETB',
      gross_amount: grossAmt,
      gateway_fee: gatewayFee,
      net_amount: netAmount,
      payment_status: 'completed',
    };

    if (tx_ref) insertPayload.tx_ref = tx_ref;
    if (notes) insertPayload.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[Admin Financials Log] Insert error:', error.message);
      return NextResponse.json(
        { status: 'error', message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`[Admin Financials Log] Manually logged: ${data.id} | ${revenue_source} | ${grossAmt} ${currency}`);

    return NextResponse.json({
      status: 'success',
      message: 'Transaction logged successfully',
      transaction: data,
    });

  } catch (error: any) {
    console.error('[Admin Financials Log] Unhandled error:', error);
    return NextResponse.json(
      { status: 'failed', message: error.message },
      { status: 500 }
    );
  }
}
