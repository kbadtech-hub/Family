-- ==========================================
-- BETESEB CONSOLIDATED DATABASE SCHEMA (SECURE V1.4)
-- ==========================================
-- 1. TABLES & CONSTRAINTS
-- ------------------------------------------
-- Profiles Table
create table if not exists public.profiles (
    id uuid references auth.users not null primary key,
    full_name text,
    birth_date date,
    birth_time time,
    location text,
    gender text,
    religion text,
    education text,
    job text,
    height numeric,
    marital_status text,
    children_count integer default 0,
    living_arrangement text,
    star_sign text,
    finance_habit text,
    conflict_resolution text,
    family_value text,
    spouse_requirements text,
    partner_age_range_min integer default 18,
    partner_age_range_max integer default 100,
    partner_religion text [],
    partner_education text [],
    partner_children_choice text,
    future_children_intent text,
    currency_locked text check (currency_locked in ('ETB', 'USD')),
    trial_ends_at timestamp with time zone,
    avatar_url text,
    is_onboarded boolean default false,
    role TEXT DEFAULT 'user',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Ensure correct role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (
        role IN ('user', 'admin', 'moderator', 'super_admin')
    );
-- Verifications Table
create table if not exists public.verifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    doc_type text check (doc_type in ('id', 'passport', 'dl')),
    id_url text,
    selfie_url text,
    status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
    badge_issued boolean default false,
    verified_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Settings Table
create table if not exists public.settings (
    id uuid default gen_random_uuid() primary key,
    admin_id uuid references auth.users not null,
    social_links jsonb default '{"facebook": "", "whatsapp": "", "twitter": "", "linkedin": "", "tiktok": "", "instagram": "", "telegram": ""}'::jsonb,
    bank_details jsonb default '{"etb": [], "usd": []}'::jsonb,
    payment_gateways jsonb default '{}'::jsonb,
    cms_content jsonb default '{"hero_title": "Beteseb (ቤተሰብ)", "hero_subtitle": "Global Ethiopian Marriage Matching", "footer_description": ""}'::jsonb,
    contact_info jsonb default '{"email": "", "phone": "", "address": ""}'::jsonb,
    pricing_usd jsonb default '{"1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25}'::jsonb,
    pricing_etb jsonb default '{"1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250}'::jsonb,
    system_access_key text default 'Harar@2026',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Community Feed Table
create table if not exists public.community_posts (
    id uuid default gen_random_uuid() primary key,
    author_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    is_approved boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Messages Table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    receiver_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Payments Table
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount numeric,
    receipt_url text not null,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Site Posts Table (Education/News)
create table if not exists public.site_posts (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    content text,
    video_url text,
    image_url text,
    category text not null check (
        category in ('education', 'about', 'news', 'course')
    ),
    is_published boolean default false,
    author_id uuid references auth.users not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 2. HELPER FUNCTIONS (RBAC)
-- ------------------------------------------
-- Admin Role Check Function (Admins and Super Admins)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
    );
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public;
-- Staff Role Check Function (Admin, Moderator, Super Admin)
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'moderator', 'super_admin')
    );
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public;
-- Function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.profiles (id, full_name, role)
VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        'user'
    );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 3. TRIGGERS
-- ------------------------------------------
-- Profile creation on sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Updated_at timestamp for site_posts
DROP TRIGGER IF EXISTS on_site_posts_updated ON public.site_posts;
CREATE TRIGGER on_site_posts_updated BEFORE
UPDATE ON public.site_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- 4. RLS POLICIES (HARDENED)
-- ------------------------------------------
-- Profiles
alter table public.profiles enable row level security;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR
SELECT USING (auth.uid() is not null);
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON public.profiles;
CREATE POLICY "Users can insert their own profile during signup" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (
        auth.uid() = id
        AND (
            CASE
                WHEN role IS NOT NULL THEN (
                    role = 'user'
                    OR public.is_admin()
                )
                ELSE TRUE
            END
        )
    );
DROP POLICY IF EXISTS "Staff can update all profiles" ON public.profiles;
CREATE POLICY "Staff can update all profiles" ON public.profiles FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
-- Verifications
alter table public.verifications enable row level security;
DROP POLICY IF EXISTS "Users can view own verification." ON public.verifications;
CREATE POLICY "Users can view own verification." ON public.verifications FOR
SELECT USING (
        auth.uid() = user_id
        OR public.is_staff()
    );
DROP POLICY IF EXISTS "Users can insert own verification." ON public.verifications;
CREATE POLICY "Users can insert own verification." ON public.verifications FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Community
alter table public.community_posts enable row level security;
DROP POLICY IF EXISTS "Approved posts are viewable by everyone." ON public.community_posts;
CREATE POLICY "Approved posts are viewable by everyone." ON public.community_posts FOR
SELECT USING (
        is_approved = true
        or auth.uid() = author_id
        or public.is_staff()
    );
DROP POLICY IF EXISTS "Users can create posts." ON public.community_posts;
CREATE POLICY "Users can create posts." ON public.community_posts FOR
INSERT WITH CHECK (auth.uid() = author_id);
-- Messaging
alter table public.messages enable row level security;
DROP POLICY IF EXISTS "Users can read own messages." ON public.messages;
CREATE POLICY "Users can read own messages." ON public.messages FOR
SELECT USING (
        auth.uid() = sender_id
        or auth.uid() = receiver_id
        or public.is_staff()
    );
DROP POLICY IF EXISTS "Users can send messages." ON public.messages;
CREATE POLICY "Users can send messages." ON public.messages FOR
INSERT WITH CHECK (auth.uid() = sender_id);
-- Payments
alter table public.payments enable row level security;
DROP POLICY IF EXISTS "Users can view own payments." ON public.payments;
CREATE POLICY "Users can view own payments." ON public.payments FOR
SELECT USING (
        auth.uid() = user_id
        OR public.is_staff()
    );
DROP POLICY IF EXISTS "Users can insert own payments." ON public.payments;
CREATE POLICY "Users can insert own payments." ON public.payments FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Staff can update payments." ON public.payments;
CREATE POLICY "Staff can update payments." ON public.payments FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
-- Settings
alter table public.settings enable row level security;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings" ON public.settings FOR
UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Site Posts
alter table public.site_posts enable row level security;
DROP POLICY IF EXISTS "Published posts are viewable by everyone." ON public.site_posts;
CREATE POLICY "Published posts are viewable by everyone." ON public.site_posts FOR
SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Staff can manage all posts." ON public.site_posts;
CREATE POLICY "Staff can manage all posts." ON public.site_posts FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
-- 5. ACCESS RESTORATION (RUN THIS BLOCK)
-- ------------------------------------------
-- Replace YOUR_EMAIL@EXAMPLE.COM with your actual email address
DO $$
DECLARE target_user_id UUID;
BEGIN -- 1. Find User ID
SELECT id INTO target_user_id
FROM auth.users
WHERE email = 'zuretalem@gmail.com';
IF target_user_id IS NOT NULL THEN -- 2. Set Super Admin Role
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = target_user_id;
-- 3. Initialize Settings if missing
IF NOT EXISTS (
    SELECT 1
    FROM public.settings
) THEN
INSERT INTO public.settings (admin_id)
VALUES (target_user_id);
END IF;
RAISE NOTICE 'Access restored for user: %',
target_user_id;
ELSE RAISE WARNING 'User with email zuretalem@gmail.com not found in auth.users';
END IF;
END $$;