-- =========================================================================
-- BETESEB PLATFORM — MODULE 12: ADMIN ACCESS RLS POLICIES
-- =========================================================================
-- This migration grants authenticated admin users SELECT/ALL access to
-- verifications, payments, support tickets, and bookings so that 
-- their real-time client-side listeners can receive updates.
-- =========================================================================

-- Helper function to check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Verifications Table — Allow admins to select/update all verifications
DROP POLICY IF EXISTS "Admin Verification Access" ON public.verifications;
CREATE POLICY "Admin Verification Access" 
  ON public.verifications 
  FOR ALL 
  USING (public.is_admin());

-- 2. Payments Table — Allow admins to view/update all payments
DROP POLICY IF EXISTS "Admin Payments Access" ON public.payments;
CREATE POLICY "Admin Payments Access" 
  ON public.payments 
  FOR ALL 
  USING (public.is_admin());

-- 3. Support Tickets — Allow admins to view/update all support tickets
DROP POLICY IF EXISTS "Admin Tickets Access" ON public.support_tickets;
CREATE POLICY "Admin Tickets Access" 
  ON public.support_tickets 
  FOR ALL 
  USING (public.is_admin());

-- 4. Counselor Bookings — Allow admins to view/update all bookings
DROP POLICY IF EXISTS "Admin Bookings Access" ON public.counselor_bookings;
CREATE POLICY "Admin Bookings Access" 
  ON public.counselor_bookings 
  FOR ALL 
  USING (public.is_admin());
