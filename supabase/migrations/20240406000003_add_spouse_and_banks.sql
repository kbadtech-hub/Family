-- Add spouse_requirements to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spouse_requirements TEXT;

-- Update settings table to include bank_details
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{"etb": [], "usd": []}'::JSONB;

-- Ensure RLS allows admins to manage settings
-- Assuming there's a mechanism to identify admins (e.g. role or specific IDs)
-- For now, ensuring the table exists and columns are correct.
