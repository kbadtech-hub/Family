-- ==========================================
-- BETESEB FRIENDSHIP SYSTEM (v1.0)
-- AUTHOR: Antigravity AI
-- DATE: 2026-05-03
-- ==========================================

-- 1. CREATE FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- 2. SECURITY (RLS)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" 
  ON public.friendships FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
  ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests" 
  ON public.friendships FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- 3. GRANTS
GRANT ALL ON public.friendships TO authenticated;

-- 4. FUNCTION TO AUTO-REFRESH UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
