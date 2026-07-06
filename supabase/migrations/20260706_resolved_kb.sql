-- Create Resolved KB table for AI chatbot learning and add ticket_number to support_tickets
CREATE TABLE IF NOT EXISTS public.resolved_kb (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID,
  question TEXT NOT NULL,
  solution TEXT NOT NULL,
  locale VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure support_tickets exists and has ticket_number
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  ticket_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.support_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add ticket_number column if not exists (for existing support_tickets table)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='support_tickets' AND column_name='ticket_number') THEN
    ALTER TABLE public.support_tickets ADD COLUMN ticket_number VARCHAR(50);
  END IF;
END $$;
