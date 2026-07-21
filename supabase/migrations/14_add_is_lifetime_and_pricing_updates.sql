-- =========================================================================
-- BETESEB PLATFORM — MODULE 14: IS_LIFETIME & PSYCHOLOGICAL PRICING UPDATES
-- =========================================================================

-- 1. Add is_lifetime column to public.profiles table if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Update default settings with finalized psychological pricing (.99 charm pricing)
UPDATE public.settings
SET 
  pricing_etb = '{
    "1m": 149.99,
    "3m": 379.99,
    "6m": 649.99,
    "12m": 999.99,
    "lifetime": 1499.99,
    "vip_1m": 299.99,
    "vip_3m": 759.99,
    "vip_6m": 1299.99,
    "vip_12m": 1999.99,
    "vip_lifetime": 2999.99,
    "class": 250,
    "discount": 0
  }'::jsonb,
  pricing_usd = '{
    "1m": 7.99,
    "3m": 19.99,
    "6m": 33.99,
    "12m": 49.99,
    "lifetime": 74.99,
    "vip_1m": 15.99,
    "vip_3m": 39.99,
    "vip_6m": 67.99,
    "vip_12m": 99.99,
    "vip_lifetime": 149.99,
    "class": 25,
    "discount": 0
  }'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000000';
