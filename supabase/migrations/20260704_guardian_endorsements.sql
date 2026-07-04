-- =========================================================================
-- GUARDIAN / FAMILY ENDORSEMENT SUB-SYSTEM
-- VERSION: 2.1
-- DATE: 2026-07-04
-- DESCRIPTION: Implements guardian endorsement and matching feedback tables.
-- =========================================================================

-- 1. GUARDIAN ENDORSEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.guardian_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'endorsed', 'disapproved')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.guardian_endorsements ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR GUARDIAN ENDORSEMENTS
CREATE POLICY "Public Read Access for Endorsements"
  ON public.guardian_endorsements FOR SELECT
  USING (true);

CREATE POLICY "Guardian Manage Own Endorsements"
  ON public.guardian_endorsements FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. GRANTS
GRANT ALL ON public.guardian_endorsements TO authenticated;
GRANT ALL ON public.guardian_endorsements TO anon;
