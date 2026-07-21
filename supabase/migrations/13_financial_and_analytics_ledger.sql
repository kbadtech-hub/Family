-- =========================================================================
-- BETESEB PLATFORM — MODULE 13: IMMUTABLE FINANCIAL LEDGER & RETENTION
-- =========================================================================

-- 1. Create Immutable Financial Master Ledger Table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_ref               TEXT UNIQUE,
  user_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name_snapshot   TEXT NOT NULL DEFAULT 'Unknown User',
  user_email_snapshot  TEXT,
  revenue_source       TEXT NOT NULL CHECK (revenue_source IN (
    'subscription_vip', 
    'subscription_premium', 
    'coin_sale', 
    'course_sale', 
    'counseling_sale', 
    'gift_purchase', 
    'profile_unlock', 
    'other'
  )),
  payment_gateway      TEXT NOT NULL CHECK (payment_gateway IN (
    'chapa', 
    'play_store', 
    'app_store', 
    'telebirr', 
    'stripe', 
    'paypal', 
    'bank_transfer', 
    'coin_balance', 
    'manual_admin'
  )),
  currency             TEXT NOT NULL CHECK (currency IN ('ETB', 'USD', 'COINS')),
  gross_amount         NUMERIC NOT NULL DEFAULT 0,
  gateway_fee          NUMERIC NOT NULL DEFAULT 0,
  net_amount           NUMERIC NOT NULL DEFAULT 0,
  payment_status       TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('completed', 'pending', 'failed', 'refunded')),
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for Performance & Instant Audit Searches
CREATE INDEX IF NOT EXISTS idx_financial_tx_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_tx_revenue_source ON public.financial_transactions(revenue_source);
CREATE INDEX IF NOT EXISTS idx_financial_tx_payment_gateway ON public.financial_transactions(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_financial_tx_currency ON public.financial_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_financial_tx_status ON public.financial_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_financial_tx_created_at ON public.financial_transactions(created_at);

-- 3. Row Level Security Policies
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select financial transactions" ON public.financial_transactions;
CREATE POLICY "Admins can select financial transactions" ON public.financial_transactions 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins can insert financial transactions" ON public.financial_transactions;
CREATE POLICY "Admins can insert financial transactions" ON public.financial_transactions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins can update financial transactions" ON public.financial_transactions;
CREATE POLICY "Admins can update financial transactions" ON public.financial_transactions 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

GRANT ALL PRIVILEGES ON public.financial_transactions TO authenticated, service_role;

-- 4. Strict Financial Retention & Immutable User Account Deletion Trigger
CREATE OR REPLACE FUNCTION public.preserve_financial_ledger_on_user_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- When a profile is being deleted, snapshot user name as "Deleted User (<name>)"
  -- and un-link user_id so financial transactions are 100% retained forever without CASCADE DELETE errors.
  UPDATE public.financial_transactions
  SET user_name_snapshot = 'Deleted User (' || COALESCE(OLD.full_name, OLD.email, 'User') || ')',
      user_id = NULL
  WHERE user_id = OLD.id;

  -- Also detach payments table user_id so existing payments table does not drop records if set to cascade
  UPDATE public.payments
  SET user_id = NULL
  WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_preserve_financial_ledger ON public.profiles;
CREATE TRIGGER trg_preserve_financial_ledger
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.preserve_financial_ledger_on_user_delete();

-- 5. Backfill Procedure: Sync existing payments table records into financial_transactions
INSERT INTO public.financial_transactions (
  tx_ref,
  user_id,
  user_name_snapshot,
  user_email_snapshot,
  revenue_source,
  payment_gateway,
  currency,
  gross_amount,
  gateway_fee,
  net_amount,
  payment_status,
  created_at
)
SELECT
  p.id::text AS tx_ref,
  p.user_id,
  COALESCE(prof.full_name, prof.email, 'Unknown User') AS user_name_snapshot,
  prof.email AS user_email_snapshot,
  CASE
    WHEN p.plan_type LIKE 'vip%' THEN 'subscription_vip'
    WHEN p.plan_type LIKE 'coins%' THEN 'coin_sale'
    ELSE 'subscription_premium'
  END AS revenue_source,
  CASE
    WHEN p.receipt_url LIKE '%Chapa%' THEN 'chapa'
    WHEN p.receipt_url LIKE '%Google%' OR p.receipt_url LIKE '%Play%' THEN 'play_store'
    WHEN p.receipt_url LIKE '%Apple%' OR p.receipt_url LIKE '%AppStore%' THEN 'app_store'
    ELSE 'bank_transfer'
  END AS payment_gateway,
  COALESCE(p.currency, 'ETB') AS currency,
  p.amount AS gross_amount,
  CASE
    WHEN p.receipt_url LIKE '%Chapa%' THEN ROUND(p.amount * 0.035, 2)
    WHEN p.receipt_url LIKE '%Google%' OR p.receipt_url LIKE '%Apple%' THEN ROUND(p.amount * 0.15, 2)
    ELSE 0
  END AS gateway_fee,
  p.amount - CASE
    WHEN p.receipt_url LIKE '%Chapa%' THEN ROUND(p.amount * 0.035, 2)
    WHEN p.receipt_url LIKE '%Google%' OR p.receipt_url LIKE '%Apple%' THEN ROUND(p.amount * 0.15, 2)
    ELSE 0
  END AS net_amount,
  CASE
    WHEN p.status = 'approved' THEN 'completed'
    WHEN p.status = 'rejected' THEN 'failed'
    ELSE 'pending'
  END AS payment_status,
  p.created_at
FROM public.payments p
LEFT JOIN public.profiles prof ON prof.id = p.user_id
ON CONFLICT (tx_ref) DO NOTHING;
