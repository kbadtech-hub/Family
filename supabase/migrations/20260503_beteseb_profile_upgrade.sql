-- ==========================================
-- BETESEB PROFILE UPGRADE (v3.1)
-- AUTHOR: Antigravity AI
-- DATE: 2026-05-03
-- ==========================================

-- 1. ADD NEW COLUMNS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- 2. UPDATE SECURITY POLICY (Explicitly allow update on new columns)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 3. INDEX FOR FAST USERNAME LOOKUP
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- NOTE: To fix "Could not find column in schema cache", please run:
-- NOTIFY pgrst, 'reload schema';
