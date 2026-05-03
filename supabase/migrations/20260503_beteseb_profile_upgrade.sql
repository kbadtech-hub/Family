-- ==========================================
-- BETESEB PROFILE UPGRADE (v3.1)
-- AUTHOR: Antigravity AI
-- DATE: 2026-05-03
-- ==========================================

-- 1. ADD NEW COLUMNS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- 2. UPDATE SECURITY POLICY (Explicitly allow update on new columns)
-- (Already covered by "Users Own Profile Update" policy, but ensuring permissions are solid)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 3. INDEX FOR FAST USERNAME LOOKUP
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
