-- ==========================================
-- SITE POSTS: EDUCATIONAL VIDEOS & ABOUT US
-- ==========================================
-- 1. CREATE SITE POSTS TABLE
CREATE TABLE IF NOT EXISTS public.site_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  video_url TEXT,
  -- YouTube/Vimeo link
  image_url TEXT,
  -- Optional featured image
  category TEXT NOT NULL CHECK (
    category IN ('education', 'about', 'news', 'course')
  ),
  is_published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. ENABLE RLS
ALTER TABLE public.site_posts ENABLE ROW LEVEL SECURITY;
-- 3. POLICIES
-- Everyone can read published posts
DROP POLICY IF EXISTS "Published posts are viewable by everyone." ON public.site_posts;
CREATE POLICY "Published posts are viewable by everyone." ON public.site_posts FOR
SELECT USING (is_published = true);
-- Staff (Admins/Moderators) can manage all posts
DROP POLICY IF EXISTS "Staff can manage all posts." ON public.site_posts;
CREATE POLICY "Staff can manage all posts." ON public.site_posts FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_site_posts_updated ON public.site_posts;
CREATE TRIGGER on_site_posts_updated BEFORE
UPDATE ON public.site_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();