-- 1. Remove the auto-verify trigger that marks users as verified upon email confirmation
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_verification();

-- 2. Ensure is_verified is FALSE by default and for existing users who haven't uploaded IDs
-- We want to force everyone to go through the ID/Selfie flow again if they haven't.
-- However, we should be careful not to lock out everyone if they were already verified properly.
-- Assuming "properly" means having a record in the 'verifications' table with status 'verified'.

UPDATE public.profiles p
SET is_verified = FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.verifications v 
  WHERE v.user_id = p.id AND v.status = 'verified'
);

-- 3. Re-apply Row Level Security (RLS) and Foreign Key constraints if they were loosened
-- (Assuming they are already there based on consolidated_schema.sql, but let's be sure)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- 4. Ensure foreign key constraints are strict
-- profiles.id -> auth.users.id
-- verifications.user_id -> profiles.id

-- These are already in consolidated_schema.sql, but good to keep in mind.
