-- ==========================================
-- FINAL SECURITY LOCKDOWN (V1.2): RLS & AUTH TRIGGERS
-- ==========================================

-- 1. HARDEN is_admin FUNCTION (Mutable Search Path Fix)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. AUTOMATE PROFILE CREATION (Ensures data integrity)
-- Modify profiles to allow initial nullable fields for trigger
ALTER TABLE public.profiles 
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN birth_date DROP NOT NULL,
  ALTER COLUMN birth_time DROP NOT NULL;

-- Function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to execute function on auth.users (new accounts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. SECURE public.settings TABLE
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.settings;
CREATE POLICY "Allow public read access" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin update access" ON public.settings;
CREATE POLICY "Allow admin update access" ON public.settings FOR UPDATE
USING (public.is_admin());

-- 4. SECURE public.payments TABLE
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payments." ON public.payments;
CREATE POLICY "Users can view own payments." ON public.payments FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can insert own payments." ON public.payments;
CREATE POLICY "Users can insert own payments." ON public.payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Only Admins can update payments." ON public.payments;
CREATE POLICY "Only Admins can update payments." ON public.payments FOR ALL 
USING (public.is_admin());

-- 5. SECURE public.profiles TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT 
USING (auth.uid() is not null);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id AND (CASE WHEN role IS NOT NULL THEN (role = 'user' OR public.is_admin()) ELSE TRUE END));

-- 6. SET FINAL ADMIN ROLE
UPDATE public.profiles SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'zuretalem@gmail.com');
