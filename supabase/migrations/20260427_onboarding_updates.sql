-- ==========================================
-- BETESEB ONBOARDING & LOCALIZATION UPDATES (2026)
-- ==========================================

-- 1. ADD MISSING COLUMNS TO PROFILES
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS has_children TEXT,
ADD COLUMN IF NOT EXISTS future_children TEXT,
ADD COLUMN IF NOT EXISTS partner_countries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS partner_age_min INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS partner_age_max INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS partner_religion TEXT,
ADD COLUMN IF NOT EXISTS partner_marital_pref TEXT,
ADD COLUMN IF NOT EXISTS partner_children_pref TEXT;

-- 2. ADD CONSTRAINTS FOR DATA INTEGRITY
-- First, remove existing constraints if we are narrowing them down
-- (Marital status was previously generic text)

-- Note: We use 'DO' blocks to handle potential errors if constraints already exist or if data is incompatible.
DO $$ 
BEGIN
    -- Marital Status Constraint
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_marital_status_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_marital_status_check 
        CHECK (marital_status IN ('Never Married', 'Divorced'));

    -- Has Children Constraint
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_has_children_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_has_children_check 
        CHECK (has_children IN ('Yes', 'No'));

    -- Future Children Constraint
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_future_children_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_future_children_check 
        CHECK (future_children IN ('Wants Children', 'Does Not Want Children', 'Does Not Matter'));

    -- Role Constraint (already exists in master schema but good to ensure)
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin', 'super_admin'));
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Constraint update skipped due to existing data incompatibility. Please clean data first.';
END $$;

-- 3. AUTH TRIGGER (Critical for Syncing Onboarding Data)
-- This ensures that when a user signs up with metadata, it flows into the public profiles table.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    birth_date,
    birth_time,
    gender,
    location,
    religion,
    marital_status,
    job_title,
    finance_habit,
    family_values,
    conflict_resolution,
    spouse_requirements,
    star_sign,
    is_onboarded,
    has_children,
    future_children,
    partner_countries,
    partner_age_min,
    partner_age_max,
    partner_religion,
    partner_marital_pref,
    partner_children_pref,
    education
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    (new.raw_user_meta_data->>'birth_date')::date,
    (new.raw_user_meta_data->>'birth_time')::time,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'religion',
    new.raw_user_meta_data->>'marital_status',
    new.raw_user_meta_data->>'job', -- Mapped from 'job' in frontend
    new.raw_user_meta_data->>'finance_habit',
    new.raw_user_meta_data->>'family_value', -- Mapped from 'family_value' in frontend
    new.raw_user_meta_data->>'conflict_resolution',
    new.raw_user_meta_data->>'spouse_requirements',
    new.raw_user_meta_data->>'star_sign',
    COALESCE((new.raw_user_meta_data->>'is_onboarded')::boolean, false),
    new.raw_user_meta_data->>'has_children',
    new.raw_user_meta_data->>'future_children',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'partner_countries')), '{}'),
    COALESCE((new.raw_user_meta_data->>'partner_age_min')::integer, 18),
    COALESCE((new.raw_user_meta_data->>'partner_age_max')::integer, 100),
    new.raw_user_meta_data->>'partner_religion',
    new.raw_user_meta_data->>'partner_intent', -- Mapped from 'partner_intent' in frontend
    new.raw_user_meta_data->>'partner_children_pref',
    new.raw_user_meta_data->>'education'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. HELPER VIEW FOR AGE CALCULATION
-- Useful for filtering by age in the app
CREATE OR REPLACE VIEW profile_matches AS
SELECT 
    *,
    EXTRACT(YEAR FROM age(birth_date)) as calculated_age
FROM profiles;
