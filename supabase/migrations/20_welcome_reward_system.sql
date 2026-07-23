-- =========================================================================
-- BETESEB PLATFORM — MODULE 20: WELCOME & TIER-BASED REWARD SYSTEM
-- =========================================================================

-- 1. Global Reward System Settings Table
CREATE TABLE IF NOT EXISTS public.reward_system_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  total_budget NUMERIC DEFAULT 10000 NOT NULL,
  distributed_coins NUMERIC DEFAULT 0 NOT NULL,
  remaining_coins NUMERIC DEFAULT 10000 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  google_play_url TEXT DEFAULT 'https://play.google.com/store/apps/details?id=com.beteseb.app',
  apple_store_url TEXT DEFAULT 'https://apps.apple.com/app/beteseb/id123456789',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed global settings row if not exists
INSERT INTO public.reward_system_settings (id, total_budget, distributed_coins, remaining_coins, is_active)
VALUES ('global', 10000, 0, 10000, true)
ON CONFLICT (id) DO NOTHING;

-- 2. User Reward Tiers Log Table
CREATE TABLE IF NOT EXISTS public.user_reward_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'vip')),
  coins_awarded NUMERIC NOT NULL DEFAULT 0,
  popup_seen BOOLEAN DEFAULT FALSE NOT NULL,
  popup_seen_at TIMESTAMP WITH TIME ZONE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tier)
);

-- 3. Row Level Security Policies
ALTER TABLE public.reward_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reward_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select reward settings" ON public.reward_system_settings;
CREATE POLICY "Public select reward settings" ON public.reward_system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin update reward settings" ON public.reward_system_settings;
CREATE POLICY "Admin update reward settings" ON public.reward_system_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Users can read own reward tiers" ON public.user_reward_tiers;
CREATE POLICY "Users can read own reward tiers" ON public.user_reward_tiers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on reward tiers" ON public.user_reward_tiers;
CREATE POLICY "Service role full access on reward tiers" ON public.user_reward_tiers FOR ALL USING (true);

-- 4. Grants & Indexes
GRANT SELECT ON public.reward_system_settings TO authenticated, anon;
GRANT ALL PRIVILEGES ON public.reward_system_settings TO service_role;
GRANT ALL PRIVILEGES ON public.user_reward_tiers TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_user_reward_tiers_user_id ON public.user_reward_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_tiers_tier ON public.user_reward_tiers(tier);
CREATE INDEX IF NOT EXISTS idx_user_reward_tiers_popup_seen ON public.user_reward_tiers(popup_seen);

-- 5. Automated Evaluation Function (PL/pgSQL)
CREATE OR REPLACE FUNCTION public.evaluate_and_award_user_rewards(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_settings public.reward_system_settings%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_has_downloaded_app BOOLEAN := FALSE;
  v_tier_rewards JSONB := '[
    {"tier": "bronze", "coins": 5},
    {"tier": "silver", "coins": 10},
    {"tier": "gold", "coins": 15},
    {"tier": "platinum", "coins": 20},
    {"tier": "diamond", "coins": 30},
    {"tier": "vip", "coins": 70}
  ]'::jsonb;
  v_elem JSONB;
  v_tier TEXT;
  v_coins NUMERIC;
  v_is_eligible BOOLEAN;
  v_already_awarded BOOLEAN;
  v_awarded_count INT := 0;
  v_total_new_coins NUMERIC := 0;
  v_unseen_popups JSONB := '[]'::jsonb;
