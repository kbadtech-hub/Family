import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch all user profiles with no RLS restrictions
    const { data: profiles, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profError) {
      console.error('[Admin Analytics API] Error fetching profiles:', profError);
      return NextResponse.json({ error: profError.message }, { status: 500 });
    }

    // 2. Fetch all vouch records to resolve Platinum tier
    const { data: vouches, error: vouchError } = await supabaseAdmin
      .from('vouch_records')
      .select('user_id');

    if (vouchError) {
      console.warn('[Admin Analytics API] Error fetching vouch_records:', vouchError);
    }

    // 3. Fetch verifications for verification status fallback
    const { data: verifications, error: verError } = await supabaseAdmin
      .from('verifications')
      .select('user_id, status, doc_type, created_at');

    if (verError) {
      console.warn('[Admin Analytics API] Error fetching verifications:', verError);
    }

    return NextResponse.json({
      profiles: profiles || [],
      vouchedUserIds: (vouches || []).map((v: any) => v.user_id),
      verifications: verifications || []
    });
  } catch (err: any) {
    console.error('[Admin Analytics API] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
