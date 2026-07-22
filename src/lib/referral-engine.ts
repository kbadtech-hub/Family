import { supabaseAdmin } from './supabase-admin';

export type TriggerType = 'gold_verification' | 'first_subscription' | 'mobile_app_login';

export interface TriggerResult {
  success: boolean;
  rewardGiven: boolean;
  coinsCredited: number;
  triggerType: TriggerType;
  referrerId?: string;
  message?: string;
}

/**
 * Evaluates and credits real-time referral rewards for a given referee user.
 * 
 * Rewards Breakdown:
 *  - Trigger 1: Gold KYC Verification -> 30 Coins
 *  - Trigger 2: First Subscription Payment -> 30 Coins (Total = 60)
 *  - Trigger 3: Mobile App Login -> 40 Coins (Total = 100)
 */
export async function evaluateReferralTriggers(
  refereeId: string,
  triggerType: TriggerType
): Promise<TriggerResult> {
  try {
    // 1. Fetch referral record for referee
    const { data: referral, error: refError } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referee_id', refereeId)
      .single();

    if (refError || !referral) {
      // Check if profile has referred_by set, but referrals row missing
      const { data: refereeProfile } = await supabaseAdmin
        .from('profiles')
        .select('referred_by, referral_code')
        .eq('id', refereeId)
        .single();

      if (!refereeProfile || !refereeProfile.referred_by) {
        return {
          success: true,
          rewardGiven: false,
          coinsCredited: 0,
          triggerType,
          message: 'User was not registered via referral'
        };
      }

      // Create missing referrals record
      const { data: newRef, error: createErr } = await supabaseAdmin
        .from('referrals')
        .insert({
          referrer_id: refereeProfile.referred_by,
          referee_id: refereeId,
          referral_code: refereeProfile.referral_code || 'DIRECT'
        })
        .select()
        .single();

      if (createErr || !newRef) {
        return { success: false, rewardGiven: false, coinsCredited: 0, triggerType, message: createErr?.message };
      }

      return processTriggerReward(newRef, triggerType);
    }

    return processTriggerReward(referral, triggerType);
  } catch (error: any) {
    console.error('Error evaluating referral trigger:', error);
    return {
      success: false,
      rewardGiven: false,
      coinsCredited: 0,
      triggerType,
      message: error?.message || 'Internal error'
    };
  }
}

async function processTriggerReward(
  referral: any,
  triggerType: TriggerType
): Promise<TriggerResult> {
  let rewardCoins = 0;
  let updateField = '';
  let dateField = '';
  let noteText = '';

  if (triggerType === 'gold_verification') {
    if (referral.gold_reward_given) {
      return { success: true, rewardGiven: false, coinsCredited: 0, triggerType, message: 'Gold reward already claimed' };
    }
    rewardCoins = 30;
    updateField = 'gold_reward_given';
    dateField = 'gold_reward_at';
    noteText = 'Referral Reward: Gold Verification Passed (30 Coins)';
  } else if (triggerType === 'first_subscription') {
    if (referral.sub_reward_given) {
      return { success: true, rewardGiven: false, coinsCredited: 0, triggerType, message: 'Subscription reward already claimed' };
    }
    rewardCoins = 30;
    updateField = 'sub_reward_given';
    dateField = 'sub_reward_at';
    noteText = 'Referral Reward: First Subscription Payment (30 Coins)';
  } else if (triggerType === 'mobile_app_login') {
    if (referral.app_reward_given) {
      return { success: true, rewardGiven: false, coinsCredited: 0, triggerType, message: 'App login reward already claimed' };
    }
    rewardCoins = 40;
    updateField = 'app_reward_given';
    dateField = 'app_reward_at';
    noteText = 'Referral Reward: Mobile App Login (40 Coins)';
  }

  if (rewardCoins <= 0) {
    return { success: false, rewardGiven: false, coinsCredited: 0, triggerType, message: 'Invalid trigger type' };
  }

  // 1. Update referrals record
  const currentTotal = Number(referral.total_coins_earned || 0);
  const { error: updateErr } = await supabaseAdmin
    .from('referrals')
    .update({
      [updateField]: true,
      [dateField]: new Date().toISOString(),
      total_coins_earned: currentTotal + rewardCoins,
      updated_at: new Date().toISOString()
    })
    .eq('id', referral.id);

  if (updateErr) {
    return { success: false, rewardGiven: false, coinsCredited: 0, triggerType, message: updateErr.message };
  }

  // 2. Insert coin_transaction for referrer -> trigger automatically updates user_wallets.coin_balance
  const { error: txErr } = await supabaseAdmin
    .from('coin_transactions')
    .insert({
      user_id: referral.referrer_id,
      amount: rewardCoins,
      type: 'admin_adjustment',
      reference_id: referral.id,
      note: noteText
    });

  if (txErr) {
    console.error('Error inserting coin transaction for referral:', txErr);
  }

  return {
    success: true,
    rewardGiven: true,
    coinsCredited: rewardCoins,
    triggerType,
    referrerId: referral.referrer_id,
    message: `Successfully credited ${rewardCoins} coins to referrer.`
  };
}
