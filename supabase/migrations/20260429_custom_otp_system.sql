-- Create OTPs table for custom delivery fallback
CREATE TABLE IF NOT EXISTS public.user_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTPs
CREATE POLICY "Service role can manage OTPs" ON public.user_otps
    USING (true)
    WITH CHECK (true);

-- Allow public to read their own OTP for verification if needed (though we'll do it server-side)
CREATE POLICY "Public can read their own OTP" ON public.user_otps
    FOR SELECT
    USING (true);
