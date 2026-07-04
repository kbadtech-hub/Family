-- =========================================================================
-- DYNAMIC GIFT CATALOG & PHYSICAL DELIVERY UPGRADES
-- VERSION: 2.1
-- DATE: 2026-07-04
-- DESCRIPTION: Adds dynamic gift catalog table and upgrades gifts table 
--              to support custom message and physical delivery options.
-- =========================================================================

-- 1. DYNAMIC GIFT CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.gift_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_am TEXT NOT NULL,
  name_om TEXT NOT NULL,
  name_ti TEXT NOT NULL,
  name_so TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  image_url TEXT NOT NULL,
  coin_price NUMERIC NOT NULL CHECK (coin_price > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. UPGRADE GIFTS TABLE
ALTER TABLE public.gifts 
  ADD COLUMN IF NOT EXISTS catalog_gift_id UUID REFERENCES public.gift_catalog(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'none' CHECK (delivery_status IN ('none', 'requested', 'processing', 'delivered', 'failed')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR GIFT CATALOG
CREATE POLICY "Public Read Access for Gift Catalog"
  ON public.gift_catalog FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin CRUD Access for Gift Catalog"
  ON public.gift_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 5. GRANTS
GRANT SELECT ON public.gift_catalog TO authenticated;

-- 6. SEED DATA FOR GIFT CATALOG
INSERT INTO public.gift_catalog (id, name_en, name_am, name_om, name_ti, name_so, name_ar, image_url, coin_price) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Habesha Coffee Sini', 'የሀበሻ ሲኒ', 'Sini Buna Habeshaa', 'ፅዋ ቡን ሓበሻ', 'Koobka Bunka Xabashida', 'فنجان قهوة حبشية', 'sini_coffee', 20),
  ('22222222-2222-2222-2222-222222222222', 'Habesha Flower', 'የማር አበባ', 'Abaaroo Habeshaa', 'ዕምባባ ሓበሻ', 'Ubaxa Xabashida', 'وردة حبشية', 'habesha_flower', 50),
  ('33333333-3333-3333-3333-333333333333', 'Shamma Candle', 'የፍቅር ሻማ', 'Shamaa Habeshaa', 'ሽምዓ ሓበሻ', 'Shamaa Xabashida', 'شمعة حبشية', 'shamma_candle', 15),
  ('44444444-4444-4444-4444-444444444444', 'Jebena Pot', 'የሀበሻ ጀበና', 'Jabanaa Habeshaa', 'ጀበና ሓበሻ', 'Kettle Xabashida', 'جبنة حبشية', 'jebena_pot', 100)
ON CONFLICT (id) DO NOTHING;
