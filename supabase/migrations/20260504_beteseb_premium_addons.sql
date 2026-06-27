-- ==========================================
-- BETESEB PREMIUM ADDONS MIGRATION (v4.0)
-- AUTHOR: Antigravity AI
-- DATE: 2026-05-04
-- ==========================================

-- 1. ADD VIDEO SELFIE COLUMN TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS video_selfie_url TEXT;

-- 2. CREATE GUARDIANS TABLE (Mize/Mediator System)
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_email TEXT,
  guardian_phone TEXT,
  access_code TEXT DEFAULT substr(md5(random()::text), 1, 6), -- 6-character code for guardian login
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE GIFTS TABLE (Cultural Micro-Gifts System)
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_type TEXT CHECK (gift_type IN ('sini_coffee', 'habesha_flower', 'shamma_candle', 'jebena_pot')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SECURITY (RLS)
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own guardians" 
  ON public.guardians FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view gifts they sent or received" 
  ON public.gifts FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send gifts" 
  ON public.gifts FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- 5. GRANTS
GRANT ALL ON public.guardians TO authenticated;
GRANT ALL ON public.gifts TO authenticated;
