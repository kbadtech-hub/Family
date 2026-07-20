/**
 * BETESEB ADMIN — Realtime Feed API (Service Role)
 * GET /api/admin/feed
 * 
 * Returns all pending verifications and payments using SUPABASE_SERVICE_ROLE_KEY
 * so RLS policies never block the admin from seeing new submissions.
 * 
 * Used by the admin portal polling fallback to catch items that
 * Realtime subscriptions may have missed.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch pending verifications
    const { data: verifications, error: verError } = await supabaseAdmin
      .from('verifications')
      .select('*, profiles(full_name, birth_date, location, phone)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (verError) {
      console.error('[Admin Feed] verifications fetch error:', verError);
    }

    // Fetch pending payments
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select('*, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (payError) {
      console.error('[Admin Feed] payments fetch error:', payError);
    }

    // Fetch open support tickets
    const { data: tickets, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('*, profiles(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (ticketError) {
      console.error('[Admin Feed] support_tickets fetch error:', ticketError);
    }

    return NextResponse.json({
      verifications: verifications || [],
      payments: payments || [],
      tickets: tickets || [],
    });
  } catch (err: any) {
    console.error('[Admin Feed] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
