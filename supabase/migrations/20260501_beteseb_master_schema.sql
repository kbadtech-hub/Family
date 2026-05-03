-- ==========================================
-- BETESEB ULTIMATE MASTER SCHEMA (2026-05-01)
-- ==========================================
-- This is a unified, scalable schema for the Beteseb platform.

-- 1. CLEAN SLATE: DROP EVERYTHING IN PUBLIC SCHEMA
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;

-- 2. CORE PROFILES TABLE (7-Step Onboarding Architecture)
CREATE TABLE public.profiles (
  -- Core Identity
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT, -- Profile Picture
  
  -- Step 1: Demographics
  birth_date DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  location JSONB DEFAULT '{"country": "", "city": ""}',
  religion TEXT,
  marital_status TEXT,
  has_children TEXT DEFAULT 'No', -- Yes / No
  
  -- Step 2: Career & Psychology
  job_title TEXT,
  finance_habit TEXT,
  family_values TEXT,
  conflict_resolution TEXT,
  
  -- Step 3: Marriage Criteria
  spouse_requirements TEXT[] DEFAULT '{}', -- Tags: e.g., 'Religious Compatibility'
  
  -- Step 4: Partner Preference
  partner_location TEXT[] DEFAULT '{}', -- Multi-select countries/cities
  partner_age_min INTEGER DEFAULT 18,
  partner_age_max INTEGER DEFAULT 100,
  partner_religion TEXT,
  partner_intent TEXT, -- e.g., 'Marriage', 'Serious Relationship'
  
  -- Step 5 & 6: Identity Verification
  id_url TEXT, -- ID Document URL
  selfie_url TEXT, -- Live Selfie URL
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  
  -- Step 7: Photo Gallery
  gallery_urls TEXT[] DEFAULT '{}', -- Lifestyle photos (up to 5)
  
  -- System Meta
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'expert')),
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  premium_until TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  last_online TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COMMUNITY HUB
CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'none' CHECK (media_type IN ('image', 'video', 'none')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.community_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.community_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACADEMY PAGE (Educational Content)
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT, -- YouTube / Vimeo
  category TEXT DEFAULT 'Marriage',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CHAT & MESSAGING
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. VERIFICATION & PAYMENTS
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  receipt_url TEXT, -- Proof of Payment screenshot
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  plan_type TEXT DEFAULT 'monthly', -- monthly, yearly, lifetime
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 7. CUSTOMER SUPPORT (Ticketing System)
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. IDENTITY VERIFICATION
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

-- ==========================================
-- PERFORMANCE & INTEGRITY
-- ==========================================

-- Indexing for fast matching and lookups
CREATE INDEX idx_profiles_location ON public.profiles USING GIN (location);
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_community_author ON public.community_posts(author_id);
CREATE INDEX idx_messages_chat ON public.messages(sender_id, receiver_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public Profiles Access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Own Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users Own Verification Access" ON public.verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users Own Verification Insert" ON public.verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Community Posts Access" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Community Posts Insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Messaging Access" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Messaging Insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Academy Access" ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Payments Own Access" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Payments Insert" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Support Own Access" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Support Insert" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUTH TRIGGER: Syncing Auth to Public Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_interval INTERVAL;
BEGIN
  IF (NEW.status = 'approved' AND (OLD.status = 'pending' OR OLD.status = 'rejected')) THEN
    -- Determine interval based on plan_type
    CASE NEW.plan_type
      WHEN 'monthly' THEN v_interval := INTERVAL '1 month';
      WHEN 'quarterly' THEN v_interval := INTERVAL '3 months';
      WHEN 'semi-annually' THEN v_interval := INTERVAL '6 months';
      WHEN 'yearly' THEN v_interval := INTERVAL '1 year';
      WHEN 'lifetime' THEN v_interval := INTERVAL '100 years';
      ELSE v_interval := INTERVAL '1 month';
    END CASE;

    -- Update profile
    UPDATE public.profiles
    SET premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + v_interval,
        is_locked = FALSE
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_approved
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_payment_approval();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DATA
INSERT INTO public.lessons (title, description, video_url, category)
VALUES 
('Introduction to Beteseb', 'Learn the basics of our marriage-focused platform.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Getting Started'),
('Ethical Dating', 'Understanding boundaries and values in the Habesha community.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ethics');
