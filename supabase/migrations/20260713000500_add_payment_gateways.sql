-- Migration: Add payment_gateways to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_gateways JSONB DEFAULT '{"stripe": true, "chapa": true, "telebirr": true, "paypal": true, "bank_transfer": true}'::jsonb;
