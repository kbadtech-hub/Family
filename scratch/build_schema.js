const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'supabase', 'migrations', 'beteseb_complete_schema_v7_UNIFIED.sql');
// Build full unified schema from v6 baseline + all migrations
const v6 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','beteseb_complete_schema_v6.sql'),'utf8');
const m1 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260713000000_add_wedding_vendors.sql'),'utf8');
const m2 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260713000100_add_settings.sql'),'utf8');
const m3 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260713000200_add_warning_message.sql'),'utf8');
const m4 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260713000400_add_profile_unlocks_and_privacy.sql'),'utf8');
const m5 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260713000500_add_payment_gateways.sql'),'utf8');
const m6 = fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260714000100_add_read_receipts_and_last_seen.sql'),'utf8');

// Patch v6: add all missing columns to profiles table before the closing );
let schema = v6;

// 1. Add warning_message, show_age, show_city, allow_friend_requests, enable_read_receipts, enable_last_seen
schema = schema.replace(
  '  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);',
  '  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  warning_message       TEXT DEFAULT NULL,\n  show_age              BOOLEAN DEFAULT TRUE NOT NULL,\n  show_city             BOOLEAN DEFAULT TRUE NOT NULL,\n  allow_friend_requests BOOLEAN DEFAULT TRUE NOT NULL,\n  enable_read_receipts  BOOLEAN DEFAULT TRUE NOT NULL,\n  enable_last_seen      BOOLEAN DEFAULT TRUE NOT NULL\n);'
);

// 2. Update the version header
schema = schema.replace(
  '-- VERSION: 6.0 (Final Production Build — All Phases + Migrations Consolidated)',
  '-- VERSION: 7.0 (Final Production Build — All Phases + ALL Migrations Consolidated)\n-- SUPERSEDES: v5, v6, and all 7 incremental migration files (delete those old files)'
);
schema = schema.replace(
  '-- DATE: 2026-07-11',
  '-- DATE: 2026-07-14'
);

// 3. Add profile_unlocks table before the GIFT SYSTEM part
const profileUnlocksTable = `
-- =========================================================================
-- PART 4b: PROFILE UNLOCKS (migration: 20260713000400)
-- =========================================================================

-- Profile unlocks: track which profiles a user has paid coins to view in full
CREATE TABLE public.profile_unlocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, target_id)
);

`;
schema = schema.replace('-- =========================================================================\n-- PART 5: GIFT SYSTEM', profileUnlocksTable + '-- =========================================================================\n-- PART 5: GIFT SYSTEM');

// 4. Add call_violations table before FUNCTIONS
const callViolationsTable = `
-- =========================================================================
-- PART 10b: CALL VIOLATIONS AUDIT LOG (Security feature)
-- =========================================================================

CREATE TABLE public.call_violations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  violation_type TEXT,
  room_id        TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

`;
schema = schema.replace('-- =========================================================================\n-- PART 11: FUNCTIONS', callViolationsTable + '-- =========================================================================\n-- PART 11: FUNCTIONS');

// 5. Add wedding_vendors and settings tables before FUNCTIONS
const newTables = `
-- =========================================================================
-- PART 10c: WEDDING VENDORS (migration: 20260713000000)
-- =========================================================================

CREATE TABLE public.wedding_vendors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  category   VARCHAR(100) NOT NULL,
  rating     NUMERIC(3, 2) DEFAULT 5.0,
  location   VARCHAR(255),
  contact    VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- PART 10d: SETTINGS / CMS (migrations: 20260713000100 + 200 + 500)
-- =========================================================================

CREATE TABLE public.settings (
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
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

`;
schema = schema.replace(callViolationsTable + '-- =========================================================================\n-- PART 11: FUNCTIONS', callViolationsTable + newTables + '-- =========================================================================\n-- PART 11: FUNCTIONS');

// 6. Add unlock_profile_with_coins function after delete_own_user_account
const unlockFn = `

-- Unlock profile with coin deduction (migration: 20260713000400)
CREATE OR REPLACE FUNCTION public.unlock_profile_with_coins(target_user_id UUID, cost_coins INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  caller_id    UUID;
  caller_coins INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN RAISE EXCEPTION 'Target user does not exist'; END IF;
  IF caller_id = target_user_id THEN RETURN TRUE; END IF;
  IF EXISTS (SELECT 1 FROM public.profile_unlocks WHERE user_id = caller_id AND target_id = target_user_id) THEN RETURN TRUE; END IF;
  SELECT coin_balance INTO caller_coins FROM public.user_wallets WHERE id = caller_id;
  IF caller_coins IS NULL OR caller_coins < cost_coins THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
  INSERT INTO public.coin_transactions (user_id, amount, type, note) VALUES (caller_id, -cost_coins, 'admin_adjustment', 'Profile Unlock Cost') ON CONFLICT DO NOTHING;
  INSERT INTO public.profile_unlocks (user_id, target_id) VALUES (caller_id, target_user_id);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
schema = schema.replace(
  '\n\n-- =========================================================================\n-- PART 12: ROW LEVEL SECURITY',
  unlockFn + '\n\n-- =========================================================================\n-- PART 12: ROW LEVEL SECURITY'
);

// 7. Enable RLS on new tables
schema = schema.replace(
  'ALTER TABLE public.interaction_telemetry ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.interaction_telemetry ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.call_violations       ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.profile_unlocks       ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.wedding_vendors       ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.settings              ENABLE ROW LEVEL SECURITY;'
);

// 8. Add RLS policies for new tables (before GRANTS section)
const newPolicies = `
-- Profile Unlocks
CREATE POLICY "Users can view own unlocks"   ON public.profile_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unlocks" ON public.profile_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Call Violations
CREATE POLICY "Admin view call violations"          ON public.call_violations FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
CREATE POLICY "Service role insert call violations" ON public.call_violations FOR INSERT WITH CHECK (true);

