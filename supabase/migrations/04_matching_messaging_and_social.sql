-- =========================================================================
-- BETESEB PLATFORM — MODULE 04: MATCHING, MESSAGING & SOCIAL INTERACTIONS
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  translations JSONB DEFAULT '{}',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friendships (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.interaction_telemetry (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  friendship_id         UUID REFERENCES public.friendships(id) ON DELETE CASCADE UNIQUE,
  reply_latency_seconds INT DEFAULT 0,
  is_frozen             BOOLEAN DEFAULT FALSE,
  conflict_score        INT DEFAULT 0,
  phase                 INT DEFAULT 1,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN ('abuse', 'explicit content', 'scam', 'other')),
  details     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 2. Functions & Triggers
DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_friendship_telemetry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.interaction_telemetry (friendship_id, reply_latency_seconds, is_frozen, conflict_score, phase)
    VALUES (NEW.id, 0, false, 0, 1)
    ON CONFLICT (friendship_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friendship_accepted_telemetry ON public.friendships;
CREATE TRIGGER on_friendship_accepted_telemetry
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_friendship_telemetry();

-- 3. Row Level Security
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks                ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Message Access" ON public.messages;
CREATE POLICY "Message Access" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Message Insert" ON public.messages;
CREATE POLICY "Message Insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Message Update" ON public.messages;
CREATE POLICY "Message Update" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received requests" ON public.friendships;
CREATE POLICY "Users can update received requests" ON public.friendships FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete own requests" ON public.friendships;
CREATE POLICY "Users can delete own requests" ON public.friendships FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "telemetry_isolation_policy" ON public.interaction_telemetry;
CREATE POLICY "telemetry_isolation_policy" ON public.interaction_telemetry FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = friendship_id
      AND (f.sender_id = auth.uid() OR f.receiver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own submitted reports" ON public.reports;
CREATE POLICY "Users can view own submitted reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocks;
CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can block other users" ON public.blocks;
CREATE POLICY "Users can block other users" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocks;
CREATE POLICY "Users can unblock" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- 4. Grants & Indexes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated, service_role;
GRANT ALL ON public.interaction_telemetry TO authenticated, service_role;
GRANT SELECT, INSERT ON public.reports TO authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_friendships_sender_receiver ON public.friendships(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status          ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver    ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at         ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read            ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_reported   ON public.reports(reporter_id, reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked      ON public.blocks(blocker_id, blocked_id);