BEGIN
  -- Fetch current reward settings
  SELECT * INTO v_settings FROM public.reward_system_settings WHERE id = 'global' FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.reward_system_settings (id, total_budget, distributed_coins, remaining_coins, is_active)
    VALUES ('global', 10000, 0, 10000, true)
    RETURNING * INTO v_settings;
  END IF;

  -- If system is inactive or budget is 0, return current status
  IF NOT v_settings.is_active OR v_settings.remaining_coins <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'awarded_count', 0,
      'total_new_coins', 0,
      'remaining_budget', v_settings.remaining_coins,
      'auto_stopped', true
    );
  END IF;

  -- Fetch user profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check if user has downloaded app (recorded platinum)
  SELECT EXISTS (
    SELECT 1 FROM public.user_reward_tiers
    WHERE user_id = p_user_id AND tier = 'platinum'
  ) INTO v_has_downloaded_app;

  -- Iterate through defined tiers in order
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_tier_rewards) LOOP
    v_tier := v_elem->>'tier';
    v_coins := (v_elem->>'coins')::numeric;
    v_is_eligible := false;

    -- Evaluate eligibility per tier
    CASE v_tier
      WHEN 'bronze' THEN
        -- Bronze: New User Signup (Always true if profile exists)
        v_is_eligible := true;

      WHEN 'silver' THEN
        -- Silver: Onboarding completed
        v_is_eligible := COALESCE(v_profile.onboarding_completed, false);

      WHEN 'gold' THEN
        -- Gold: ID verification approved
        v_is_eligible := (COALESCE(v_profile.verification_status, 'unverified') = 'verified' OR COALESCE(v_profile.is_verified, false) = true);

      WHEN 'platinum' THEN
        -- Platinum: App downloaded (Either already claimed platinum or explicitly flagged)
        v_is_eligible := v_has_downloaded_app;

      WHEN 'diamond' THEN
        -- Diamond: Purchased Diamond tier subscription
        v_is_eligible := (
          COALESCE(v_profile.is_lifetime, false) OR
          (v_profile.premium_until IS NOT NULL AND v_profile.premium_until > NOW()) OR
          v_profile.role IN ('admin', 'super_admin', 'expert')
        );

      WHEN 'vip' THEN
        -- VIP: Purchased VIP tier subscription
        v_is_eligible := (
          COALESCE(v_profile.is_vip_member, false) AND
          (v_profile.vip_expires_at IS NULL OR v_profile.vip_expires_at > NOW() OR COALESCE(v_profile.is_lifetime, false))
        );
      ELSE
        v_is_eligible := false;
    END CASE;

    IF v_is_eligible THEN
      -- Check if already awarded
      SELECT EXISTS (
        SELECT 1 FROM public.user_reward_tiers
        WHERE user_id = p_user_id AND tier = v_tier
      ) INTO v_already_awarded;

      IF NOT v_already_awarded THEN
        -- Check remaining budget
        IF v_settings.remaining_coins >= v_coins THEN
          -- Record tier reward
          INSERT INTO public.user_reward_tiers (user_id, tier, coins_awarded, popup_seen)
          VALUES (p_user_id, v_tier, v_coins, false);

          -- Record transaction (triggers coin balance increment on user_wallets)
          INSERT INTO public.coin_transactions (user_id, amount, type, note)
          VALUES (p_user_id, v_coins, 'coin_transfer', 'Welcome & Tier Reward: ' || UPPER(v_tier));

          -- Deduct budget
          v_settings.distributed_coins := v_settings.distributed_coins + v_coins;
          v_settings.remaining_coins := GREATEST(v_settings.remaining_coins - v_coins, 0);

          UPDATE public.reward_system_settings
          SET distributed_coins = v_settings.distributed_coins,
              remaining_coins = v_settings.remaining_coins,
              updated_at = NOW()
          WHERE id = 'global';

          v_awarded_count := v_awarded_count + 1;
          v_total_new_coins := v_total_new_coins + v_coins;
        ELSE
          -- Budget exhausted, stop processing
          EXIT;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Collect unseen popups for user
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'tier', tier,
    'coins_awarded', coins_awarded,
    'awarded_at', awarded_at
  )), '[]'::jsonb)
  INTO v_unseen_popups
  FROM public.user_reward_tiers
  WHERE user_id = p_user_id AND popup_seen = false;

  RETURN jsonb_build_object(
    'success', true,
    'awarded_count', v_awarded_count,
    'total_new_coins', v_total_new_coins,
    'remaining_budget', v_settings.remaining_coins,
    'unseen_popups', v_unseen_popups
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_and_award_user_rewards(UUID) TO authenticated, service_role;
