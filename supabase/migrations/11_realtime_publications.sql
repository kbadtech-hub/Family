-- =========================================================================
-- BETESEB PLATFORM — MODULE 11: REALTIME PUBLICATIONS
-- =========================================================================
-- This migration enables PostgreSQL replication for all tables that use
-- Supabase Realtime subscriptions. Without this, client-side .channel()
-- listeners WILL NOT receive postgres_changes events.
-- =========================================================================

DO $$
DECLARE
  t text;
  tables_to_add text[] := ARRAY[
    'verifications',
    'payments',
    'support_tickets',
    'counselor_bookings',
    'messages',
    'friendships',
    'wali_messages',
    'profiles',
    'call_violations',
    'interaction_telemetry',
    'vouch_records'
  ];
BEGIN
  -- Ensure the supabase_realtime publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Iteratively add each table to the publication if not already present
  FOREACH t IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
