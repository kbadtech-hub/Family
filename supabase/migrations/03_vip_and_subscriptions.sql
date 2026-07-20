-- =========================================================================
-- BETESEB PLATFORM — MODULE 03: VIP & SUBSCRIPTIONS
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.daily_limits (
  user_id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages_sent          INT DEFAULT 0 NOT NULL,
  calls_duration_seconds INT DEFAULT 0 NOT NULL,
  ad_extensions          INT DEFAULT 0 NOT NULL,
  last_reset             TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profile_unlocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, target_id)
);

CREATE TABLE IF NOT EXISTS public.vip_photo_reveals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(vip_id, viewer_id)
);

-- 2. Functions & Triggers
CREATE OR REPLACE FUNCTION public.create_limits_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.daily_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_limits ON public.profiles;
CREATE TRIGGER on_profile_created_limits
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_limits_for_new_user();

CREATE OR REPLACE FUNCTION public.unlock_profile_with_coins(target_user_id UUID, cost_coins INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  caller_id    UUID;
  caller_coins INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN RAISE EXCEPTION 'Target user does not exist'; END IF;
  IF caller_id = target_user_id THEN RETURN TRUE; END IF;
  IF EXISTS (SELECT 1 FROM public.profile_unlocks WHERE user_id = caller_id AND target_id = target_user_id) THEN RETURN TRUE; END IF;
  SELECT coin_balance INTO caller_coins FROM public.user_wallets WHERE id = caller_id;
  IF caller_coins IS NULL OR caller_coins < cost_coins THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
  INSERT INTO public.coin_transactions (user_id, amount, type, note) VALUES (caller_id, -cost_coins, 'admin_adjustment', 'Profile Unlock Cost') ON CONFLICT DO NOTHING;
  INSERT INTO public.profile_unlocks (user_id, target_id) VALUES (caller_id, target_user_id);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Row Level Security
ALTER TABLE public.daily_limits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_unlocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_photo_reveals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own daily limits" ON public.daily_limits;
CREATE POLICY "Users can select own daily limits" ON public.daily_limits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily limits" ON public.daily_limits;
CREATE POLICY "Users can update own daily limits" ON public.daily_limits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily limits" ON public.daily_limits;
CREATE POLICY "Users can insert own daily limits" ON public.daily_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own unlocks" ON public.profile_unlocks;
CREATE POLICY "Users can view own unlocks" ON public.profile_unlocks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own unlocks" ON public.profile_unlocks;
CREATE POLICY "Users can insert own unlocks" ON public.profile_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own photo reveals" ON public.vip_photo_reveals;
CREATE POLICY "Users can insert own photo reveals" ON public.vip_photo_reveals FOR INSERT WITH CHECK (auth.uid() = vip_id OR auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can view relevant photo reveals" ON public.vip_photo_reveals;
CREATE POLICY "Users can view relevant photo reveals" ON public.vip_photo_reveals FOR SELECT USING (auth.uid() = vip_id OR auth.uid() = viewer_id);

-- 4. Grants & Indexes
GRANT ALL ON public.daily_limits TO authenticated, service_role;
GRANT SELECT, INSERT ON public.profile_unlocks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_photo_reveals TO authenticated;
GRANT ALL PRIVILEGES ON public.vip_photo_reveals TO service_role;
GRANT EXECUTE ON FUNCTION public.unlock_profile_with_coins(UUID, INTEGER) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_daily_limits_user_id     ON public.daily_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_unlocks_user_id  ON public.profile_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_photo_reveals_lookup ON public.vip_photo_reveals(vip_id, viewer_id);
