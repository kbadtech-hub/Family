-- 1. Add is_verified column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Create function to handle verification status updates
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger AS $$
BEGIN
  -- If email_confirmed_at was just set (transitioned from NULL to a value)
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR NEW.email_confirmed_at != OLD.email_confirmed_at) THEN
    UPDATE public.profiles
    SET is_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_verification();

-- 4. Initial sync for existing confirmed users
UPDATE public.profiles p
SET is_verified = TRUE
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL;
