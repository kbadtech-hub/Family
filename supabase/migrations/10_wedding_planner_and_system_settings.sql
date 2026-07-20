-- =========================================================================
-- BETESEB PLATFORM — MODULE 10: WEDDING PLANNER & SYSTEM SETTINGS
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.wedding_vendors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  category   VARCHAR(100) NOT NULL,
  rating     NUMERIC(3, 2) DEFAULT 5.0,
  location   VARCHAR(255),
  contact    VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_content      JSONB DEFAULT '{}'::jsonb,
  contact_info     JSONB DEFAULT '{}'::jsonb,
  social_links     JSONB DEFAULT '{}'::jsonb,
  bank_details     JSONB DEFAULT '{"etb":[], "usd":[]}'::jsonb,
  pricing_usd      JSONB DEFAULT '{"1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25, "lifetime": 999, "discount": 0}'::jsonb,
  pricing_etb      JSONB DEFAULT '{"1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250, "lifetime": 9999, "discount": 0}'::jsonb,
  coin_packages    JSONB DEFAULT '[{"id":"coins_50","coins":50,"priceEtb":50,"priceUsd":1.0},{"id":"coins_100","coins":100,"priceEtb":100,"priceUsd":2.0},{"id":"coins_500","coins":500,"priceEtb":450,"priceUsd":8.0,"discount":"10% OFF"},{"id":"coins_1000","coins":1000,"priceEtb":800,"priceUsd":15.0,"discount":"20% OFF"}]'::jsonb,
  ad_config        JSONB DEFAULT '{"enabled":true,"test_mode":true,"unit_android":"ca-app-pub-3940256099942544/5224354917","unit_ios":"ca-app-pub-3940256099942544/1712485313"}'::jsonb,
  payment_gateways JSONB DEFAULT '{"stripe":true,"chapa":true,"telebirr":true,"paypal":true,"bank_transfer":true}'::jsonb,
  system_access_key VARCHAR(255) DEFAULT 'Harar@2026' NOT NULL,
  play_store_url   TEXT DEFAULT '',
  app_store_url    TEXT DEFAULT '',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Row Level Security
ALTER TABLE public.wedding_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to wedding_vendors" ON public.wedding_vendors;
CREATE POLICY "Allow public read access to wedding_vendors" ON public.wedding_vendors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to settings" ON public.settings;
CREATE POLICY "Allow public read access to settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin updates to settings" ON public.settings;
CREATE POLICY "Allow admin updates to settings" ON public.settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 3. Grants & Indexes
GRANT SELECT ON public.wedding_vendors TO authenticated, anon, service_role;
GRANT SELECT ON public.settings TO authenticated, anon, service_role;
GRANT UPDATE ON public.settings TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_wedding_vendors_category ON public.wedding_vendors(category);

-- 4. Seed Data
INSERT INTO public.wedding_vendors (name, category, rating, location, contact)
VALUES
  ('Sheraton Addis Grand Ballroom', 'Venue',       4.9, 'Addis Ababa',          '+251115171717'),
  ('Skyline Hotel Event Hall',       'Venue',       4.8, 'Addis Ababa',          '+251116676000'),
  ('Simien Studio Cinema',           'Photography', 4.9, 'Addis Ababa & Gondar', '+251911223344'),
  ('Habesha Bridal Decor & Flowers', 'Decor',       4.7, 'Addis Ababa',          '+251922334455'),
  ('Lucy Traditional Bridal Salon',  'Styling',     4.8, 'Addis Ababa',          '+251933445566')
ON CONFLICT DO NOTHING;

INSERT INTO public.settings (id, system_access_key, cms_content)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Harar@2026',
  '{"hero_title": "Beteseb Habesha Matrimonial", "hero_subtitle": "Find your lifelong companion", "logo_url": ""}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 5. Backfill Existing Profiles (safe for re-runs)
INSERT INTO public.user_wallets (id, coin_balance)
SELECT id, 0 FROM public.profiles
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.daily_limits (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
