-- =========================================================================
-- BETESEB PLATFORM — MODULE 06: GIFT SYSTEM
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.gift_catalog (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en           TEXT NOT NULL,
  name_am           TEXT NOT NULL,
  name_om           TEXT NOT NULL,
  name_ti           TEXT NOT NULL,
  name_so           TEXT NOT NULL,
  name_ar           TEXT NOT NULL,
  image_url         TEXT NOT NULL,
  coin_price        NUMERIC NOT NULL CHECK (coin_price > 0),
  is_active         BOOLEAN DEFAULT TRUE,
  category          TEXT DEFAULT 'cultural' CHECK (category IN ('cultural', 'pets', 'flowers', 'coupons')),
  unlock_level      INTEGER DEFAULT 1,
  commission_rate   NUMERIC(4,2) DEFAULT 0.15,
  base_delivery_fee NUMERIC(10,2) DEFAULT 0.00,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gifts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_gift_id  UUID REFERENCES public.gift_catalog(id) ON DELETE SET NULL,
  gift_type        TEXT,
  amount           NUMERIC NOT NULL,
  currency         TEXT DEFAULT 'ETB',
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  message          TEXT,
  delivery_address TEXT,
  delivery_phone   TEXT,
  delivery_status  TEXT DEFAULT 'none' CHECK (delivery_status IN ('none', 'requested', 'processing', 'delivered', 'failed')),
  delivery_details JSONB DEFAULT '{}',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access for Gift Catalog" ON public.gift_catalog;
CREATE POLICY "Public Read Access for Gift Catalog" ON public.gift_catalog FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin CRUD Access for Gift Catalog" ON public.gift_catalog;
CREATE POLICY "Admin CRUD Access for Gift Catalog" ON public.gift_catalog FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Users can view gifts they sent or received" ON public.gifts;
CREATE POLICY "Users can view gifts they sent or received" ON public.gifts FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send gifts" ON public.gifts;
CREATE POLICY "Users can send gifts" ON public.gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users or admins can update gift delivery" ON public.gifts;
CREATE POLICY "Users or admins can update gift delivery" ON public.gifts FOR UPDATE USING (
  auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 3. Grants & Indexes
GRANT SELECT ON public.gift_catalog TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_gifts_sender_receiver ON public.gifts(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_gifts_delivery_status ON public.gifts(delivery_status);

-- 4. Seed Data
INSERT INTO public.gift_catalog (id, name_en, name_am, name_om, name_ti, name_so, name_ar, image_url, coin_price, category, unlock_level, commission_rate, base_delivery_fee) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Habesha Coffee Sini',     'የሀበሻ ሲኒ',            'Sini Buna Habeshaa',           'ፅዋ ቡን ሓበሻ',    'Koobka Bunka Xabashida', 'فنجان قهوة حبشية',         'sini_coffee',     20,  'cultural', 1, 0.15,   0.00),
  ('33333333-3333-3333-3333-333333333333', 'Shamma Candle',           'የፍቅር ሻማ',            'Shamaa Habeshaa',              'ሽምዓ ሓበሻ',      'Shamaa Xabashida',       'شمعة حبشية',               'shamma_candle',   15,  'cultural', 1, 0.15,   0.00),
  ('44444444-4444-4444-4444-444444444444', 'Jebena Pot',              'የሀበሻ ጀበና',            'Jabanaa Habeshaa',             'ጀበና ሓበሻ',      'Kettle Xabashida',       'جبنة حبشية',               'jebena_pot',      100, 'cultural', 2, 0.15,  10.00),
  ('22222222-2222-2222-2222-222222222222', 'Habesha Flower',          'የማር አበባ',             'Abaaroo Habeshaa',             'ዕምባባ ሓበሻ',    'Ubaxa Xabashida',        'وردة حبሽية',               'habesha_flower',  50,  'flowers',  1, 0.15,   0.00),
  ('88888888-8888-8888-8888-888888888888', 'Premium Boxed Flowers',   'በቅንጡ ሳጥን አበባዎች',    'Abaaroo Luxury Box',           'ዕምባባታት ፅኑዕ', 'Ubax Boxed',             'أزهار فاخرة مغلفة',        'boxed_flowers',   80,  'flowers',  2, 0.15,  20.00),
  ('55555555-5555-5555-5555-555555555555', 'Romantic Love Doves',     'የፍቅር እርግቦች',         'Guutoo jaalalaa',              'ርግብታት ፍቕሪ',   'Flutter Dove',           'حمام الحب الرومانسي',      'love_doves',      150, 'pets',     4, 0.20,  30.00),
  ('66666666-6666-6666-6666-666666666666', 'Luxury Poodle Puppy',     'የቅንጦት ቡችላ',          'Saree Luxury',                 'ቅንጡ ዕትብት',    'Ey puppy',               'جرو بودل فاخر',            'luxury_puppy',    500, 'pets',     4, 0.25, 150.00),
  ('77777777-7777-7777-7777-777777777777', 'Luxury Kitten Cat',       'የቅንጦት ድመት',          'Bashoo Luxury',                'ቅንጡ ድሙ',       'Bas pussy',              'قطة فاخرة',                'luxury_kitten',   400, 'pets',     4, 0.25, 100.00),
  ('99999999-9999-9999-9999-999999999999', 'Habesha Couple Outfit',   'የጥንዶች ባህል ልብስ',     'Uffata Aadaa Habeshaa',        'ባህላዊ አልባሳት',  'Kappo Outfit',           'أزهار تقليدية للزوجين',    'cultural_outfit', 300, 'cultural', 3, 0.20,  50.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Engraved Silver Bracelet','ስም ቀረጽ የብር አንባር',  'Gimbii meetii',                'አንባር ብሩር',    'bracelet',               'سوار فضي محفور',           'silver_bracelet', 150, 'cultural', 3, 0.15,  15.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Dinner & Cinema', 'የእራት እና ሲኒማ ኩፖን', 'Kupoonii irbaataa fi sinimaa', 'ኩፖን ድራርን ሲነማን','Premium Date Voucher',  'قسيمة عشاء وسينما مميزة',  'date_voucher',    100, 'coupons',  2, 0.15,   0.00)
ON CONFLICT (id) DO NOTHING;
