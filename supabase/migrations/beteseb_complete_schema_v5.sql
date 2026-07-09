-- =========================================================================
-- BETESEB PLATFORM — COMPLETE UNIFIED MASTER DATABASE SCHEMA
-- VERSION: 5.0 (Final Production Build — All Phases Consolidated)
-- DATE: 2026-07-06
-- DESCRIPTION: Single-file schema for the entire Beteseb platform.
--              Paste into Supabase SQL Editor and click Run.
-- WARNING: Drops and recreates the public schema. Backup first if needed.
-- =========================================================================


-- =========================================================================
-- PART 1: CLEAN SLATE INITIALIZATION
-- =========================================================================
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =========================================================================
-- PART 2: CORE IDENTITY TABLES
-- =========================================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  username TEXT UNIQUE,
  interests TEXT,
  preferred_language TEXT DEFAULT 'en',
  video_selfie_url TEXT,
  enable_abushakir BOOLEAN DEFAULT TRUE,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  location JSONB DEFAULT '{"country": "", "city": ""}',
  religion TEXT,
  marital_status TEXT,
  has_children TEXT DEFAULT 'No',
  future_children TEXT,
  star_sign TEXT,
  education TEXT,
  job_title TEXT,
  finance_habit TEXT,
  family_values TEXT,
  conflict_resolution TEXT,
  hobbies TEXT[] DEFAULT '{}',
  lifestyle TEXT,
  expectations TEXT,
  spouse_requirements TEXT[] DEFAULT '{}',
  partner_location TEXT[] DEFAULT '{}',
  partner_age_min INTEGER DEFAULT 18,
  partner_age_max INTEGER DEFAULT 100,
  partner_religion TEXT,
  partner_intent TEXT,
  partner_children_pref TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'expert')),
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  premium_until TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  last_online TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registration_location JSONB,
  last_login_location JSONB,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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


-- =========================================================================
-- PART 3: COMMUNITY AND SOCIAL TABLES
-- =========================================================================

CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  topic TEXT CHECK (topic IN ('Marriage', 'Parenting', 'Family Finance', 'General')),
  dislike_count INTEGER DEFAULT 0,
  heart_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('abuse', 'explicit content', 'scam', 'other')),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);


-- =========================================================================
-- PART 4: COIN ECONOMY AND MONETIZATION
-- =========================================================================

CREATE TABLE public.user_wallets (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  coin_balance NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'gift_send', 'gift_receive', 'coin_transfer', 'admin_adjustment')),
  reference_id UUID,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =========================================================================
-- PART 5: GIFT SYSTEM
-- =========================================================================

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
  category TEXT DEFAULT 'cultural' CHECK (category IN ('cultural', 'pets', 'flowers', 'coupons')),
  unlock_level INTEGER DEFAULT 1,
  commission_rate NUMERIC(4,2) DEFAULT 0.15,
  base_delivery_fee NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_gift_id UUID REFERENCES public.gift_catalog(id) ON DELETE SET NULL,
  gift_type TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  message TEXT,
  delivery_address TEXT,
  delivery_phone TEXT,
  delivery_status TEXT DEFAULT 'none' CHECK (delivery_status IN ('none', 'requested', 'processing', 'delivered', 'failed')),
  delivery_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =========================================================================
-- PART 6: GUARDIAN (WALI) SYSTEM
-- =========================================================================

CREATE TABLE public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_email TEXT,
  guardian_phone TEXT,
  access_code TEXT DEFAULT substr(md5(random()::text), 1, 6),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.guardian_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'endorsed', 'disapproved')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.wali_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  candidate2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  guardian1_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  guardian2_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate1_id, candidate2_id)
);

CREATE TABLE public.wali_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.wali_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =========================================================================
-- PART 7: VOUCHING SYSTEM
-- =========================================================================

CREATE TABLE public.vouch_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  voucher_name TEXT NOT NULL,
  voucher_email TEXT NOT NULL,
  voucher_phone TEXT,
  relationship TEXT NOT NULL CHECK (relationship IN ('friend', 'clergy', 'family_elder', 'colleague')),
  know_duration_years INTEGER NOT NULL,
  vouch_status TEXT DEFAULT 'pending' CHECK (vouch_status IN ('pending', 'approved', 'rejected')),
  witness_statement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =========================================================================
-- PART 8: COUNSELING SYSTEM
-- =========================================================================

CREATE TABLE public.counselor_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expert_name TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (topic IN ('Pre-Marriage', 'Finance', 'Conflict Resolution', 'General')),
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('coins', 'chapa', 'stripe')),
  amount_paid NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =========================================================================
-- PART 9: SUPPORT AND AI CHATBOT SYSTEM
-- =========================================================================

CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT DEFAULT 'Support Request',
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  ticket_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.support_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.resolved_kb (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  solution TEXT NOT NULL,
  locale VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- PART 10: NOTIFICATION AND TELEMETRY
-- =========================================================================

CREATE TABLE public.sms_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.interaction_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  friendship_id UUID REFERENCES public.friendships(id) ON DELETE CASCADE UNIQUE,
  reply_latency_seconds INT DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  conflict_score INT DEFAULT 0,
  phase INT DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- PART 11: FUNCTIONS AND TRIGGERS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_coin_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, NOW())
  ON CONFLICT (id) DO UPDATE
  SET coin_balance = public.user_wallets.coin_balance + NEW.amount,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_coin_transaction_inserted
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_coin_transaction();

CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_friendship_telemetry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.interaction_telemetry (friendship_id, reply_latency_seconds, is_frozen, conflict_score, phase)
    VALUES (NEW.id, 0, false, 0, 1)
    ON CONFLICT (friendship_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friendship_accepted_telemetry
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_friendship_telemetry();


-- =========================================================================
-- PART 12: ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wali_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wali_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolved_kb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_telemetry ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Own Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Verifications
CREATE POLICY "Own Verification Access" ON public.verifications FOR ALL USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Message Access" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Message Insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Payments
CREATE POLICY "Own Payment Access" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- Community Posts
CREATE POLICY "Community Access" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Community Insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Comments
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

-- Reactions
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Friendships
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received requests" ON public.friendships FOR UPDATE USING (auth.uid() = receiver_id);

-- Reports
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own submitted reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- Blocks
CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "Users can block other users" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock other users" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Wallets
CREATE POLICY "Users can view own wallet balance" ON public.user_wallets FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

-- Gift Catalog
CREATE POLICY "Public Read Access for Gift Catalog" ON public.gift_catalog FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin CRUD Access for Gift Catalog" ON public.gift_catalog FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Gifts
CREATE POLICY "Users can view gifts they sent or received" ON public.gifts FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send gifts" ON public.gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received physical delivery requests" ON public.gifts FOR UPDATE USING (auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Guardians
CREATE POLICY "Users can manage their own guardians" ON public.guardians FOR ALL USING (auth.uid() = user_id);

-- Guardian Endorsements
CREATE POLICY "Public Read Access for Endorsements" ON public.guardian_endorsements FOR SELECT USING (true);
CREATE POLICY "Guardian Manage Own Endorsements" ON public.guardian_endorsements FOR ALL USING (true) WITH CHECK (true);

-- Vouch Records
CREATE POLICY "Users can manage own vouch requests" ON public.vouch_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public access for invited vouchers" ON public.vouch_records FOR ALL USING (true) WITH CHECK (true);

-- Counselor Bookings
CREATE POLICY "Users can manage own counselor bookings" ON public.counselor_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin full access for bookings" ON public.counselor_bookings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Wali Rooms
CREATE POLICY "Participants can access Wali Rooms" ON public.wali_rooms FOR ALL USING (
  auth.uid() = candidate1_id OR
  auth.uid() = candidate2_id OR
  EXISTS (SELECT 1 FROM public.guardians WHERE id = guardian1_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.guardians WHERE id = guardian2_id AND user_id = auth.uid())
);

-- Wali Messages
CREATE POLICY "Participants can manage messages in their Wali Room" ON public.wali_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.wali_rooms r
    WHERE r.id = room_id AND (
      auth.uid() = r.candidate1_id OR
      auth.uid() = r.candidate2_id OR
      EXISTS (SELECT 1 FROM public.guardians WHERE id = r.guardian1_id AND user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.guardians WHERE id = r.guardian2_id AND user_id = auth.uid())
    )
  )
);

-- SMS Queue
CREATE POLICY "Admin full access for SMS queue" ON public.sms_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Support Tickets
CREATE POLICY "Users can create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin full access to tickets" ON public.support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Support Replies
CREATE POLICY "Users can view replies to own tickets" ON public.support_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "Admin full access to replies" ON public.support_replies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Resolved KB
CREATE POLICY "Public read resolved_kb" ON public.resolved_kb FOR SELECT USING (true);
CREATE POLICY "Admin insert resolved_kb" ON public.resolved_kb FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Interaction Telemetry (strictly private)
CREATE POLICY "telemetry_isolation_policy" ON public.interaction_telemetry FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = friendship_id
      AND (f.sender_id = auth.uid() OR f.receiver_id = auth.uid())
    )
  );


-- =========================================================================
-- PART 13: ROLE GRANTS
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
GRANT ALL ON public.vouch_records TO authenticated;
GRANT ALL ON public.vouch_records TO anon;
GRANT ALL ON public.counselor_bookings TO authenticated;
GRANT ALL ON public.wali_rooms TO authenticated;
GRANT ALL ON public.wali_rooms TO anon;
GRANT ALL ON public.wali_messages TO authenticated;
GRANT ALL ON public.wali_messages TO anon;
GRANT ALL ON public.sms_queue TO authenticated;
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT SELECT ON public.support_replies TO authenticated;
GRANT SELECT ON public.resolved_kb TO anon;
GRANT SELECT ON public.resolved_kb TO authenticated;


