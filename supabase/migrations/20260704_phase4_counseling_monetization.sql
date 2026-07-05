-- =========================================================================
-- PHASE-4 SYSTEM EXPANSION: COUNSELOR ROOMS, SMS QUEUE & MONETIZATION
-- VERSION: 1.0
-- DATE: 2026-07-04
-- =========================================================================

-- 1. EXTEND COUNSELOR BOOKINGS WITH MONETIZATION AND ROOM FIELDS
ALTER TABLE public.counselor_bookings 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('coins', 'chapa', 'stripe')),
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 2. SMS NOTIFICATION QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.sms_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and grants
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sms_queue TO authenticated;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sms_queue' AND policyname = 'Admin full access for SMS queue'
  ) THEN
    CREATE POLICY "Admin full access for SMS queue" ON public.sms_queue FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
  END IF;
END
$$;
