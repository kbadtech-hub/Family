import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration is missing');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { blocked_id } = body;
    if (!blocked_id) {
      return NextResponse.json({ error: 'blocked_id is required' }, { status: 400 });
    }
    if (blocked_id === user.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('blocks')
      .upsert({ blocker_id: user.id, blocked_id }, { onConflict: 'blocker_id,blocked_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, block: data });
  } catch (error: any) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blocked_id = searchParams.get('blocked_id');
    if (!blocked_id) {
      return NextResponse.json({ error: 'blocked_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blocked_id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'User unblocked' });
  } catch (error: any) {
    console.error('Unblock user error:', error);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
