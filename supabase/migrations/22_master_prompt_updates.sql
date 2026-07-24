-- =========================================================================
-- BETESEB PLATFORM — MODULE 22: MASTER PROMPT UPDATES
-- Centralized Notifications, In-App Reposts, and Ice Break Discussions
-- =========================================================================

-- 1. Centralized System-Wide Notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('social', 'support', 'course', 'appointment', 'subscription')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link_url    TEXT,
  is_read     BOOLEAN DEFAULT FALSE NOT NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Community Post In-App Reposts Table
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (post_id, user_id)
);

-- 3. Ice Break Daily Discussions Responses Table
CREATE TABLE IF NOT EXISTS public.ice_break_discussions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic       TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ice_break_discussions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- user_notifications: Users read/update their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System insert notifications" ON public.user_notifications;
CREATE POLICY "System insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- post_reposts: Anyone can view, authenticated users can insert/delete own
DROP POLICY IF EXISTS "Anyone can view reposts" ON public.post_reposts;
CREATE POLICY "Anyone can view reposts" ON public.post_reposts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can repost" ON public.post_reposts;
CREATE POLICY "Users can repost" ON public.post_reposts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own repost" ON public.post_reposts;
CREATE POLICY "Users can delete own repost" ON public.post_reposts FOR DELETE USING (auth.uid() = user_id);

-- ice_break_discussions: Anyone can view, authenticated Gold+ users can insert
DROP POLICY IF EXISTS "Anyone can view ice break discussions" ON public.ice_break_discussions;
CREATE POLICY "Anyone can view ice break discussions" ON public.ice_break_discussions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert ice break discussions" ON public.ice_break_discussions;
CREATE POLICY "Authenticated users can insert ice break discussions" ON public.ice_break_discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Grants & Indexes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON public.post_reposts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ice_break_discussions TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_category ON public.user_notifications(category);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON public.post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_user_id ON public.post_reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_ice_break_discussions_user_id ON public.ice_break_discussions(user_id);

-- 7. Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reposts;
