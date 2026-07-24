-- =========================================================================
-- BETESEB PLATFORM — MODULE 22: MASTER PROMPT & COMMUNITY HUB UPDATES
-- =========================================================================

-- 1. CENTRALIZED NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('social', 'support', 'course', 'appointment', 'subscription')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link_url    TEXT,
  is_read     BOOLEAN DEFAULT FALSE NOT NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 3. SAVED POSTS TABLE
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id    UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 4. POST REPOSTS TABLE
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id    UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 5. ICE BREAK DISCUSSIONS TABLE
CREATE TABLE IF NOT EXISTS public.ice_break_discussions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ALTER EXISTING TABLES FOR EDITS & THREADED COMMENTS
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- 7. ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.user_notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ice_break_discussions ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated insert notifications" ON public.user_notifications;
CREATE POLICY "Allow authenticated insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- Follows Policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own follows" ON public.follows;
CREATE POLICY "Users can insert own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
CREATE POLICY "Users can delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Saved Posts Policies
DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved posts" ON public.saved_posts;
CREATE POLICY "Users can insert own saved posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved posts" ON public.saved_posts;
CREATE POLICY "Users can delete own saved posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Reposts Policies
DROP POLICY IF EXISTS "Anyone can view reposts" ON public.post_reposts;
CREATE POLICY "Anyone can view reposts" ON public.post_reposts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reposts" ON public.post_reposts;
CREATE POLICY "Users can insert own reposts" ON public.post_reposts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reposts" ON public.post_reposts;
CREATE POLICY "Users can delete own reposts" ON public.post_reposts FOR DELETE USING (auth.uid() = user_id);

-- Ice Break Policies
DROP POLICY IF EXISTS "Anyone can view ice break discussions" ON public.ice_break_discussions;
CREATE POLICY "Anyone can view ice break discussions" ON public.ice_break_discussions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert ice break" ON public.ice_break_discussions;
CREATE POLICY "Authenticated users insert ice break" ON public.ice_break_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. GRANTS & INDEXES
GRANT ALL ON public.user_notifications   TO authenticated, service_role;
GRANT ALL ON public.follows              TO authenticated, service_role;
GRANT ALL ON public.saved_posts          TO authenticated, service_role;
GRANT ALL ON public.post_reposts          TO authenticated, service_role;
GRANT ALL ON public.ice_break_discussions TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_category ON public.user_notifications(category);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id        ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id       ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id        ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id       ON public.post_reposts(post_id);

-- 9. ADD TABLES TO REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications, public.follows, public.community_posts, public.post_comments, public.user_wallets;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
