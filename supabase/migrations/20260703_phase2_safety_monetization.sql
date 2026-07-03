-- =========================================================================
-- PHASE-2 SAFETY & MONETIZATION SCHEMA MIGRATIONS
-- VERSION: 2.1
-- DATE: 2026-07-03
-- DESCRIPTION: Creates ledger-backed virtual coin wallets, adds missing
--              indexes for reports/blocks/friendships, and sets up RLS policies.
-- =========================================================================

-- 0. ADD COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enable_abushakir BOOLEAN DEFAULT TRUE;

-- 1. WALLET TABLES
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  coin_balance NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL, -- positive for credit, negative for debit
  type TEXT NOT NULL CHECK (type IN ('purchase', 'gift_send', 'gift_receive', 'admin_adjustment')),
  reference_id UUID, -- links to payments or gifts table if applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR WALLETS (Read-only for users)
CREATE POLICY "Users can view own wallet balance"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. GRANTS
GRANT SELECT ON public.user_wallets TO authenticated;
GRANT SELECT ON public.coin_transactions TO authenticated;

-- 5. LEDGER TRIGGER FOR WALLET BALANCE
-- Automatically adjusts user_wallets when a coin transaction is recorded.
CREATE OR REPLACE FUNCTION public.handle_coin_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, NOW())
  ON CONFLICT (id) DO UPDATE
  SET coin_balance = public.user_wallets.coin_balance + NEW.amount,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_coin_transaction_inserted
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_coin_transaction();

-- 6. AUTOMATIC WALLET CREATION FOR NEW PROFILES
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Backfill existing profiles
INSERT INTO public.user_wallets (id, coin_balance)
SELECT id, 0 FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_friendships_sender_receiver ON public.friendships(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_reported ON public.reports(reporter_id, reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON public.blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
