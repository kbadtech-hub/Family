-- Migration: Create daily_limits table and trigger
CREATE TABLE IF NOT EXISTS public.daily_limits (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages_sent INT DEFAULT 0 NOT NULL,
  calls_duration_seconds INT DEFAULT 0 NOT NULL,
  ad_extensions INT DEFAULT 0 NOT NULL,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.daily_limits ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can select own daily limits" ON public.daily_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users can update own daily limits" ON public.daily_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert policy (backup)
CREATE POLICY "Users can insert own daily limits" ON public.daily_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.daily_limits TO authenticated;
GRANT ALL ON public.daily_limits TO service_role;

-- Seeding function for new users
CREATE OR REPLACE FUNCTION public.create_limits_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.daily_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger
CREATE OR REPLACE TRIGGER on_profile_created_limits
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_limits_for_new_user();

-- Seed existing profiles
INSERT INTO public.daily_limits (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
