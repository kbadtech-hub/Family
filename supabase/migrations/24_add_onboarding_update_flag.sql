-- =========================================================================
-- BETESEB PLATFORM — MODULE 24: GLOBAL ONBOARDING UPDATE TRACKING
-- =========================================================================

-- Add has_updated_onboarding flag to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_updated_onboarding BOOLEAN DEFAULT FALSE NOT NULL;

-- Index for quick lookup on user onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_has_updated_onboarding ON public.profiles (has_updated_onboarding);

COMMENT ON COLUMN public.profiles.has_updated_onboarding IS 'Tracks whether the authenticated user has completed the updated onboarding flow.';
