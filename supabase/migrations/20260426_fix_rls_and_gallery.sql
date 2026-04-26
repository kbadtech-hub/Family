-- 1. Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false),
    ('user_photos', 'user_photos', true),
    ('id-verification', 'id-verification', false) ON CONFLICT (id) DO NOTHING;
-- 2. Storage Policies (Corrected)
-- Remove existing to avoid errors
DROP POLICY IF EXISTS "Users can upload own verifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own verifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own verifications" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access" ON storage.objects;
-- Verifications Policies
CREATE POLICY "Users can upload own verifications" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id IN ('verifications', 'id-verification')
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Users can view own verifications" ON storage.objects FOR
SELECT USING (
        bucket_id IN ('verifications', 'id-verification')
        AND auth.uid() = owner
    );
-- User Photos Policies
CREATE POLICY "Users can upload own photos" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'user_photos'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Public can view user photos" ON storage.objects FOR
SELECT USING (bucket_id = 'user_photos');
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (
    bucket_id = 'user_photos'
    AND auth.uid() = owner
);
-- Admin Global Access
CREATE POLICY "Admin full access" ON storage.objects FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
    )
);
-- 3. Profiles Table Update
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gallery_photos TEXT [] DEFAULT '{}';
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests TEXT;
-- Remove the old table if it exists
DROP TABLE IF EXISTS public.user_photos;
-- 4. Set Admin Role
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'kalidseid111@gmail.com';