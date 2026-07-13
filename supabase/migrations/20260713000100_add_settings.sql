-- Migration: Create settings table and seed initial default record (with coin packages)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_content JSONB DEFAULT '{}'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  bank_details JSONB DEFAULT '{"etb":[], "usd":[]}'::jsonb,
  pricing_usd JSONB DEFAULT '{"1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25, "lifetime": 999, "discount": 0}'::jsonb,
  pricing_etb JSONB DEFAULT '{"1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250, "lifetime": 9999, "discount": 0}'::jsonb,
  coin_packages JSONB DEFAULT '[{"id": "coins_50", "coins": 50, "priceEtb": 50, "priceUsd": 1.0}, {"id": "coins_100", "coins": 100, "priceEtb": 100, "priceUsd": 2.0}, {"id": "coins_500", "coins": 500, "priceEtb": 450, "priceUsd": 8.0, "discount": "10% OFF"}, {"id": "coins_1000", "coins": 1000, "priceEtb": 800, "priceUsd": 15.0, "discount": "20% OFF"}]'::jsonb,
  system_access_key VARCHAR(255) DEFAULT 'Harar@2026' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated and anonymous read access (so anyone can read the configuration)
CREATE POLICY "Allow public read access to settings" 
  ON public.settings 
  FOR SELECT 
  USING (true);

-- Create policy to allow authenticated updates to settings (for admins in dashboard)
CREATE POLICY "Allow admin updates to settings" 
  ON public.settings 
  FOR UPDATE 
  USING (true);

-- Seed the initial config row
INSERT INTO public.settings (id, system_access_key, cms_content)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'Harar@2026', 
  '{"hero_title": "Beteseb Habesha Matrimonial", "hero_subtitle": "Find your lifelong companion", "logo_url": ""}'::jsonb
)
ON CONFLICT DO NOTHING;
