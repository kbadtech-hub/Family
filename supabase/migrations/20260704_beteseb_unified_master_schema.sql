-- =========================================================================
-- BETESEB UNIFIED MASTER DATABASE SCHEMA
-- VERSION: 2.1 (Production Consolidation)
-- DATE: 2026-07-04
-- AUTHOR: Antigravity AI & Nolawi Digital Hub
-- DESCRIPTION: This file contains the complete consolidated database schema
--              for the Beteseb platform, combining all structural updates,
--              monetization features, security layers, gift systems, and 
--              family participation controls in the correct logical execution order.
-- =========================================================================

-- =========================================================================
-- PART 1: MASTER SCHEMA WIPE & INITIALIZATION
-- =========================================================================

-- FULL WIPE (Clean Slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- PART 2: CORE TABLES & IDENTITY
-- =========================================================================

-- PROFILES (The Master Entity)
CREATE TABLE public.profiles (
  -- Core Identity
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT, -- Primary Profile Picture
  bio TEXT,
  username TEXT UNIQUE,
  interests TEXT,
  preferred_language TEXT DEFAULT 'en',
  video_selfie_url TEXT,
  enable_abushakir BOOLEAN DEFAULT TRUE,
  
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  topic TEXT CHECK (topic IN ('Marriage', 'Parenting', 'Family Finance', 'General')),
  dislike_count INTEGER DEFAULT 0,
  heart_count INTEGER DEFAULT 0
);

-- COMMUNITY POST COMMENTS
CREATE TABLE public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMUNITY POST REACTIONS
CREATE TABLE public.post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- CHAT MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PREMIUM PAYMENTS (Bank Transfer Review)
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  receipt_url TEXT, -- manual bank transfer screenshot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FRIENDSHIPS / MATCH CONNECTIONS
CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- GUARDIANS (Family / Mize System)
CREATE TABLE public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_email TEXT,
  guardian_phone TEXT,
  access_code TEXT DEFAULT substr(md5(random()::text), 1, 6), -- 6-character code for guardian login
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DYNAMIC GIFT CATALOG
CREATE TABLE public.gift_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_am TEXT NOT NULL,
  name_om TEXT NOT NULL,
  name_ti TEXT NOT NULL,
  name_so TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  image_url TEXT NOT NULL,
  coin_price NUMERIC NOT NULL CHECK (coin_price > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VIRTUAL & PHYSICAL GIFTS LEDGER
CREATE TABLE public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_gift_id UUID REFERENCES public.gift_catalog(id) ON DELETE SET NULL,
  gift_type TEXT CHECK (gift_type IN ('sini_coffee', 'habesha_flower', 'shamma_candle', 'jebena_pot')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  message TEXT,
  delivery_address TEXT,
  delivery_phone TEXT,
  delivery_status TEXT DEFAULT 'none' CHECK (delivery_status IN ('none', 'requested', 'processing', 'delivered', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GUARDIAN MATCH ENDORSEMENTS
CREATE TABLE public.guardian_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'endorsed', 'disapproved')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REPORTS (UGC Safety Compliance)
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('abuse', 'explicit content', 'scam', 'other')),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BLOCKS (UGC Security Compliance)
CREATE TABLE public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- =========================================================================
-- PART 3: COIN WALLET & MONETIZATION
-- =========================================================================

CREATE TABLE public.user_wallets (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  coin_balance NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL, -- positive for top-up, negative for spend
  type TEXT NOT NULL CHECK (type IN ('purchase', 'gift_send', 'gift_receive', 'admin_adjustment')),
  reference_id UUID, -- links to payments or gifts table if applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- PART 4: SECURITY DEFINERS, PROCEDURES & TRIGGERS
-- =========================================================================

-- 1. SECURE ACCOUNT SELF-DELETION
CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. COIN LEDGER RECONCILIATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_coin_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, NOW())
  ON CONFLICT (id) DO UPDATE
  SET coin_balance = public.user_wallets.coin_balance + NEW.amount,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_coin_transaction_inserted
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_coin_transaction();

-- 3. NEW USER WALLET INITIALIZATION
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

-- 4. PROFILES METADATA AUTO-CREATION (FROM AUTH.USERS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. FRIENDSHIPS TIMESTAMP UPDATER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- PART 5: SECURITY POLICIES (ROW LEVEL SECURITY)
-- =========================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Own Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Verifications Policies
CREATE POLICY "Own Verification Access" ON public.verifications FOR ALL USING (auth.uid() = user_id);

-- 3. Messages Policies
CREATE POLICY "Message Access" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Message Insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 4. Payments Policies
CREATE POLICY "Own Payment Access" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- 5. Community Posts Policies
CREATE POLICY "Community Access" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Community Insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 6. Comments & Reactions Policies
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- 7. Friendships Policies
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received requests" ON public.friendships FOR UPDATE USING (auth.uid() = receiver_id);

-- 8. Guardians Policies
CREATE POLICY "Users can manage their own guardians" ON public.guardians FOR ALL USING (auth.uid() = user_id);

-- 9. Gift Catalog Policies
CREATE POLICY "Public Read Access for Gift Catalog" ON public.gift_catalog FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin CRUD Access for Gift Catalog" ON public.gift_catalog FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 10. Gifts Ledger Policies
CREATE POLICY "Users can view gifts they sent or received" ON public.gifts FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send gifts" ON public.gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received physical delivery requests" ON public.gifts FOR UPDATE USING (auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 11. Guardian Endorsements Policies
CREATE POLICY "Public Read Access for Endorsements" ON public.guardian_endorsements FOR SELECT USING (true);
CREATE POLICY "Guardian Manage Own Endorsements" ON public.guardian_endorsements FOR ALL USING (true) WITH CHECK (true);

-- 12. Safety Reports Policies
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own submitted reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- 13. Blocks Subsystem Policies
CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "Users can block other users" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock other users" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- 14. Wallets Policies (Read-Only for Users)
CREATE POLICY "Users can view own wallet balance" ON public.user_wallets FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- PART 6: SECURITY ROLE GRANTS
-- =========================================================================

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_user_account() TO authenticated;
GRANT ALL ON public.guardians TO authenticated;
GRANT ALL ON public.guardian_endorsements TO authenticated;
GRANT ALL ON public.guardian_endorsements TO anon;
GRANT SELECT ON public.gift_catalog TO authenticated;
GRANT SELECT ON public.user_wallets TO authenticated;
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;

-- =========================================================================
-- PART 7: DATA SEEDING
-- =========================================================================

-- SEED DATA FOR CULTURAL GIFT CATALOG
INSERT INTO public.gift_catalog (id, name_en, name_am, name_om, name_ti, name_so, name_ar, image_url, coin_price) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Habesha Coffee Sini', 'የሀበሻ ሲኒ', 'Sini Buna Habeshaa', 'ፅዋ ቡን ሓበሻ', 'Koobka Bunka Xabashida', 'فنجان قهوة حبشية', 'sini_coffee', 20),
  ('22222222-2222-2222-2222-222222222222', 'Habesha Flower', 'የማር አበባ', 'Abaaroo Habeshaa', 'ዕምባባ ሓበሻ', 'Ubaxa Xabashida', 'وردة حبشية', 'habesha_flower', 50),
  ('33333333-3333-3333-3333-333333333333', 'Shamma Candle', 'የፍቅር ሻማ', 'Shamaa Habeshaa', 'ሽምዓ ሓበሻ', 'Shamaa Xabashida', 'شمعة حبشية', 'shamma_candle', 15),
  ('44444444-4444-4444-4444-444444444444', 'Jebena Pot', 'የሀበሻ ጀበና', 'Jabanaa Habeshaa', 'ጀበና ሓበሻ', 'Kettle Xabashida', 'جبنة حبشية', 'jebena_pot', 100)
ON CONFLICT (id) DO NOTHING;

-- Backfill user wallets
INSERT INTO public.user_wallets (id, coin_balance)
SELECT id, 0 FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- PART 8: SYSTEM PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_friendships_sender_receiver ON public.friendships(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_reported ON public.reports(reporter_id, reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON public.blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
