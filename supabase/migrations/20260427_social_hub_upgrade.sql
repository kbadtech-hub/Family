-- Upgrade community_posts table
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'; -- image, video
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'; -- general, success_story, lesson_learned, expert_class
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create Likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'like', -- like, heart, celebrate, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create Comments table (Nested)
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Polls tables
CREATE TABLE IF NOT EXISTS community_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES community_polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(option_id, user_id)
);

-- RLS Policies
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Public read for all community tables
CREATE POLICY "Public read community_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public read post_likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Public read post_comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Public read community_polls" ON community_polls FOR SELECT USING (true);
CREATE POLICY "Public read poll_options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Public read poll_votes" ON poll_votes FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Users can like" ON post_likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can comment" ON post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can vote" ON poll_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Storage Bucket for Community Media
-- (Handled via Supabase dashboard or manual script if needed, but assuming bucket 'community_media' exists)