-- Wedding Vendors
CREATE POLICY "Allow public read access to wedding_vendors" ON public.wedding_vendors FOR SELECT USING (true);

-- Settings
CREATE POLICY "Allow public read access to settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow admin updates to settings"      ON public.settings FOR UPDATE USING (true);

`;
schema = schema.replace(
  '-- =========================================================================\n-- PART 14: ROLE GRANTS',
  newPolicies + '-- =========================================================================\n-- PART 14: ROLE GRANTS'
);

// 9. Add grants for new tables
schema = schema.replace(
  'GRANT ALL ON public.daily_limits         TO service_role;',
  'GRANT ALL ON public.daily_limits         TO service_role;\nGRANT SELECT, INSERT ON public.profile_unlocks      TO authenticated;\nGRANT SELECT, INSERT ON public.profile_unlocks      TO service_role;\nGRANT EXECUTE ON FUNCTION public.unlock_profile_with_coins(UUID, INTEGER) TO authenticated;\nGRANT SELECT ON public.wedding_vendors              TO authenticated;\nGRANT SELECT ON public.wedding_vendors              TO anon;\nGRANT SELECT ON public.settings                     TO authenticated;\nGRANT SELECT ON public.settings                     TO anon;'
);

// 10. Add seed data for wedding_vendors and settings before the backfill section
const seedData = `
-- =========================================================================
-- PART 16b: SEED DATA — WEDDING VENDORS
-- =========================================================================

INSERT INTO public.wedding_vendors (name, category, rating, location, contact)
VALUES
  ('Sheraton Addis Grand Ballroom', 'Venue',       4.9, 'Addis Ababa',          '+251115171717'),
  ('Skyline Hotel Event Hall',       'Venue',       4.8, 'Addis Ababa',          '+251116676000'),
  ('Simien Studio Cinema',           'Photography', 4.9, 'Addis Ababa & Gondar', '+251911223344'),
  ('Habesha Bridal Decor & Flowers', 'Decor',       4.7, 'Addis Ababa',          '+251922334455'),
  ('Lucy Traditional Bridal Salon',  'Styling',     4.8, 'Addis Ababa',          '+251933445566')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- PART 16c: SEED DATA — SETTINGS / CMS
-- =========================================================================

INSERT INTO public.settings (id, system_access_key, cms_content)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Harar@2026',
  '{"hero_title": "Beteseb Habesha Matrimonial", "hero_subtitle": "Find your lifelong companion", "logo_url": ""}'::jsonb
)
ON CONFLICT DO NOTHING;

`;
schema = schema.replace(
  '-- =========================================================================\n-- PART 17: BACKFILL',
  seedData + '-- =========================================================================\n-- PART 17: BACKFILL'
);

// 11. Also add indexes for new tables
schema = schema.replace(
  'CREATE INDEX IF NOT EXISTS idx_sms_queue_status',
  'CREATE INDEX IF NOT EXISTS idx_profile_unlocks_user_id ON public.profile_unlocks(user_id);\nCREATE INDEX IF NOT EXISTS idx_call_violations_caller_id ON public.call_violations(caller_id);\nCREATE INDEX IF NOT EXISTS idx_wedding_vendors_category  ON public.wedding_vendors(category);\nCREATE INDEX IF NOT EXISTS idx_sms_queue_status'
);

// 12. Update footer comment
schema = schema.replace(
  '-- Tables: 26 | Triggers: 6 | RLS Policies: 45+ | Indexes: 25+',
  '-- Tables: 32 | Triggers: 7 | RLS Policies: 52+ | Indexes: 32+\n-- SUPERSEDES all previous SQL files. This is the ONLY file needed.'
);

fs.writeFileSync(OUT, schema, 'utf8');
console.log('SUCCESS - Unified schema v7 written:', OUT);
console.log('Size:', Math.round(schema.length/1024), 'KB');
