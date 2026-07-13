-- Migration: Create wedding_vendors table and add initial seed data
CREATE TABLE IF NOT EXISTS public.wedding_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Venue', 'Photography', 'Decor', 'Styling'
  rating NUMERIC(3, 2) DEFAULT 5.0,
  location VARCHAR(255),
  contact VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.wedding_vendors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated and anonymous read-only access (public vendors)
CREATE POLICY "Allow public read access to wedding_vendors" 
  ON public.wedding_vendors 
  FOR SELECT 
  USING (true);

-- Seed initial vendor records
INSERT INTO public.wedding_vendors (name, category, rating, location, contact)
VALUES 
  ('Sheraton Addis Grand Ballroom', 'Venue', 4.9, 'Addis Ababa', '+251115171717'),
  ('Skyline Hotel Event Hall', 'Venue', 4.8, 'Addis Ababa', '+251116676000'),
  ('Simien Studio Cinema', 'Photography', 4.9, 'Addis Ababa & Gondar', '+251911223344'),
  ('Habesha Bridal Decor & Flowers', 'Decor', 4.7, 'Addis Ababa', '+251922334455'),
  ('Lucy Traditional Bridal Salon', 'Styling', 4.8, 'Addis Ababa', '+251933445566')
ON CONFLICT DO NOTHING;
