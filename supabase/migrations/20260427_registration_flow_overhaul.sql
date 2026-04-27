-- ==========================================
-- BETESEB REGISTRATION FLOW OVERHAUL (2026)
-- ==========================================

-- 1. UPDATE PROFILES TABLE
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- 2. CREATE VERIFICATIONS TABLE (For Identity Matching History)
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  id_url TEXT,
  selfie_url TEXT,
  id_data JSONB DEFAULT '{}', -- OCR'd data (name, birthdate)
  match_score FLOAT DEFAULT 0.0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- 3. ENABLE RLS ON VERIFICATIONS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications" ON verifications 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications" ON verifications 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 4. UPDATE AUTH TRIGGER
-- We need to ensure that handle_new_user doesn't fail if metadata is empty (for quick signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    is_onboarded,
    verification_status,
    role
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User ' || substr(new.id::text, 1, 5)), 
    false,
    'unverified',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
