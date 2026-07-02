-- ============================================================
-- Beteseb Admin Helper Views
-- Date: 2026-07-02
-- ============================================================

-- Overview of all users with computed tier
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.country,
  p.region,
  p.premium_until,
  p.is_verified,
  p.is_locked,
  CASE
    WHEN p.is_locked THEN 'locked'
    WHEN p.premium_until IS NOT NULL AND p.premium_until > NOW() THEN 'premium'
    ELSE 'free'
  END AS tier,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;

-- Pending and pending_review payments needing admin action
CREATE OR REPLACE VIEW admin_pending_payments AS
SELECT
  pay.id,
  pay.user_id,
  p.full_name,
  p.email,
  p.phone,
  p.region,
  pay.plan_type,
  pay.amount,
  pay.currency,
  pay.status,
  pay.receipt_url,
  pay.created_at
FROM public.payments pay
JOIN public.profiles p ON p.id = pay.user_id
WHERE pay.status IN ('pending', 'pending_review')
ORDER BY pay.created_at DESC;

-- Revenue summary by currency
CREATE OR REPLACE VIEW admin_revenue_summary AS
SELECT
  currency,
  COUNT(*) AS total_payments,
  SUM(amount) AS total_amount,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  SUM(amount) FILTER (WHERE status = 'approved') AS approved_amount,
  COUNT(*) FILTER (WHERE status IN ('pending', 'pending_review')) AS pending_count
FROM public.payments
GROUP BY currency;
