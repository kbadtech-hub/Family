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
  pricing_usd      JSONB DEFAULT '{"1m": 7.99, "3m": 19.99, "6m": 33.99, "12m": 49.99, "lifetime": 74.99, "vip_1m": 15.99, "vip_3m": 39.99, "vip_6m": 67.99, "vip_12m": 99.99, "vip_lifetime": 149.99, "class": 25, "discount": 0}'::jsonb,
  pricing_etb      JSONB DEFAULT '{"1m": 149.99, "3m": 379.99, "6m": 649.99, "12m": 999.99, "lifetime": 1499.99, "vip_1m": 299.99, "vip_3m": 759.99, "vip_6m": 1299.99, "vip_12m": 1999.99, "vip_lifetime": 2999.99, "class": 250, "discount": 0}'::jsonb,
  coin_packages    JSONB DEFAULT '[{"id":"coins_100","baseCoins":100,"bonusPercent":0,"bonusCoins":0,"coins":100,"priceEtb":30,"priceUsd":0.15},{"id":"coins_500","baseCoins":500,"bonusPercent":0,"bonusCoins":0,"coins":500,"priceEtb":150,"priceUsd":0.75},{"id":"coins_1000","baseCoins":1000,"bonusPercent":0,"bonusCoins":0,"coins":1000,"priceEtb":300,"priceUsd":1.50},{"id":"coins_3000","baseCoins":3000,"bonusPercent":3,"bonusCoins":90,"coins":3090,"priceEtb":900,"priceUsd":4.50,"discount":"+3% BONUS"},{"id":"coins_5000","baseCoins":5000,"bonusPercent":5,"bonusCoins":250,"coins":5250,"priceEtb":1500,"priceUsd":7.50,"discount":"+5% BONUS"},{"id":"coins_7000","baseCoins":7000,"bonusPercent":7,"bonusCoins":490,"coins":7490,"priceEtb":2100,"priceUsd":10.50,"discount":"+7% BONUS"},{"id":"coins_10000","baseCoins":10000,"bonusPercent":10,"bonusCoins":1000,"coins":11000,"priceEtb":3000,"priceUsd":15.00,"discount":"+10% BONUS"}]'::jsonb,
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
