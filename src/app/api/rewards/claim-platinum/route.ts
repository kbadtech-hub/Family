/**
 * BETESEB PLATFORM — Claim Platinum App Download Reward API
 * POST /api/rewards/claim-platinum
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Check if platinum is already awarded
    const { data: existing } = await supabaseAdmin
      .from('user_reward_tiers')
      .select('id')
      .eq('user_id', userId)
      .eq('tier', 'platinum')
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already claimed' });
    }

    // Trigger evaluation RPC which will process platinum now
    const { data: rpcRes } = await supabaseAdmin.rpc('evaluate_and_award_user_rewards', {
      p_user_id: userId
    });

    return NextResponse.json({ success: true, rpcRes });
  } catch (err: any) {
    console.error('[Claim Platinum Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
