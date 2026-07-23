/**
 * BETESEB ADMIN — Retroactive Batch Reward Processing for Existing Users API
 * POST /api/admin/rewards/sync-existing
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // 1. Fetch all user profile IDs
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, onboarding_completed, verification_status, is_verified, is_vip_member, is_lifetime, role');

    if (pErr) {
      console.error('[Sync Existing Users Error]:', pErr);
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    let processedCount = 0;
    let totalCoinsDistributed = 0;
    let stoppedEarly = false;

    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        const { data: res, error: rpcErr } = await supabaseAdmin.rpc('evaluate_and_award_user_rewards', {
          p_user_id: p.id
        });

        if (!rpcErr && res?.success) {
          processedCount++;
          totalCoinsDistributed += Number(res.total_new_coins || 0);

          if (res.auto_stopped || res.remaining_budget <= 0) {
            stoppedEarly = true;
            break;
          }
        }
      }
    }

    // 2. Fetch updated settings
    const { data: settings } = await supabaseAdmin
      .from('reward_system_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    return NextResponse.json({
      success: true,
      totalProfilesChecked: profiles?.length || 0,
      processedCount,
      totalCoinsDistributed,
      stoppedEarly,
      settings
    });
  } catch (err: any) {
    console.error('[Sync Existing Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
