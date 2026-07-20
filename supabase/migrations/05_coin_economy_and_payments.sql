-- =========================================================================
-- BETESEB PLATFORM — MODULE 05: COIN ECONOMY & PAYMENTS
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  coin_balance NUMERIC DEFAULT 0 NOT NULL,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount       NUMERIC NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('purchase', 'gift_send', 'gift_receive', 'coin_transfer', 'admin_adjustment')),
  reference_id UUID,
  note         TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type   TEXT NOT NULL,
  amount      NUMERIC NOT NULL,
  currency    TEXT DEFAULT 'ETB',
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  receipt_url TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Functions & Triggers
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_create_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

CREATE OR REPLACE FUNCTION public.handle_coin_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_wallets (id, coin_balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, NOW())
  ON CONFLICT (id) DO UPDATE
  SET coin_balance = public.user_wallets.coin_balance + NEW.amount,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_coin_transaction_inserted ON public.coin_transactions;
CREATE TRIGGER on_coin_transaction_inserted
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_coin_transaction();

-- 3. Row Level Security
ALTER TABLE public.user_wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet" ON public.user_wallets FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own Payment Access" ON public.payments;
CREATE POLICY "Own Payment Access" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- 4. Grants & Indexes
GRANT SELECT ON public.user_wallets TO authenticated;
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT ALL PRIVILEGES ON public.user_wallets TO service_role;
GRANT ALL PRIVILEGES ON public.coin_transactions TO service_role;
GRANT ALL PRIVILEGES ON public.payments TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type    ON public.coin_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payments_user_id          ON public.payments(user_id);
