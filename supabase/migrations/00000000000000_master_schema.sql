-- Total System Clean-up
DROP SCHEMA IF EXISTS public CASCADE;
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
    gallery_photos TEXT[] DEFAULT '{}',
    interests TEXT,
    
    quiz_results JSONB DEFAULT '{}'::jsonb,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'expert', 'admin', 'super_admin')),
    is_premium BOOLEAN DEFAULT FALSE,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. verifications (Security)
CREATE TABLE public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    doc_type TEXT DEFAULT 'id',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. payments (Finance)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 5. community_posts (Social Hub)
CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT DEFAULT 'image', -- image, video
    category TEXT DEFAULT 'general', -- general, success_story, lesson_learned, expert_class
    is_approved BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. post_likes
CREATE TABLE public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'like',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 7. post_comments
CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. community_polls
CREATE TABLE public.community_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL
);

CREATE TABLE public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(option_id, user_id)
);

-- 9. matches
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_two_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'rejected')),
    match_type TEXT NOT NULL CHECK (match_type IN ('ai', 'manual')),
    score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_match_pair UNIQUE (user_one_id, user_two_id)
);

-- 10. messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    translation_metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users view own verifications" ON public.verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own verifications" ON public.verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Public read community" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Premium or Trial users can post community" ON public.community_posts 
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_premium = true OR trial_ends_at > now() OR role IN ('admin', 'super_admin'))
        )
    );

CREATE POLICY "Public read likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public read comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read polls" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Public read options" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Premium users can view matches" ON public.matches 
    FOR SELECT USING (
        (auth.uid() = user_one_id OR auth.uid() = user_two_id) AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_premium = true OR trial_ends_at > now() OR role IN ('admin', 'super_admin'))
        )
    );

CREATE POLICY "Premium users view match messages" ON public.messages 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
        ) AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_premium = true OR trial_ends_at > now() OR role IN ('admin', 'super_admin'))
        )
    );

CREATE POLICY "Premium users send match messages" ON public.messages 
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
        ) AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_premium = true OR trial_ends_at > now() OR role IN ('admin', 'super_admin'))
        )
    );

-- Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url', 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Automated AI Content Generation
CREATE OR REPLACE FUNCTION public.generate_ai_community_topic()
RETURNS void AS $$
DECLARE
    topic_list TEXT[] := ARRAY[
        'How can traditional Abushakir logic solve modern dating burnout?',
        'What is the most important trait for a long-distance relationship?',
        'How do you balance family expectations with personal career goals?',
        'The role of elders in modern Ethiopian weddings: Wisdom or pressure?',
        'What are the three core values for a lasting marriage in the digital age?',
        'How to maintain cultural identity while living in the Diaspora?',
        'The impact of social media on family communication.'
    ];
    random_topic TEXT;
    ai_user_id UUID;
BEGIN
    -- Pick a random topic
    random_topic := topic_list[1 + floor(random() * array_length(topic_list, 1))];
    
    -- Find or identify an admin/AI user to post as
    SELECT id INTO ai_user_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
    
    IF ai_user_id IS NOT NULL THEN
        INSERT INTO public.community_posts (author_id, content, category, is_approved, is_ai_generated)
        VALUES (ai_user_id, random_topic, 'general', true, true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial settings
INSERT INTO public.settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
