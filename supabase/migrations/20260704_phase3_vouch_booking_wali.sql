-- =========================================================================
-- PHASE-3 SYSTEM EXPANSION: VOUCHING, COUNSELING & WALI ROOMS
-- VERSION: 1.0
-- DATE: 2026-07-04
-- =========================================================================

-- 1. VOUCHING & REFERENCES SYSTEM
CREATE TABLE IF NOT EXISTS public.vouch_records (
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

-- 2. COUNSELOR BOOKINGS (EdTech & Guidance Marketplace)
CREATE TABLE IF NOT EXISTS public.counselor_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expert_name TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (topic IN ('Pre-Marriage', 'Finance', 'Conflict Resolution', 'General')),
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WALI / FAMILY GROUP CHAT ROOMS
CREATE TABLE IF NOT EXISTS public.wali_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  candidate2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  guardian1_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  guardian2_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate1_id, candidate2_id)
);

CREATE TABLE IF NOT EXISTS public.wali_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.wali_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS across new tables
ALTER TABLE public.vouch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wali_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wali_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Vouch Records Policies
CREATE POLICY "Users can manage own vouch requests"
  ON public.vouch_records FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public select and update access for invited vouchers"
  ON public.vouch_records FOR ALL
  USING (true)
  WITH CHECK (true);

-- Counselor Bookings Policies
CREATE POLICY "Users can manage own counselor bookings"
  ON public.counselor_bookings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access for bookings"
  ON public.counselor_bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Wali Rooms Policies
CREATE POLICY "Participants can access Wali Rooms"
  ON public.wali_rooms FOR ALL
  USING (
    auth.uid() = candidate1_id OR 
    auth.uid() = candidate2_id OR 
    EXISTS (SELECT 1 FROM public.guardians WHERE id = guardian1_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.guardians WHERE id = guardian2_id AND user_id = auth.uid())
  );

-- Wali Messages Policies
CREATE POLICY "Participants can manage messages in their Wali Room"
  ON public.wali_messages FOR ALL
  USING (
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

-- 5. GRANTS
GRANT ALL ON public.vouch_records TO authenticated;
GRANT ALL ON public.counselor_bookings TO authenticated;
GRANT ALL ON public.wali_rooms TO authenticated;
GRANT ALL ON public.wali_messages TO authenticated;
GRANT ALL ON public.vouch_records TO anon;
GRANT ALL ON public.wali_rooms TO anon;
GRANT ALL ON public.wali_messages TO anon;
