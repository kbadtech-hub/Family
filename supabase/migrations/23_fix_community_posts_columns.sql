-- =========================================================================
-- BETESEB PLATFORM — MIGRATION 23: FIX COMMUNITY POSTS MISSING COLUMNS
-- Adds is_approved, category, is_edited, parent_id columns that are
-- required by the Community Hub feature but were missing from the original schema.
-- =========================================================================

-- 1. Add missing columns to community_posts
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS is_approved  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS category     TEXT    DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_edited    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;

-- 2. Add missing columns to post_comments
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- 3. Update all existing posts to be approved and have a default category
UPDATE public.community_posts
  SET is_approved = TRUE, category = 'general'
  WHERE is_approved IS NULL OR category IS NULL;

-- 4. Create post_likes table if it doesn't exist (used by CommunityView fetchPosts)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like" ON public.post_likes;
CREATE POLICY "Authenticated users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike" ON public.post_likes;
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO authenticated, service_role;

-- 5. Create saved_posts table if not exists
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved posts" ON public.saved_posts;
CREATE POLICY "Users can insert own saved posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved posts" ON public.saved_posts;
CREATE POLICY "Users can delete own saved posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated, service_role;

-- 6. Create post_reposts table if not exists
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reposts" ON public.post_reposts;
CREATE POLICY "Anyone can view reposts" ON public.post_reposts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reposts" ON public.post_reposts;
CREATE POLICY "Users can insert own reposts" ON public.post_reposts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reposts" ON public.post_reposts;
CREATE POLICY "Users can delete own reposts" ON public.post_reposts FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.post_reposts TO authenticated, service_role;

-- 7. Create follows table if not exists
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own follows" ON public.follows;
CREATE POLICY "Users can insert own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
CREATE POLICY "Users can delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated, service_role;

-- 8. Create blocks table if not exists
CREATE TABLE IF NOT EXISTS public.blocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocks;
CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can block" ON public.blocks;
CREATE POLICY "Users can block" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocks;
CREATE POLICY "Users can unblock" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated, service_role;

-- 9. Add UPDATE policy for community_posts (for edit feature)
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_is_approved ON public.community_posts(is_approved);
CREATE INDEX IF NOT EXISTS idx_community_posts_category    ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id          ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id         ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id         ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id        ON public.follows(following_id);

-- 11. Add to realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.community_posts,
      public.post_comments,
      public.post_likes,
      public.saved_posts,
      public.post_reposts,
      public.follows;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
