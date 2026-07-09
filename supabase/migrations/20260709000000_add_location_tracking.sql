-- Migration: Add location tracking columns to public.profiles table
-- This allows database migration without wiping existing tables.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_location JSONB,
ADD COLUMN IF NOT EXISTS last_login_location JSONB,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
