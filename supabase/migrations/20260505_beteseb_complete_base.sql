-- =========================================================================
-- BETESEB COMPLETE BASE DATABASE SCHEMA (Consolidated Migration)
-- VERSION: 5.0 (Rebuild & Recovery)
-- AUTHOR: Antigravity AI & Nolawi
-- DATE: 2026-07-03
-- DESCRIPTION: This file merges all 6 base migrations in the correct order:
--   1. Master Rebuild (20260503_beteseb_unified_schema.sql)
--   2. Profile Upgrades (20260503_beteseb_profile_upgrade.sql)
--   3. Community Social Enhancements (20260503_community_social_enhancements.sql)
--   4. Friendship System (20260503_friendship_system.sql)
--   5. Premium Addons & Guardians/Gifts (20260504_beteseb_premium_addons.sql)
-- =========================================================================

-- =========================================================================
-- PART 1: MASTER SCHEMA REBUILD
-- =========================================================================

-- FULL WIPE (Clean Slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (The Master Entity)
CREATE TABLE public.profiles (
  -- Core Identity
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT, -- Primary Profile Picture
  bio TEXT,
  
  -- Step 1: Demographics
  birth_date DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  location JSONB DEFAULT '{"country": "", "city": ""}',
  religion TEXT,
  marital_status TEXT,
  has_children TEXT DEFAULT 'No',
  future_children TEXT,
  star_sign TEXT,
  education TEXT,
  
  -- Step 2: Career & Psychology
  job_title TEXT,
  finance_habit TEXT,
  family_values TEXT,
  conflict_resolution TEXT,
  hobbies TEXT[] DEFAULT '{}',
  lifestyle TEXT,
  expectations TEXT,
  
  -- Step 3: Marriage Criteria & Prefs
  spouse_requirements TEXT[] DEFAULT '{}',
  partner_location TEXT[] DEFAULT '{}',
  partner_age_min INTEGER DEFAULT 18,
  partner_age_max INTEGER DEFAULT 100,
  partner_religion TEXT,
  partner_intent TEXT,
  partner_children_pref TEXT,

  -- Step 7: Photo Gallery
  gallery_urls TEXT[] DEFAULT '{}', -- Lifestyle photos (up to 5)

  -- System Meta
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'expert')),
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE, -- AI Verification status
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  premium_until TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  last_online TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VERIFICATIONS (Identity Audit)
CREATE TABLE public.verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  id_data JSONB DEFAULT '{}',
  match_score NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMUNITY POSTS
CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENTS & SUBSCRIPTIONS
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  receipt_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SECURITY (RLS & GRANTS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles, public.community_posts TO anon;

CREATE POLICY "Users Own Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Message Access" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Message Insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Own Verification Access" ON public.verifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own Payment Access" ON public.payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Community Access" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Community Insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- AUTOMATION (Functions & Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- PART 2: PROFILE UPGRADES
-- =========================================================================

-- ADD NEW COLUMNS
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS interests TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- UPDATE SECURITY POLICY (Explicitly allow update on new columns)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- INDEX FOR FAST USERNAME LOOKUP
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);


-- =========================================================================
-- PART 3: COMMUNITY SOCIAL ENHANCEMENTS
-- =========================================================================

-- UPDATE community_posts TABLE
ALTER TABLE public.community_posts 
  ADD COLUMN IF NOT EXISTS topic TEXT CHECK (topic IN ('Marriage', 'Parenting', 'Family Finance', 'General')),
  ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS heart_count INTEGER DEFAULT 0;

-- CREATE post_comments TABLE
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREATE post_reactions TABLE
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('heart', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

-- SECURITY (RLS)
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- GRANTS
GRANT ALL ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_reactions TO authenticated;
GRANT SELECT ON public.post_reactions TO anon;


-- =========================================================================
-- PART 4: FRIENDSHIP SYSTEM
-- =========================================================================

-- CREATE FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- SECURITY (RLS)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" 
  ON public.friendships FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
  ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests" 
  ON public.friendships FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- GRANTS
GRANT ALL ON public.friendships TO authenticated;

-- FUNCTION TO AUTO-REFRESH UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =========================================================================
-- PART 5: PREMIUM ADDONS & GUARDIANS/GIFTS
-- =========================================================================

-- ADD VIDEO SELFIE COLUMN TO PROFILES
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS video_selfie_url TEXT;

-- CREATE GUARDIANS TABLE (Mize/Mediator System)
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_email TEXT,
  guardian_phone TEXT,
  access_code TEXT DEFAULT substr(md5(random()::text), 1, 6), -- 6-character code for guardian login
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREATE GIFTS TABLE (Cultural Micro-Gifts System)
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_type TEXT CHECK (gift_type IN ('sini_coffee', 'habesha_flower', 'shamma_candle', 'jebena_pot')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SECURITY (RLS)
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own guardians" 
  ON public.guardians FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view gifts they sent or received" 
  ON public.gifts FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send gifts" 
  ON public.gifts FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- GRANTS
GRANT ALL ON public.guardians TO authenticated;
GRANT ALL ON public.gifts TO authenticated;
