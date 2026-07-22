-- =========================================================================
-- BETESEB PLATFORM — MODULE 17: DYNAMIC FEATURE LOCKS & NOTIFICATIONS
-- =========================================================================

-- 1. Add feature_locks column to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS feature_locks JSONB DEFAULT '{
  "community_hub": false,
  "workshops": false,
  "wedding_planner": false,
  "counseling": false,
  "academy": false,
  "gifts": false
}'::jsonb;

-- 2. Create feature_notifications table to store user opt-ins
CREATE TABLE IF NOT EXISTS public.feature_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email   TEXT,
  feature_key  VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS & Grants
ALTER TABLE public.feature_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert to feature_notifications" ON public.feature_notifications;
CREATE POLICY "Allow authenticated insert to feature_notifications" ON public.feature_notifications 
FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user select own feature_notifications" ON public.feature_notifications;
CREATE POLICY "Allow user select own feature_notifications" ON public.feature_notifications 
FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

GRANT ALL ON public.feature_notifications TO authenticated, anon, service_role;
