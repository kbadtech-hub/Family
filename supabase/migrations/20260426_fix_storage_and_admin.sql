-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true), ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Avatars Policies (Public bucket)
CREATE POLICY "Avatar View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- 3. Verifications Policies (Private bucket)
-- Note: id-verification was used in code, but user requested 'verifications'. I'll add policies for both just in case.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('id-verification', 'id-verification', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Verification View Own" ON storage.objects FOR SELECT USING (bucket_id IN ('verifications', 'id-verification') AND auth.uid() = owner);
CREATE POLICY "Verification Upload Own" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('verifications', 'id-verification') AND auth.role() = 'authenticated');

-- 4. Set Admin Role
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'kalidseid111@gmail.com';
