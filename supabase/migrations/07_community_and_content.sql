-- =========================================================================
-- BETESEB PLATFORM — MODULE 07: COMMUNITY & CONTENT
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.community_posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  image_url     TEXT,
  topic         TEXT CHECK (topic IN ('Marriage', 'Parenting', 'Family Finance', 'General')),
  dislike_count INTEGER DEFAULT 0,
  heart_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id       UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'dislike')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- 2. Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community Access" ON public.community_posts;
CREATE POLICY "Community Access" ON public.community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Community Insert" ON public.community_posts;
CREATE POLICY "Community Insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Community Delete Own" ON public.community_posts;
CREATE POLICY "Community Delete Own" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.post_comments;
CREATE POLICY "Authenticated users can post comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can react" ON public.post_reactions;
CREATE POLICY "Authenticated users can react" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.post_reactions;
CREATE POLICY "Users can remove their own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- 3. Grants & Indexes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_topic      ON public.community_posts(topic);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id      ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id     ON public.post_reactions(post_id);
