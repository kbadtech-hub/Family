-- =========================================================================
-- BETESEB PLATFORM — VIP EXTENSION MIGRATION
-- VERSION: 8.0 (VIP Tier Add-on)
-- DESCRIPTION: Non-destructive migration adding VIP fields to profiles
--              and creating the vip_photo_reveals mapping layout.
-- =========================================================================

-- 1. Alter profiles table to add VIP columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_vip_member BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_ghost_mode_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_online_status BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_read_receipts BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS strict_incognito BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Create VIP Photo Reveals mapping table
CREATE TABLE IF NOT EXISTS public.vip_photo_reveals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(vip_id, viewer_id)
);

-- 3. Enable RLS on the new table
ALTER TABLE public.vip_photo_reveals ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for vip_photo_reveals
CREATE POLICY "Users can insert own photo reveals" ON public.vip_photo_reveals
  FOR INSERT WITH CHECK (auth.uid() = vip_id OR auth.uid() = viewer_id);

CREATE POLICY "Users can view relevant photo reveals" ON public.vip_photo_reveals
  FOR SELECT USING (auth.uid() = vip_id OR auth.uid() = viewer_id);

-- 5. Grant Permissions to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_photo_reveals TO authenticated;
GRANT ALL PRIVILEGES ON public.vip_photo_reveals TO service_role;

-- 6. Add performance indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_vip_member ON public.profiles(is_vip_member);
CREATE INDEX IF NOT EXISTS idx_vip_photo_reveals_lookup ON public.vip_photo_reveals(vip_id, viewer_id);
