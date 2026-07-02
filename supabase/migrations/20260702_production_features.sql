-- ============================================================
-- Beteseb Production Features Migration
-- Date: 2026-07-02
-- ============================================================

-- 1. Add region/country fields to profiles (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS agreed_to_community BOOLEAN DEFAULT FALSE;

-- 2. Detect and set region for existing Ethiopian users
UPDATE public.profiles
  SET region = 'local'
  WHERE (phone LIKE '+251%' OR phone LIKE '09%' OR phone LIKE '07%')
     OR country ILIKE 'ethiopia'
     OR country ILIKE 'et';

UPDATE public.profiles
  SET region = 'global'
  WHERE region IS NULL;

-- 3. Ensure messages table exists with full schema
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policy to avoid duplicate errors
DROP POLICY IF EXISTS "Users can send and receive messages" ON public.messages;
CREATE POLICY "Users can send and receive messages"
  ON public.messages
  FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id);

-- 5. Enable Realtime on messages table (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until ON public.profiles(premium_until);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- 7. Premium check function (used in feature gating)
CREATE OR REPLACE FUNCTION is_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_premium_until TIMESTAMPTZ;
BEGIN
  SELECT premium_until INTO v_premium_until
  FROM public.profiles
  WHERE id = user_id;
  RETURN v_premium_until IS NOT NULL AND v_premium_until > NOW();
END;
$$;

-- 8. Daily message count (for server-side quota enforcement)
CREATE OR REPLACE FUNCTION get_daily_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.messages
  WHERE sender_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  RETURN COALESCE(v_count, 0);
END;
$$;
