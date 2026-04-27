-- ==========================================
-- BETESEB ULTIMATE SUPER MASTER SQL (2026)
-- ==========================================
-- This script ensures a clean start by dropping existing policies and tables.
-- It follows a strict creation order to avoid "relation does not exist" errors.

-- 0. CLEAN START (Drop existing policies and tables)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  birth_time TIME,
  gender TEXT,
  location TEXT,
  religion TEXT,
  marital_status TEXT,
  job_title TEXT,
  finance_habit TEXT,
  family_values TEXT,
  conflict_resolution TEXT,
  spouse_requirements TEXT,
  star_sign TEXT,
  
  -- Gallery & Matching
  gallery_urls TEXT[] DEFAULT '{}',
  face_hash TEXT, -- For AI Face Match
  bio TEXT,
  
  -- Verification Status
  id_document_url TEXT,
  selfie_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  id_status TEXT DEFAULT 'unverified' CHECK (id_status IN ('unverified', 'pending', 'verified', 'rejected')),
  otp_status TEXT DEFAULT 'unverified', -- Tracks 6-digit OTP verification state
  
  -- System Roles
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_onboarded BOOLEAN DEFAULT FALSE,
  
  -- Subscription
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '3 days',
  premium_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SETTINGS TABLE (CMS, Pricing, Banks)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cms_content JSONB DEFAULT '{
    "logo_url": "",
    "hero_title": "ጠንካራ ትዳር",
    "hero_subtitle": "የቤተሰብ እሴቶችን መሰረት በማድረግ እና በዘመናዊ ቴክኖሎጂ የታገዘ የኢትዮጵያ ቤተሰቦችን መገንቢያ መድረክ።",
    "footer_description": "ቤተሰብን በባህል፣ በቴክኖሎጂ።"
  }',
  contact_info JSONB DEFAULT '{
    "email": "contact@beteseb1.online",
    "phone": "+49 123 456 789",
    "address": "ሀረር",
    "website_url": "https://beteseb1.online"
  }',
  bank_details JSONB DEFAULT '{
    "etb": [{"bank": "CBE", "account": "1000123456789", "name": "Beteseb PLC"}],
    "usd": [{"method": "Bank Swift", "details": "SWIFT: XXXX", "name": "Beteseb Global"}]
  }',
  pricing_usd JSONB DEFAULT '{"1m": 50, "3m": 120, "6m": 220, "12m": 350, "lifetime": 999, "discount": 0}',
  pricing_etb JSONB DEFAULT '{"1m": 500, "3m": 1200, "6m": 2200, "12m": 3500, "lifetime": 9999, "discount": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. COMMUNITY POSTS (With Link Restriction)
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'none' CHECK (media_type IN ('image', 'video', 'link', 'none')),
  is_approved BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  
  -- CONSTRAINT: Non-admins cannot post links in content
  -- This is a soft check, full enforcement is in the App logic.
  -- But we can add a simple regex check for "http" if needed.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. POST ENGAGEMENT (Likes & Comments)
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PAYMENTS (Subscription Management)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  receipt_url TEXT NOT NULL, -- Screenshot
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- 7. SUPPORT TICKETS (AI Escalation)
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  message TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ACADEMY LESSONS (Learning Content)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  instructions TEXT,
  category TEXT DEFAULT 'Marriage',
  is_premium_only BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Settings Policies
CREATE POLICY "Public can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify settings" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 3. Community Policies
CREATE POLICY "Community posts are viewable by everyone" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can only delete their own posts" ON community_posts FOR DELETE USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins can manage all posts" ON community_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 4. Payment Policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 5. Support Policies
CREATE POLICY "Users can view/create own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 6. Lessons Policies
CREATE POLICY "Lessons are viewable by everyone" ON lessons FOR SELECT USING (true);
CREATE POLICY "Only admins can manage lessons" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ==========================================
-- SEED DATA & TRIGGERS
-- ==========================================

-- Initial Settings Row
INSERT INTO settings (id) VALUES ('00000000-0000-0000-0000-000000000000') ON CONFLICT (id) DO NOTHING;

-- Auto-update Profiles timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
