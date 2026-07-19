-- Alter settings table to add dynamic Play Store and App Store URLs
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS play_store_url TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS app_store_url TEXT DEFAULT '';
