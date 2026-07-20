-- =========================================================================
-- BETESEB PLATFORM — MODULE 08: GUARDIAN (WALI) & VOUCHING SYSTEM
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.guardians (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_email TEXT,
  guardian_phone TEXT,
  access_code    TEXT DEFAULT substr(md5(random()::text), 1, 6),
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guardian_endorsements (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id  UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'endorsed', 'disapproved')),
  note         TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wali_rooms (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  candidate2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  guardian1_id  UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  guardian2_id  UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate1_id, candidate2_id)
);

CREATE TABLE IF NOT EXISTS public.wali_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id     UUID REFERENCES public.wali_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vouch_records (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  voucher_name        TEXT NOT NULL,
  voucher_email       TEXT NOT NULL,
  voucher_phone       TEXT,
  relationship        TEXT NOT NULL CHECK (relationship IN ('friend', 'clergy', 'family_elder', 'colleague')),
  know_duration_years INTEGER NOT NULL,
  vouch_status        TEXT DEFAULT 'pending' CHECK (vouch_status IN ('pending', 'approved', 'rejected')),
  witness_statement   TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.guardians            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wali_rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wali_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouch_records         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own guardians" ON public.guardians;
CREATE POLICY "Users can manage their own guardians" ON public.guardians FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public Read Access for Endorsements" ON public.guardian_endorsements;
CREATE POLICY "Public Read Access for Endorsements" ON public.guardian_endorsements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guardian Manage Own Endorsements" ON public.guardian_endorsements;
CREATE POLICY "Guardian Manage Own Endorsements" ON public.guardian_endorsements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can access Wali Rooms" ON public.wali_rooms;
CREATE POLICY "Participants can access Wali Rooms" ON public.wali_rooms FOR ALL USING (
  auth.uid() = candidate1_id OR
  auth.uid() = candidate2_id OR
  EXISTS (SELECT 1 FROM public.guardians WHERE id = guardian1_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.guardians WHERE id = guardian2_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can manage messages in their Wali Room" ON public.wali_messages;
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

DROP POLICY IF EXISTS "Users can manage own vouch requests" ON public.vouch_records;
CREATE POLICY "Users can manage own vouch requests" ON public.vouch_records FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public access for invited vouchers" ON public.vouch_records;
CREATE POLICY "Public access for invited vouchers" ON public.vouch_records FOR ALL USING (true) WITH CHECK (true);

-- 3. Grants & Indexes
GRANT ALL ON public.guardians TO authenticated, service_role;
GRANT ALL ON public.guardian_endorsements TO authenticated, anon, service_role;
GRANT ALL ON public.wali_rooms TO authenticated, anon, service_role;
GRANT ALL ON public.wali_messages TO authenticated, anon, service_role;
GRANT ALL ON public.vouch_records TO authenticated, anon, service_role;

CREATE INDEX IF NOT EXISTS idx_guardians_user_id     ON public.guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_vouch_records_user_id ON public.vouch_records(user_id);
CREATE INDEX IF NOT EXISTS idx_wali_rooms_candidates ON public.wali_rooms(candidate1_id, candidate2_id);
CREATE INDEX IF NOT EXISTS idx_wali_messages_room_id ON public.wali_messages(room_id);
