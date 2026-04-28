-- ==========================================
-- UNIVERSAL LOCALIZATION UPDATES (2026)
-- ==========================================

-- 1. Add translations column to content tables
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- 2. Update settings table for multi-language support
-- We'll keep cms_content as it is but use it for multi-lang structures.
-- Example structure: cms_content -> { "hero_title": { "en": "...", "am": "..." } }

-- 3. Add category to community_posts if not exists (checked schema, it was there but let's be sure)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- 4. Add is_ai_generated if not exists (used in community page)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;

-- 5. Comments translations
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
