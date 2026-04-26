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
    star_sign TEXT,
    location JSONB DEFAULT '{}'::jsonb,
    quiz_results JSONB DEFAULT '{}'::jsonb,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. verifications (Security)
CREATE TABLE public.verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_card_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
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
    social_links JSONB DEFAULT '{}'::jsonb,
    slogans JSONB DEFAULT '[]'::jsonb,
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
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
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
