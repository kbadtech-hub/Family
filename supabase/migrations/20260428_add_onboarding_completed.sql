-- Add onboarding_completed column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles to have onboarding_completed = TRUE if they were already onboarded
UPDATE profiles SET onboarding_completed = TRUE WHERE is_onboarded = TRUE;

-- Add comment for clarity
COMMENT ON COLUMN profiles.onboarding_completed IS 'Flag to track if the user has completed the mandatory onboarding/verification steps after signup.';
