-- =========================================================================
-- Migration 21: Fix Gifts RLS, Coin Transactions & Gift Conversion Economy
-- =========================================================================

-- 1. Enable RLS and add policies for coin_transactions
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own coin transactions" ON public.coin_transactions;
CREATE POLICY "Users can insert own coin transactions"
  ON public.coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Add Gift conversion columns if not present
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS conversion_fee NUMERIC DEFAULT 0;
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS net_coins_received NUMERIC DEFAULT 0;

-- 3. Enable RLS and add policies for gifts table
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view gifts they sent or received" ON public.gifts;
CREATE POLICY "Users can view gifts they sent or received"
  ON public.gifts FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send gifts" ON public.gifts;
CREATE POLICY "Users can send gifts"
  ON public.gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received gifts" ON public.gifts;
CREATE POLICY "Users can update received gifts"
  ON public.gifts FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 4. Grants
GRANT ALL ON public.coin_transactions TO authenticated;
GRANT ALL ON public.gifts TO authenticated;
GRANT ALL ON public.user_wallets TO authenticated;
