-- Migration: Add User Privacy Toggles for Last Seen and Read Receipts
-- Date: 2026-07-14

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS enable_read_receipts BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS enable_last_seen BOOLEAN DEFAULT TRUE NOT NULL;
