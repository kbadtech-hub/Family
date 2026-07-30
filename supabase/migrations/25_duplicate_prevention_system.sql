-- =========================================================================
-- BETESEB PLATFORM — MODULE 25: DUPLICATE ACCOUNT PREVENTION SYSTEM
-- =========================================================================

-- 1. Extend profiles table with structured identity & phonetic columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name                 TEXT,
  ADD COLUMN IF NOT EXISTS father_name                TEXT,
  ADD COLUMN IF NOT EXISTS grandfather_name           TEXT,
  ADD COLUMN IF NOT EXISTS mother_name                TEXT,
  ADD COLUMN IF NOT EXISTS first_name_phonetic        TEXT,
  ADD COLUMN IF NOT EXISTS father_name_phonetic       TEXT,
  ADD COLUMN IF NOT EXISTS grandfather_name_phonetic  TEXT,
  ADD COLUMN IF NOT EXISTS mother_name_phonetic       TEXT,
  ADD COLUMN IF NOT EXISTS face_embedding             JSONB DEFAULT NULL;

-- 2. Migration trigger/function to parse full_name if first_name is missing
CREATE OR REPLACE FUNCTION public.sync_profile_name_parts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  name_parts TEXT[];
BEGIN
  IF (NEW.full_name IS NOT NULL AND NEW.full_name <> '') AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
    name_parts := string_to_array(trim(NEW.full_name), ' ');
    IF array_length(name_parts, 1) >= 1 THEN
      NEW.first_name := name_parts[1];
    END IF;
    IF array_length(name_parts, 1) >= 2 THEN
      NEW.father_name := name_parts[2];
    END IF;
    IF array_length(name_parts, 1) >= 3 THEN
      NEW.grandfather_name := name_parts[3];
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_name_parts ON public.profiles;
CREATE TRIGGER trg_sync_profile_name_parts
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_name_parts();

-- Populate existing profile name parts
UPDATE public.profiles 
SET full_name = full_name 
WHERE first_name IS NULL AND full_name IS NOT NULL AND full_name <> '';

-- 3. Create Duplicate Flags table for Admin Review Dashboard
CREATE TABLE IF NOT EXISTS public.duplicate_flags (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  flagged_user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  similarity_score  NUMERIC NOT NULL DEFAULT 0.0,
  matched_stage     TEXT CHECK (matched_stage IN ('stage_1_basic', 'stage_2_advanced', 'phone_email_social', 'photo_face_embedding')),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved_distinct', 'merged', 'blocked')),
  match_details     JSONB DEFAULT '{}',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at       TIMESTAMP WITH TIME ZONE,
  resolved_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_duplicate_pair UNIQUE (primary_user_id, flagged_user_id)
);

-- 4. Enable RLS on duplicate_flags
ALTER TABLE public.duplicate_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Full Access to Duplicate Flags" ON public.duplicate_flags;
CREATE POLICY "Admin Full Access to Duplicate Flags" ON public.duplicate_flags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Service Role Full Access to Duplicate Flags" ON public.duplicate_flags;
CREATE POLICY "Service Role Full Access to Duplicate Flags" ON public.duplicate_flags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Indexes for fast candidate lookup
CREATE INDEX IF NOT EXISTS idx_profiles_dob_first_father 
  ON public.profiles(birth_date, first_name_phonetic, father_name_phonetic);

CREATE INDEX IF NOT EXISTS idx_profiles_phonetic_all
  ON public.profiles(first_name_phonetic, father_name_phonetic, grandfather_name_phonetic, mother_name_phonetic);

CREATE INDEX IF NOT EXISTS idx_duplicate_flags_status 
  ON public.duplicate_flags(status, created_at DESC);

-- Grants
GRANT ALL ON public.duplicate_flags TO authenticated, service_role;
