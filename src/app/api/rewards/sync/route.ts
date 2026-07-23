/**
 * BETESEB PLATFORM — User Reward Evaluation & Sync API
 * POST /api/rewards/sync
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIER_REWARDS_LIST = [
  { tier: 'bronze', coins: 5 },
  { tier: 'silver', coins: 10 },
  { tier: 'gold', coins: 15 },
  { tier: 'platinum', coins: 20 },
  { tier: 'diamond', coins: 30 },
  { tier: 'vip', coins: 70 }
];

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Attempt RPC first
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('evaluate_and_award_user_rewards', {
      p_user_id: userId,
    });

    if (!rpcErr && rpcData?.success) {
      return NextResponse.json({
        success: true,
        result: rpcData,
        unseen_popups: rpcData.unseen_popups || []
      });
    }

    // 2. JS Fallback Evaluation (Guarantees rewards even if RPC is pending)
    // Fetch global settings
    let totalBudget = 10000;
    let distributed = 0;
    let remaining = 10000;
    let isActive = true;

    const { data: settingsRow } = await supabaseAdmin
      .from('reward_system_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (settingsRow) {
      totalBudget = Number(settingsRow.total_budget || 10000);
      distributed = Number(settingsRow.distributed_coins || 0);
      remaining = Number(settingsRow.remaining_coins || 10000);
      isActive = Boolean(settingsRow.is_active);
    } else {
      // Check fallback in main settings table
      const { data: mainSettings } = await supabaseAdmin
        .from('settings')
        .select('cms_content')
        .single();

      if (mainSettings?.cms_content?.reward_settings) {
        const rs = mainSettings.cms_content.reward_settings;
        totalBudget = Number(rs.totalBudget || 10000);
        distributed = Number(rs.distributed || 0);
        remaining = Number(rs.remaining || 10000);
        isActive = Boolean(rs.isActive);
      }
    }

    if (!isActive || remaining <= 0) {
      const { data: popups } = await supabaseAdmin
        .from('user_reward_tiers')
        .select('*')
        .eq('user_id', userId)
        .eq('popup_seen', false);

      return NextResponse.json({
        success: true,
        unseen_popups: popups || [],
        auto_stopped: true
      });
    }

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch existing user rewards
    const { data: existingTiers } = await supabaseAdmin
      .from('user_reward_tiers')
      .select('tier')
      .eq('user_id', userId);

    const existingTierSet = new Set((existingTiers || []).map((t: any) => t.tier));

    let newCoinsTotal = 0;
    let newAwardsCount = 0;

    for (const item of TIER_REWARDS_LIST) {
      let isEligible = false;

      switch (item.tier) {
        case 'bronze':
          isEligible = true;
          break;
        case 'silver':
          isEligible = Boolean(profile.onboarding_completed);
          break;
        case 'gold':
          isEligible = profile.verification_status === 'verified' || Boolean(profile.is_verified);
          break;
        case 'platinum':
          isEligible = existingTierSet.has('platinum');
          break;
        case 'diamond':
          isEligible = Boolean(profile.is_lifetime) || (profile.premium_until && new Date(profile.premium_until) > new Date()) || ['admin', 'super_admin', 'expert'].includes(profile.role);
          break;
        case 'vip':
          isEligible = Boolean(profile.is_vip_member) && (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date() || Boolean(profile.is_lifetime));
          break;
      }

      if (isEligible && !existingTierSet.has(item.tier)) {
        if (remaining >= item.coins) {
          // Insert into user_reward_tiers
          await supabaseAdmin.from('user_reward_tiers').insert({
            user_id: userId,
            tier: item.tier,
            coins_awarded: item.coins,
            popup_seen: false
          });

          // Insert into coin_transactions -> updates user_wallets balance
          await supabaseAdmin.from('coin_transactions').insert({
            user_id: userId,
            amount: item.coins,
            type: 'coin_transfer',
            note: `Welcome & Tier Reward: ${item.tier.toUpperCase()}`
          });

          distributed += item.coins;
          remaining = Math.max(0, remaining - item.coins);
          newCoinsTotal += item.coins;
          newAwardsCount++;
          existingTierSet.add(item.tier);
        } else {
          break; // budget exhausted
        }
      }
    }

    // Save updated budget if changed
    if (newCoinsTotal > 0) {
      await supabaseAdmin.from('reward_system_settings').upsert({
        id: 'global',
        total_budget: totalBudget,
        distributed_coins: distributed,
        remaining_coins: remaining,
        is_active: isActive,
        updated_at: new Date().toISOString()
      });
    }

    // Fetch unseen popups for response
    const { data: unseenPopups } = await supabaseAdmin
      .from('user_reward_tiers')
      .select('*')
      .eq('user_id', userId)
      .eq('popup_seen', false);

    return NextResponse.json({
      success: true,
      newAwardsCount,
      newCoinsTotal,
      remainingBudget: remaining,
      unseen_popups: unseenPopups || []
    });
  } catch (err: any) {
    console.error('[Rewards Sync Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
