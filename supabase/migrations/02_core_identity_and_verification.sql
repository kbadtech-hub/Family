-- =========================================================================
-- BETESEB PLATFORM — MODULE 02: CORE IDENTITY & VERIFICATION
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name             TEXT,
  email                 TEXT,
  phone                 TEXT,
  avatar_url            TEXT,
  bio                   TEXT,
  username              TEXT UNIQUE,
  interests             TEXT,
  preferred_language    TEXT DEFAULT 'en',
  video_selfie_url      TEXT,
  enable_abushakir      BOOLEAN DEFAULT TRUE,
  birth_date            DATE,
  gender                TEXT CHECK (gender IN ('Male', 'Female')),
  location              JSONB DEFAULT '{"country": "", "city": ""}',
  religion              TEXT,
  marital_status        TEXT,
  has_children          TEXT DEFAULT 'No',
  future_children       TEXT,
  star_sign             TEXT,
  education             TEXT,
  job_title             TEXT,
  finance_habit         TEXT,
  family_values         TEXT,
  conflict_resolution   TEXT,
  hobbies               TEXT[] DEFAULT '{}',
  lifestyle             TEXT,
  expectations          TEXT,
  spouse_requirements   TEXT[] DEFAULT '{}',
  partner_location      TEXT[] DEFAULT '{}',
  partner_age_min       INTEGER DEFAULT 18,
  partner_age_max       INTEGER DEFAULT 100,
  partner_religion      TEXT,
  partner_intent        TEXT,
  partner_children_pref TEXT,
  gallery_urls          TEXT[] DEFAULT '{}',
  role                  TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'expert')),
  onboarding_step       INTEGER DEFAULT 1,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  is_verified           BOOLEAN DEFAULT FALSE,
  verification_status   TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  trial_ends_at         TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  premium_until         TIMESTAMP WITH TIME ZONE,
  is_locked             BOOLEAN DEFAULT FALSE,
  last_online           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registration_location JSONB,
  last_login_location   JSONB,
  last_login_at         TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  warning_message       TEXT DEFAULT NULL,
  show_age              BOOLEAN DEFAULT TRUE NOT NULL,
  show_city             BOOLEAN DEFAULT TRUE NOT NULL,
  allow_friend_requests BOOLEAN DEFAULT TRUE NOT NULL,
  enable_read_receipts  BOOLEAN DEFAULT TRUE NOT NULL,
  enable_last_seen      BOOLEAN DEFAULT TRUE NOT NULL,
  is_vip_member         BOOLEAN DEFAULT FALSE,
  is_ghost_mode_active  BOOLEAN DEFAULT FALSE,
  hide_online_status    BOOLEAN DEFAULT FALSE,
  hide_read_receipts    BOOLEAN DEFAULT FALSE,
  strict_incognito      BOOLEAN DEFAULT FALSE,
  vip_expires_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.verifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_url       TEXT NOT NULL,
  selfie_url   TEXT NOT NULL,
  id_data      JSONB DEFAULT '{}',
  match_score  NUMERIC,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at  TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Functions & Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, onboarding_step)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    1
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 3. Row Level Security
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profiles Select" ON public.profiles;
CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users Own Profile Update" ON public.profiles;
CREATE POLICY "Users Own Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users Own Profile Insert" ON public.profiles;
CREATE POLICY "Users Own Profile Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Own Verification Access" ON public.verifications;
CREATE POLICY "Own Verification Access" ON public.verifications FOR ALL USING (auth.uid() = user_id);

-- 4. Grants & Indexes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifications TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_own_user_account() TO authenticated;

CREATE INDEX IF NOT EXISTS idx_profiles_username            ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role                ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified         ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until       ON public.profiles(premium_until);
CREATE INDEX IF NOT EXISTS idx_profiles_is_vip_member       ON public.profiles(is_vip_member);
