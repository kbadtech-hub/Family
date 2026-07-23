/**
 * BETESEB ADMIN — Welcoming & Reward Management API
 * GET /api/admin/rewards -> Fetch budget, settings, and tier stats
 * POST /api/admin/rewards -> Update budget, app links, and toggle system
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch settings
    let { data: settings, error: setErr } = await supabaseAdmin
      .from('reward_system_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (setErr || !settings) {
      // Create initial settings row if missing
      const { data: newSettings } = await supabaseAdmin
        .from('reward_system_settings')
        .insert({
          id: 'global',
          total_budget: 10000,
          distributed_coins: 0,
          remaining_coins: 10000,
          is_active: true
        })
        .select('*')
        .single();

      settings = newSettings || {
        id: 'global',
        total_budget: 10000,
        distributed_coins: 0,
        remaining_coins: 10000,
        is_active: true,
        google_play_url: 'https://play.google.com/store/apps/details?id=com.beteseb.app',
        apple_store_url: 'https://apps.apple.com/app/beteseb/id123456789'
      };
    }

    // 2. Fetch tier counts breakdown
    const { data: tierCounts } = await supabaseAdmin
      .from('user_reward_tiers')
      .select('tier, coins_awarded');

    const breakdown: Record<string, { count: number; coins: number }> = {
      bronze: { count: 0, coins: 0 },
      silver: { count: 0, coins: 0 },
      gold: { count: 0, coins: 0 },
      platinum: { count: 0, coins: 0 },
      diamond: { count: 0, coins: 0 },
      vip: { count: 0, coins: 0 }
    };

    if (tierCounts) {
      tierCounts.forEach((item: any) => {
        if (breakdown[item.tier]) {
          breakdown[item.tier].count += 1;
          breakdown[item.tier].coins += Number(item.coins_awarded || 0);
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings,
      breakdown
    });
  } catch (err: any) {
    console.error('[Admin Rewards GET Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { totalBudget, googlePlayUrl, appleStoreUrl, isActive } = await req.json();

    const { data: current } = await supabaseAdmin
      .from('reward_system_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    const newTotalBudget = totalBudget !== undefined ? Number(totalBudget) : (current?.total_budget || 10000);
    const distributed = current?.distributed_coins || 0;
    const newRemainingBudget = Math.max(0, newTotalBudget - distributed);

    const updatePayload: Record<string, any> = {
      total_budget: newTotalBudget,
      remaining_coins: newRemainingBudget,
      updated_at: new Date().toISOString()
    };

    if (googlePlayUrl !== undefined) updatePayload.google_play_url = googlePlayUrl;
    if (appleStoreUrl !== undefined) updatePayload.apple_store_url = appleStoreUrl;
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);

    const { data: updated, error } = await supabaseAdmin
      .from('reward_system_settings')
      .update(updatePayload)
      .eq('id', 'global')
      .select('*')
      .single();

    if (error) {
      console.error('[Admin Rewards POST Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('[Admin Rewards POST Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
