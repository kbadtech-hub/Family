-- =========================================================================
-- BETESEB PLATFORM — MODULE 16: REFERRAL & WITHDRAWAL SYSTEM
-- =========================================================================

-- 1. Profiles Referral Updates
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Function to generate unique referral code format: BET-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'BET-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Populate existing profiles missing a referral code
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles
    SET referral_code = public.generate_unique_referral_code()
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Trigger to auto-generate referral code on new profile insert
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_unique_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_referral_code ON public.profiles;
CREATE TRIGGER on_profile_created_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_referral_code();


-- 2. Referrals Tracking Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  referral_code      TEXT NOT NULL,
  gold_reward_given  BOOLEAN DEFAULT FALSE NOT NULL,
  gold_reward_at     TIMESTAMP WITH TIME ZONE,
  sub_reward_given   BOOLEAN DEFAULT FALSE NOT NULL,
  sub_reward_at      TIMESTAMP WITH TIME ZONE,
  app_reward_given   BOOLEAN DEFAULT FALSE NOT NULL,
  app_reward_at      TIMESTAMP WITH TIME ZONE,
  total_coins_earned NUMERIC DEFAULT 0 NOT NULL,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coins_amount     NUMERIC NOT NULL CHECK (coins_amount >= 10000),
  exchange_rate    NUMERIC NOT NULL DEFAULT 0.05, -- ETB value per coin (e.g. 10000 coins = 500 ETB)
  gross_etb        NUMERIC NOT NULL,
  fee_etb          NUMERIC NOT NULL,              -- 30% system fee
  net_etb          NUMERIC NOT NULL,              -- 70% net payout
  bank_name        TEXT NOT NULL,
  account_number   TEXT NOT NULL,
  account_name     TEXT NOT NULL,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  proof_url        TEXT,
  processed_at     TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Referral Disputes / Claims Table
CREATE TABLE IF NOT EXISTS public.referral_disputes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referee_email TEXT NOT NULL,
  claim_reason  TEXT NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  admin_notes   TEXT,
  resolved_at   TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 5. Row Level Security Policies
ALTER TABLE public.referrals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_disputes   ENABLE ROW LEVEL SECURITY;

-- Referrals RLS
DROP POLICY IF EXISTS "Users view own referral activities" ON public.referrals;
CREATE POLICY "Users view own referral activities" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Withdrawals RLS
DROP POLICY IF EXISTS "Users view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users create own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Disputes RLS
DROP POLICY IF EXISTS "Users view own referral disputes" ON public.referral_disputes;
CREATE POLICY "Users view own referral disputes" ON public.referral_disputes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own referral disputes" ON public.referral_disputes;
CREATE POLICY "Users create own referral disputes" ON public.referral_disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.referral_disputes TO authenticated, service_role;
GRANT ALL PRIVILEGES ON public.referrals TO service_role;
GRANT ALL PRIVILEGES ON public.withdrawal_requests TO service_role;
GRANT ALL PRIVILEGES ON public.referral_disputes TO service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id  ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id   ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id    ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status     ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_disputes_user_id       ON public.referral_disputes(user_id);
