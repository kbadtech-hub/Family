-- Migration: Add User Privacy Toggles and Profile Unlocks System
-- Date: 2026-07-13

-- 1. Add privacy settings columns to public.profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS show_city BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE NOT NULL;

-- 2. Create profile_unlocks table to track unlocked profiles (monetization & locks)
CREATE TABLE IF NOT EXISTS public.profile_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, target_id)
);

-- 3. Enable RLS on profile_unlocks
ALTER TABLE public.profile_unlocks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for profile_unlocks
CREATE POLICY "Users can view own unlocks" 
  ON public.profile_unlocks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocks" 
  ON public.profile_unlocks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. Grant permissions on profile_unlocks
GRANT SELECT, INSERT ON public.profile_unlocks TO authenticated;
GRANT SELECT, INSERT ON public.profile_unlocks TO service_role;

-- 6. Create RPC function to unlock profile and deduct coins securely
CREATE OR REPLACE FUNCTION public.unlock_profile_with_coins(target_user_id UUID, cost_coins INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  caller_id UUID;
  caller_coins INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  -- Bypasses for self-unlock
  IF caller_id = target_user_id THEN
    RETURN TRUE;
  END IF;

  -- Check if already unlocked
  IF EXISTS (SELECT 1 FROM public.profile_unlocks WHERE user_id = caller_id AND target_id = target_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Check current balance in user_wallets
  SELECT coin_balance INTO caller_coins FROM public.user_wallets WHERE id = caller_id;
  IF caller_coins IS NULL OR caller_coins < cost_coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Deduct coins (inserts a coin_transaction, which triggers the wallet balance update)
  INSERT INTO public.coin_transactions (user_id, amount, type, note)
  VALUES (caller_id, -cost_coins, 'admin_adjustment', 'Profile Unlock Cost')
  ON CONFLICT DO NOTHING;

  -- Insert profile_unlock record
  INSERT INTO public.profile_unlocks (user_id, target_id)
  VALUES (caller_id, target_user_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
