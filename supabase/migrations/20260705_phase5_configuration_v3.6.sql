-- =========================================================================
-- PHASE-5 SYSTEM CONFIGURATION UPDATES (v3.6)
-- VERSION: 1.0
-- DATE: 2026-07-05
-- =========================================================================

-- 1. ADD COLUMNS FOR SYSTEM CONFIGURATION v3.6
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS relationship_intent TEXT CHECK (relationship_intent IN (
    'Seeking a Serious Partner / Marriage',
    'Serious Relationship / Dating',
    'Normal Friendship',
    'Passing Time / Learning and Understanding Marriage'
  )),
  ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enable_app_lock BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preferred_search_locations JSONB DEFAULT '[]', -- array of up to 3 locations
  ADD COLUMN IF NOT EXISTS profile_boost_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. EXTEND WALI ROOMS WITH SAFE SPACE AND TELEMETRY LOGIC
ALTER TABLE public.wali_rooms
  ADD COLUMN IF NOT EXISTS safe_space_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS safe_space_approved_by UUID[] DEFAULT '{}';
