import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mergeUserAccounts } from '@/lib/duplicate/merger';

// GET: Fetch flagged duplicate pairs for Admin Review
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const { data: flags, error } = await supabaseAdmin
      .from('duplicate_flags')
      .select(`
        id,
        primary_user_id,
        flagged_user_id,
        similarity_score,
        matched_stage,
        status,
        match_details,
        created_at,
        primary_user:primary_user_id (id, full_name, first_name, father_name, email, phone, avatar_url, birth_date, location, verification_status),
        flagged_user:flagged_user_id (id, full_name, first_name, father_name, email, phone, avatar_url, birth_date, location, verification_status)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: flags });
  } catch (error: any) {
    console.error('Error fetching duplicate flags for admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch duplicate flags' },
      { status: 500 }
    );
  }
}

// POST: Action resolution on a duplicate flag (approve, merge, block)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flagId, action, adminUserId } = body;

    if (!flagId || !action) {
      return NextResponse.json(
        { error: 'flagId and action are required.' },
        { status: 400 }
      );
    }

    const { data: flag, error: fetchErr } = await supabaseAdmin
      .from('duplicate_flags')
      .select('*')
      .eq('id', flagId)
      .single();

    if (fetchErr || !flag) {
      return NextResponse.json({ error: 'Duplicate flag record not found.' }, { status: 404 });
    }

    if (action === 'approve_distinct') {
      await supabaseAdmin
        .from('duplicate_flags')
        .update({
          status: 'approved_distinct',
          resolved_at: new Date().toISOString(),
          resolved_by: adminUserId || null,
        })
        .eq('id', flagId);

      return NextResponse.json({ success: true, message: 'Marked as distinct individual.' });
    } else if (action === 'merge') {
      await mergeUserAccounts({
        primaryUserId: flag.primary_user_id,
        secondaryUserId: flag.flagged_user_id,
        performedByUserId: adminUserId,
        reason: 'Admin resolved duplicate flag via dashboard',
      });

      return NextResponse.json({ success: true, message: 'Accounts merged successfully.' });
    } else if (action === 'block') {
      await supabaseAdmin
        .from('profiles')
        .update({
          is_locked: true,
          warning_message: 'Duplicate account suspended by administrator.',
        })
        .eq('id', flag.flagged_user_id);

      await supabaseAdmin
        .from('duplicate_flags')
        .update({
          status: 'blocked',
          resolved_at: new Date().toISOString(),
          resolved_by: adminUserId || null,
        })
        .eq('id', flagId);

      return NextResponse.json({ success: true, message: 'Duplicate profile suspended.' });
    }

    return NextResponse.json({ error: 'Invalid action provided.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error resolving duplicate flag:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve duplicate flag' },
      { status: 500 }
    );
  }
}
