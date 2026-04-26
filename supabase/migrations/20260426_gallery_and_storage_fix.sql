-- 1. Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('verifications', 'verifications', false),
    ('user_photos', 'user_photos', true),
    ('id-verification', 'id-verification', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage (objects table)
-- Drop existing to avoid conflicts if needed, or use ON CONFLICT equivalents
-- Policies for 'verifications' and 'id-verification'
CREATE POLICY "Users can upload own verifications" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id IN ('verifications', 'id-verification') AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can view own verifications" ON storage.objects FOR SELECT USING (
    bucket_id IN ('verifications', 'id-verification') AND auth.uid() = owner
);
CREATE POLICY "Users can update own verifications" ON storage.objects FOR UPDATE WITH CHECK (
    bucket_id IN ('verifications', 'id-verification') AND auth.uid() = owner
);

-- Policies for 'user_photos'
CREATE POLICY "Public can view user photos" ON storage.objects FOR SELECT USING (
    bucket_id = 'user_photos'
);
CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'user_photos' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE WITH CHECK (
    bucket_id = 'user_photos' AND auth.uid() = owner
);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE WITH CHECK (
    bucket_id = 'user_photos' AND auth.uid() = owner
);

-- 3. Database Table for Gallery
CREATE TABLE IF NOT EXISTS public.user_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_photos table
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user photos table" ON public.user_photos FOR SELECT USING (true);
CREATE POLICY "Users can manage own photo entries" ON public.user_photos FOR ALL USING (auth.uid() = user_id);

-- 4. Enhance Profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT;

-- 5. Update Admin Role (Ensuring kalidseid111@gmail.com is Super Admin)
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'kalidseid111@gmail.com';
