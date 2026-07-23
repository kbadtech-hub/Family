/**
 * BETESEB PLATFORM — Dismiss Reward Popup API
 * POST /api/rewards/dismiss-popup
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, tier } = await req.json();

    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing required parameters: userId, tier' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_reward_tiers')
      .update({
        popup_seen: true,
        popup_seen_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('tier', tier);

    if (error) {
      console.error('[Dismiss Popup Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId, tier });
  } catch (err: any) {
    console.error('[Dismiss Popup Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
