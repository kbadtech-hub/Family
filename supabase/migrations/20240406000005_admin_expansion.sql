-- ==========================================
-- ADMIN SUITE EXPANSION: ROLES & CMS
-- ==========================================

-- 1. EXPAND ROLES
-- Update the check constraint on profiles.role to include 'moderator'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'moderator'));

-- 2. CREATE STAFF HELPER
-- Returns true for admins and moderators
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. HARDEN SETTINGS TABLE
-- Add system_access_key to settings for dynamic admin portal security
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS system_access_key TEXT DEFAULT 'Harar@2026';

-- 4. UPDATE RLS FOR STAFF
-- Allow staff (admins + moderators) to view and manage certain tables
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Staff can update all profiles" ON public.profiles FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "Only Admins can update payments." ON public.payments;
CREATE POLICY "Staff can update payments." ON public.payments FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Allow admin update access" ON public.settings;
CREATE POLICY "Allow admin update access" ON public.settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin()); -- Only super-admins for settings

-- 5. INITIALIZE SETTINGS
-- Ensure at least one settings row exists
INSERT INTO public.settings (admin_id, cms_content, social_links)
SELECT id, '{"hero_title": "Beteseb (ቤተሰብ)", "hero_subtitle": "Global Ethiopian Marriage Matching", "footer_description": ""}'::jsonb, 
'{"facebook":"","whatsapp":"","twitter":"","linkedin":"","tiktok":"","instagram":"","telegram":""}'::jsonb
FROM auth.users
WHERE email = 'zuretalem@gmail.com'
ON CONFLICT DO NOTHING;
