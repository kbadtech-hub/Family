-- Add translations column to messages table to support AI Translation Bridge
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
-- Comment for documentation
COMMENT ON COLUMN public.messages.translations IS 'Stores AI-generated translations for the message content in multiple languages (am, om, ar, en).';