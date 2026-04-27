-- Trigger to enforce premium/trial status for community posts
CREATE OR REPLACE FUNCTION public.check_premium_before_post()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_premium = true OR trial_ends_at > now() OR role IN ('admin', 'super_admin', 'expert'))
    ) THEN
        RAISE EXCEPTION 'ይህ ፊቸር ለፕሪሚየም አባላት ብቻ ነው (Premium required to post)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_premium_on_posts ON public.community_posts;

CREATE TRIGGER enforce_premium_on_posts
    BEFORE INSERT ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.check_premium_before_post();
