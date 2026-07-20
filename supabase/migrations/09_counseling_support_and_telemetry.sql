-- =========================================================================
-- BETESEB PLATFORM — MODULE 09: COUNSELING, SUPPORT & AUDIT LOGS
-- =========================================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.counselor_bookings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expert_name    TEXT NOT NULL,
  topic          TEXT NOT NULL CHECK (topic IN ('Pre-Marriage', 'Finance', 'Conflict Resolution', 'General')),
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('coins', 'chapa', 'stripe')),
  amount_paid    NUMERIC(10,2),
  currency       TEXT DEFAULT 'USD',
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject       TEXT DEFAULT 'Support Request',
  message       TEXT NOT NULL,
  status        VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  ticket_number VARCHAR(50),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.support_replies (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id  UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  admin_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.resolved_kb (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id  UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  question   TEXT NOT NULL,
  solution   TEXT NOT NULL,
  locale     VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sms_queue (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message   TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.call_violations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  violation_type TEXT,
  room_id        TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.counselor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_replies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolved_kb        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_queue          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_violations    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own counselor bookings" ON public.counselor_bookings;
CREATE POLICY "Users can manage own counselor bookings" ON public.counselor_bookings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access for bookings" ON public.counselor_bookings;
CREATE POLICY "Admin full access for bookings" ON public.counselor_bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
CREATE POLICY "Users can create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access to tickets" ON public.support_tickets;
CREATE POLICY "Admin full access to tickets" ON public.support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Users can view replies to own tickets" ON public.support_replies;
CREATE POLICY "Users can view replies to own tickets" ON public.support_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin full access to replies" ON public.support_replies;
CREATE POLICY "Admin full access to replies" ON public.support_replies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Public read resolved_kb" ON public.resolved_kb;
CREATE POLICY "Public read resolved_kb" ON public.resolved_kb FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert resolved_kb" ON public.resolved_kb;
CREATE POLICY "Admin insert resolved_kb" ON public.resolved_kb FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Admin full access for SMS queue" ON public.sms_queue;
CREATE POLICY "Admin full access for SMS queue" ON public.sms_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Admin view call violations" ON public.call_violations;
CREATE POLICY "Admin view call violations" ON public.call_violations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Service role insert call violations" ON public.call_violations;
CREATE POLICY "Service role insert call violations" ON public.call_violations FOR INSERT WITH CHECK (true);

-- 3. Grants & Indexes
GRANT ALL ON public.counselor_bookings TO authenticated, service_role;
GRANT SELECT, INSERT ON public.support_tickets TO authenticated, service_role;
GRANT SELECT ON public.support_replies TO authenticated, service_role;
GRANT SELECT ON public.resolved_kb TO authenticated, anon, service_role;
GRANT ALL ON public.sms_queue TO authenticated, service_role;
GRANT ALL ON public.call_violations TO service_role;

CREATE INDEX IF NOT EXISTS idx_counselor_bookings_user_id ON public.counselor_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_counselor_bookings_status  ON public.counselor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id    ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_resolved_kb_locale         ON public.resolved_kb(locale);
CREATE INDEX IF NOT EXISTS idx_call_violations_caller_id  ON public.call_violations(caller_id);
CREATE INDEX IF NOT EXISTS idx_sms_queue_status           ON public.sms_queue(status);
