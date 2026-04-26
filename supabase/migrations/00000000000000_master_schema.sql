-- Total System Clean-up
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles (The Heart)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    language TEXT DEFAULT 'am',
    star_sign TEXT, -- Abushakir Star Signs
    is_diaspora BOOLEAN DEFAULT FALSE,
    is_onboarded BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Demographic details from Onboarding
    gender TEXT,
    religion TEXT,
    marital_status TEXT,
    job TEXT,
    education TEXT,
    birth_date DATE,
    birth_time TEXT,
    location TEXT,
    spouse_requirements TEXT,
    
    quiz_results JSONB DEFAULT '{}'::jsonb,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. verifications (Security)
CREATE TABLE public.verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_url TEXT NOT NULL, -- Matched to app code
    selfie_url TEXT NOT NULL,
    doc_type TEXT DEFAULT 'id',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. payments (Finance)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ETB',
    plan_type TEXT NOT NULL,
    screenshot_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. settings (Admin Control)
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    system_access_key TEXT DEFAULT 'Harar@2026',
    cms_content JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    slogans JSONB DEFAULT '[]'::jsonb,
    bank_details JSONB DEFAULT '{}'::jsonb,
    pricing_usd JSONB DEFAULT '{"1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25, "trial_days": 3}'::jsonb,
    pricing_etb JSONB DEFAULT '{"1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250, "trial_days": 3}'::jsonb,
    payment_toggles JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. matches (AI & Manual pairing)
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_one_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_two_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'rejected')),
    match_type TEXT NOT NULL CHECK (match_type IN ('ai', 'manual')),
    score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_match_pair UNIQUE (user_one_id, user_two_id)
);

-- 6. messages (Real-time chat)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    translation_metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Verifications Policies
CREATE POLICY "Users can view own verifications." ON public.verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications." ON public.verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments Policies
CREATE POLICY "Users can view own payments." ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments." ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings Policies (Global)
CREATE POLICY "Settings are viewable by everyone." ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Super admins can update settings." ON public.settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Matches Policies
CREATE POLICY "Users can view their own matches." ON public.matches
    FOR SELECT USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their matches." ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE id = match_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages in their matches." ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE id = match_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
        )
    );

-- Functions & Triggers

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        avatar_url,
        is_onboarded,
        is_diaspora,
        gender,
        religion,
        marital_status,
        job,
        education,
        birth_date,
        birth_time,
        location,
        star_sign,
        spouse_requirements
    )
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        new.email, 
        new.raw_user_meta_data->>'avatar_url',
        COALESCE((new.raw_user_meta_data->>'is_onboarded')::boolean, false),
        COALESCE((new.raw_user_meta_data->>'is_diaspora')::boolean, false),
        new.raw_user_meta_data->>'gender',
        new.raw_user_meta_data->>'religion',
        new.raw_user_meta_data->>'marital_status',
        new.raw_user_meta_data->>'job',
        new.raw_user_meta_data->>'education',
        CASE WHEN new.raw_user_meta_data->>'birth_date' IS NOT NULL THEN (new.raw_user_meta_data->>'birth_date')::date ELSE NULL END,
        new.raw_user_meta_data->>'birth_time',
        new.raw_user_meta_data->>'location',
        new.raw_user_meta_data->>'star_sign',
        new.raw_user_meta_data->>'spouse_requirements'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_settings
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed initial settings
INSERT INTO public.settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
