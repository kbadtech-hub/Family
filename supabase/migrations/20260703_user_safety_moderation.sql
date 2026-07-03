-- =========================================================================
-- USER SAFETY & MODERATION SCHEMA ADDITIONS
-- VERSION: 1.0
-- DATE: 2026-07-03
-- DESCRIPTION: Creates tables for user-generated reports and blocks, 
--              RLS security policies, and a secure self-deletion function.
-- =========================================================================

-- 1. REPORTS TABLE (UGC Safety Reporting)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('abuse', 'explicit content', 'scam', 'other')),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BLOCKS TABLE (UGC Block Subsystem)
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR REPORTS
CREATE POLICY "Users can insert own reports" 
  ON public.reports FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own submitted reports" 
  ON public.reports FOR SELECT 
  USING (auth.uid() = reporter_id);

-- 5. RLS POLICIES FOR BLOCKS
CREATE POLICY "Users can view own blocks" 
  ON public.blocks FOR SELECT 
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block other users" 
  ON public.blocks FOR INSERT 
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock other users" 
  ON public.blocks FOR DELETE 
  USING (auth.uid() = blocker_id);

-- 6. GRANTS FOR AUTHENTICATED USERS
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;

-- 7. SECURE SELF-DELETION FUNCTION (Account Lifecycle)
-- Running as SECURITY DEFINER runs with superuser privileges,
-- allowing authenticated users to delete themselves from auth.users securely.
CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_own_user_account() TO authenticated;
