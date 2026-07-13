-- Migration: Add warning_message to profiles and ad_config to settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS warning_message TEXT DEFAULT NULL;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ad_config JSONB DEFAULT '{"enabled": true, "test_mode": true, "unit_android": "ca-app-pub-3940256099942544/5224354917", "unit_ios": "ca-app-pub-3940256099942544/1712485313"}'::jsonb;
