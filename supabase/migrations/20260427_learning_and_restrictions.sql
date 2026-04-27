-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT,
    thumbnail_url TEXT,
    instructions TEXT,
    category TEXT DEFAULT 'general',
    is_premium_only BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only premium/admin users can view premium lessons
CREATE POLICY "Premium users can view lessons" ON public.lessons
    FOR SELECT USING (
        NOT is_premium_only OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_premium = true OR trial_ends_at > now() OR role IN ('admin', 'super_admin', 'expert'))
        )
    );

-- Enforce community media restrictions: Only images for regular users
CREATE OR REPLACE FUNCTION public.check_community_media_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is admin/expert
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'expert')
    ) THEN
        RETURN NEW;
    END IF;

    -- Regular users can only post images
    IF NEW.media_type NOT IN ('image', 'none') THEN
        RAISE EXCEPTION 'ቪዲዮ እና አውዲዮ መጫን ለተራ ተጠቃሚዎች አይፈቀድም (Only images allowed for regular users)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS restrict_media_type_on_posts ON public.community_posts;

CREATE TRIGGER restrict_media_type_on_posts
    BEFORE INSERT ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.check_community_media_type();

-- Ensure community is public read (already exists but reinforcing)
DROP POLICY IF EXISTS "Public read community" ON public.community_posts;
CREATE POLICY "Public read community" ON public.community_posts FOR SELECT USING (true);
