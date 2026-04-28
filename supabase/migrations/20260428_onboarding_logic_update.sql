-- Add onboarding_completed column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles that are already onboarded
UPDATE profiles SET onboarding_completed = TRUE WHERE is_onboarded = TRUE;