-- =========================================================================
-- PART 14: PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_friendships_sender_receiver ON public.friendships(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_reported ON public.reports(reporter_id, reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON public.blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_vouch_records_user_id ON public.vouch_records(user_id);
CREATE INDEX IF NOT EXISTS idx_counselor_bookings_user_id ON public.counselor_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_wali_rooms_candidates ON public.wali_rooms(candidate1_id, candidate2_id);
CREATE INDEX IF NOT EXISTS idx_wali_messages_room_id ON public.wali_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_resolved_kb_locale ON public.resolved_kb(locale);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);


-- =========================================================================
-- PART 15: SEED DATA — GIFT CATALOG
-- =========================================================================

INSERT INTO public.gift_catalog (id, name_en, name_am, name_om, name_ti, name_so, name_ar, image_url, coin_price, category, unlock_level, commission_rate, base_delivery_fee) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Habesha Coffee Sini',    'የሀበሻ ሲኒ',            'Sini Buna Habeshaa',          'ፅዋ ቡን ሓበሻ',    'Koobka Bunka Xabashida',  'فنجان قهوة حبشية',        'sini_coffee',     20,  'cultural', 1, 0.15,   0.00),
  ('33333333-3333-3333-3333-333333333333', 'Shamma Candle',          'የፍቅር ሻማ',            'Shamaa Habeshaa',             'ሽምዓ ሓበሻ',      'Shamaa Xabashida',        'شمعة حبشية',              'shamma_candle',   15,  'cultural', 1, 0.15,   0.00),
  ('44444444-4444-4444-4444-444444444444', 'Jebena Pot',             'የሀበሻ ጀበና',            'Jabanaa Habeshaa',            'ጀበና ሓበሻ',      'Kettle Xabashida',        'جبنة حبشية',              'jebena_pot',      100, 'cultural', 2, 0.15,  10.00),
  ('22222222-2222-2222-2222-222222222222', 'Habesha Flower',         'የማር አበባ',             'Abaaroo Habeshaa',            'ዕምባባ ሓበሻ',    'Ubaxa Xabashida',         'وردة حبشية',              'habesha_flower',  50,  'flowers',  1, 0.15,   0.00),
  ('88888888-8888-8888-8888-888888888888', 'Premium Boxed Flowers',  'በቅንጡ ሳጥን አበባዎች',    'Abaaroo Luxury Box',          'ዕምባባታት ፅኑዕ', 'Ubax Boxed',              'أزهار فاخرة مغلفة',       'boxed_flowers',   80,  'flowers',  2, 0.15,  20.00),
  ('55555555-5555-5555-5555-555555555555', 'Romantic Love Doves',    'የፍቅር እርግቦች',         'Guutoo jaalalaa',             'ርግብታት ፍቕሪ',   'Flutter Dove',            'حمام الحب الرومانسي',     'love_doves',      150, 'pets',     4, 0.20,  30.00),
  ('66666666-6666-6666-6666-666666666666', 'Luxury Poodle Puppy',    'የቅንጦት ቡችላ',          'Saree Luxury',                'ቅንጡ ዕትብት',    'Ey puppy',                'جرو بودل فاخر',           'luxury_puppy',    500, 'pets',     4, 0.25, 150.00),
  ('77777777-7777-7777-7777-777777777777', 'Luxury Kitten Cat',      'የቅንጦት ድመት',          'Bashoo Luxury',               'ቅንጡ ድሙ',       'Bas pussy',               'قطة فاخرة',               'luxury_kitten',   400, 'pets',     4, 0.25, 100.00),
  ('99999999-9999-9999-9999-999999999999', 'Habesha Couple Outfit',  'የጥንዶች ባህል ልብስ',     'Uffata Aadaa Habeshaa',       'ባህላዊ አልባሳት',  'Kappo Outfit',            'أزهار تقليدية للزوجين',   'cultural_outfit', 300, 'cultural', 3, 0.20,  50.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Engraved Silver Bracelet','ስም ቀረጽ የብር አንባር',  'Gimbii meetii',               'አንባር ብሩር',    'bracelet',                'سوار فضي محفور',          'silver_bracelet', 150, 'cultural', 3, 0.15,  15.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Dinner & Cinema','የእራት እና ሲኒማ ኩፖን', 'Kupoonii irbaataa fi sinimaa','ኩፖን ድራርን ሲነማን','Premium Date Voucher',   'قسيمة عشاء وسينما مميزة', 'date_voucher',    100, 'coupons',  2, 0.15,   0.00)
ON CONFLICT (id) DO NOTHING;

-- Backfill wallets for any existing profiles
INSERT INTO public.user_wallets (id, coin_balance)
SELECT id, 0 FROM public.profiles
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- END | Beteseb Platform Database Schema v5.0 | Production Ready
-- =========================================================================
