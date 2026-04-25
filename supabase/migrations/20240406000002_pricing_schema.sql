-- Pricing Schema Update: Currency Locking & Economic Fairness

-- 1. Add currency and trial fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS currency_locked text CHECK (currency_locked IN ('ETB', 'USD')),
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- 2. Add USD and ETB pricing objects to settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS pricing_usd jsonb DEFAULT '{"1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25}'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_etb jsonb DEFAULT '{"1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250}'::jsonb;

-- 3. Comments for clarity
COMMENT ON COLUMN public.profiles.currency_locked IS 'Locked currency for user (ETB for Ethiopia, USD for Diaspora)';
COMMENT ON COLUMN public.profiles.trial_ends_at IS '3-day trial period expiration timestamp';
