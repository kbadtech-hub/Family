-- =========================================================================
-- BETESEB PLATFORM — MODULE 99: ADMIN CMS, TABLES & RLS REPAIR
-- =========================================================================

-- 1. Ensure updated_at exists on settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create site_posts table if not exists
CREATE TABLE IF NOT EXISTS public.site_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         TEXT,
  content      TEXT NOT NULL,
  video_url    TEXT,
  image_url    TEXT,
  category     TEXT DEFAULT 'education',
  is_published BOOLEAN DEFAULT FALSE,
  author_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create lessons table if not exists
CREATE TABLE IF NOT EXISTS public.lessons (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  youtube_url     TEXT NOT NULL,
  instructions    TEXT,
  category        TEXT DEFAULT 'relationships',
  is_premium_only BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on all CMS tables
ALTER TABLE public.settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_catalog     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_vendors  ENABLE ROW LEVEL SECURITY;

-- 5. Fix RLS Policies for settings
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin updates to settings" ON public.settings;
DROP POLICY IF EXISTS "Settings full access" ON public.settings;
CREATE POLICY "Settings full access" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 6. Fix RLS Policies for gift_catalog
DROP POLICY IF EXISTS "Public Read Access for Gift Catalog" ON public.gift_catalog;
DROP POLICY IF EXISTS "Admin CRUD Access for Gift Catalog" ON public.gift_catalog;
DROP POLICY IF EXISTS "Gift Catalog full access" ON public.gift_catalog;
CREATE POLICY "Gift Catalog full access" ON public.gift_catalog FOR ALL USING (true) WITH CHECK (true);

-- 7. Fix RLS Policies for gifts
DROP POLICY IF EXISTS "Gifts full access" ON public.gifts;
CREATE POLICY "Gifts full access" ON public.gifts FOR ALL USING (true) WITH CHECK (true);

-- 8. Fix RLS Policies for site_posts
DROP POLICY IF EXISTS "Site Posts full access" ON public.site_posts;
CREATE POLICY "Site Posts full access" ON public.site_posts FOR ALL USING (true) WITH CHECK (true);

-- 9. Fix RLS Policies for lessons
DROP POLICY IF EXISTS "Lessons full access" ON public.lessons;
CREATE POLICY "Lessons full access" ON public.lessons FOR ALL USING (true) WITH CHECK (true);

-- 10. Fix RLS Policies for wedding_vendors
DROP POLICY IF EXISTS "Wedding Vendors full access" ON public.wedding_vendors;
CREATE POLICY "Wedding Vendors full access" ON public.wedding_vendors FOR ALL USING (true) WITH CHECK (true);

-- 11. Grant explicit permissions
GRANT ALL ON public.settings TO authenticated, anon, service_role;
GRANT ALL ON public.gift_catalog TO authenticated, anon, service_role;
GRANT ALL ON public.gifts TO authenticated, anon, service_role;
GRANT ALL ON public.site_posts TO authenticated, anon, service_role;
GRANT ALL ON public.lessons TO authenticated, anon, service_role;
GRANT ALL ON public.wedding_vendors TO authenticated, anon, service_role;
