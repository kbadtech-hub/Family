-- =========================================================================
-- PHASE-4 SYSTEM EXPANSION: ADVANCED GIFT CATALOG AND GAMIFIED UNLOCKS
-- VERSION: 1.0
-- DATE: 2026-07-04
-- =========================================================================

-- 1. ADD COLUMNS FOR GAMIFIED UNLOCKS AND COMMISSIONS TO gift_catalog
ALTER TABLE public.gift_catalog 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'cultural' CHECK (category IN ('cultural', 'pets', 'flowers', 'coupons')),
  ADD COLUMN IF NOT EXISTS unlock_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,2) DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS base_delivery_fee NUMERIC(10,2) DEFAULT 0.00;

-- 2. ADD COLUMN FOR CUSTOM DELIVERY DATA TO gifts TABLE
ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT '{}';

-- 3. UPDATE PREVIOUS SEEDS TO HAVE CATEGORIES AND UNLOCK LEVELS
UPDATE public.gift_catalog SET category = 'cultural', unlock_level = 1 WHERE image_url IN ('sini_coffee', 'shamma_candle');
UPDATE public.gift_catalog SET category = 'flowers', unlock_level = 1 WHERE image_url = 'habesha_flower';
UPDATE public.gift_catalog SET category = 'cultural', unlock_level = 2 WHERE image_url = 'jebena_pot';

-- 4. INSERT NEW LUXURY AND EXPERIENTIAL VENDOR ITEMS
INSERT INTO public.gift_catalog (id, name_en, name_am, name_om, name_ti, name_so, name_ar, image_url, coin_price, category, unlock_level, commission_rate, base_delivery_fee) VALUES
  -- Category 1: Pets & Animals (Unlock Level 4 - requires 30 messages)
  ('55555555-5555-5555-5555-555555555555', 'Romantic Love Doves', 'የፍቅር እርግቦች', 'Guutoo jaalalaa', 'ርግብታት ፍቕሪ', 'Flutter Dove', 'حمام الحب الرومانسي', 'love_doves', 150, 'pets', 4, 0.20, 30.00),
  ('66666666-6666-6666-6666-666666666666', 'Luxury Poodle Puppy', 'የቅንጦት ቡችላ (ፖፒ)', 'Saree Luxury', 'ቅንጡ ዕትብት', 'Ey puppy', 'جرو بودል فاخر', 'luxury_puppy', 500, 'pets', 4, 0.25, 150.00),
  ('77777777-7777-7777-7777-777777777777', 'Luxury Kitten Cat', 'የቅንጦት ድመት', 'Bashoo Luxury', 'ቅንጡ ድሙ', 'Bas pussy', 'قطة فاخرة', 'luxury_kitten', 400, 'pets', 4, 0.25, 100.00),
  
  -- Category 2: Luxury Flowers (Unlock Level 2 - requires 5 messages)
  ('88888888-8888-8888-8888-888888888888', 'Premium Boxed Flowers', 'በቅንጡ ሳጥን አበባዎች', 'Abaaroo Luxury Box', 'ዕምባባታት ፅኑዕ ሳንዱቕ', 'Ubax Boxed', 'أزهار فاخرة مغلفة', 'boxed_flowers', 80, 'flowers', 2, 0.15, 20.00),

  -- Category 3: Traditional Wear & Accessories (Unlock Level 3 - requires 15 messages)
  ('99999999-9999-9999-9999-999999999999', 'Modern Habesha Couple Outfit', 'የጥንዶች ባህል ልብስ', 'Uffata Aadaa Habeshaa', 'ባህላዊ አልባሳት ሓበሻ', 'Kappo Outfit', 'أزهار تقليدية عصرية للزوجين', 'cultural_outfit', 300, 'cultural', 3, 0.20, 50.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Engraved Silver Bracelet', 'ስም የሚቀረጽበት የብር አንባር', 'Gimbii meetii', 'አንባር ብሩር', 'bracelet', 'سوار فضي محفور', 'silver_bracelet', 150, 'cultural', 3, 0.15, 15.00),

  -- Category 4: Experience & Date Coupons (Unlock Level 2 - requires 5 messages)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Dinner & Cinema Voucher', 'የእራት እና ሲኒማ ኩፖን', 'Kupoonii irbaataa fi sinimaa', 'ኩፖን ድራርን ሲነማን', 'Premium Date Voucher', 'قسيمة عشاء وسينما مميزة', 'date_voucher', 100, 'coupons', 2, 0.15, 0.00)
ON CONFLICT (id) DO NOTHING;
