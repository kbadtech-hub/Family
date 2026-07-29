-- =========================================================================
-- BETESEB PLATFORM — MODULE 23: ADVANCED MATCHING ALGORITHM ENGINE
-- =========================================================================

-- 1. Extensions & Column Additions to profiles
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS religious_importance_level TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS career_category TEXT,
  ADD COLUMN IF NOT EXISTS career_priority_level INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS financial_mindset TEXT,
  ADD COLUMN IF NOT EXISTS relocation_intent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lifestyle_habits TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(Point, 4326);

-- Backfill country, city if stored inside JSONB location
UPDATE public.profiles
SET 
  country = COALESCE(country, location->>'country', ''),
  city = COALESCE(city, location->>'city', ''),
  region = COALESCE(region, location->>'region', '')
WHERE country IS NULL OR city IS NULL;

-- 2. User Matching Preferences Table
CREATE TABLE IF NOT EXISTS public.user_matching_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_gender TEXT NOT NULL,
    min_preferred_age INT NOT NULL DEFAULT 18,
    max_preferred_age INT NOT NULL DEFAULT 99,
    preferred_religion TEXT DEFAULT 'any',
    strict_religion_veto BOOLEAN DEFAULT false,
    preferred_country TEXT DEFAULT 'any',
    preferred_region TEXT DEFAULT 'any',
    preferred_city TEXT DEFAULT 'any',
    use_geo_radius BOOLEAN DEFAULT false,
    geo_radius_km INT DEFAULT 50,
    accepts_divorced BOOLEAN DEFAULT true,
    accepts_has_children BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Match Cache Table (Redis fallback & persistent store)
CREATE TABLE IF NOT EXISTS public.user_match_cache (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    final_compatibility_score NUMERIC(5,2) NOT NULL,
    score_a_to_b NUMERIC(5,2) NOT NULL,
    score_b_to_a NUMERIC(5,2) NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, candidate_id)
);

-- 4. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_point ON public.profiles USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_profiles_selected_tags_gin ON public.profiles USING GIN (selected_tags);
CREATE INDEX IF NOT EXISTS idx_profiles_lifestyle_habits_gin ON public.profiles USING GIN (lifestyle_habits);
CREATE INDEX IF NOT EXISTS idx_profiles_hobbies_gin ON public.profiles USING GIN (hobbies);
CREATE INDEX IF NOT EXISTS idx_profiles_hard_filters ON public.profiles (gender, birth_date, religion, country, city);

-- 5. RLS Policies
ALTER TABLE public.user_matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_match_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own matching preferences" ON public.user_matching_preferences;
CREATE POLICY "Users can view own matching preferences" ON public.user_matching_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own matching preferences" ON public.user_matching_preferences;
CREATE POLICY "Users can manage own matching preferences" ON public.user_matching_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own match cache" ON public.user_match_cache;
CREATE POLICY "Users can view own match cache" ON public.user_match_cache FOR SELECT USING (auth.uid() = user_id);

GRANT ALL ON public.user_matching_preferences TO authenticated, service_role;
GRANT ALL ON public.user_match_cache TO authenticated, service_role;

-- 6. Advanced Two-Way Geometric Mean Matching RPC Function
CREATE OR REPLACE FUNCTION public.fn_get_user_matches(
    p_user_id UUID,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    candidate_id UUID,
    final_compatibility_score NUMERIC(5,2),
    score_a_to_b NUMERIC(5,2),
    score_b_to_a NUMERIC(5,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    u_record RECORD;
    u_pref RECORD;
    u_age INT;
BEGIN
    -- 1. Fetch Target User Profile & Preferences
    SELECT * INTO u_record FROM public.profiles WHERE id = p_user_id;
    IF u_record.id IS NULL THEN
        RETURN;
    END IF;

    SELECT * INTO u_pref FROM public.user_matching_preferences WHERE user_id = p_user_id;
    
    -- Fallback default preferences if user_matching_preferences record doesn't exist yet
    IF u_pref.user_id IS NULL THEN
        u_pref.preferred_gender := CASE WHEN u_record.gender = 'Male' THEN 'Female' ELSE 'Male' END;
        u_pref.min_preferred_age := COALESCE(u_record.partner_age_min, 18);
        u_pref.max_preferred_age := COALESCE(u_record.partner_age_max, 99);
        u_pref.preferred_religion := COALESCE(u_record.partner_religion, 'any');
        u_pref.strict_religion_veto := false;
        u_pref.preferred_country := 'any';
        u_pref.preferred_region := 'any';
        u_pref.preferred_city := 'any';
        u_pref.use_geo_radius := false;
        u_pref.geo_radius_km := 50;
        u_pref.accepts_has_children := true;
    END IF;

    u_age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, u_record.birth_date));

    RETURN QUERY
    WITH candidates AS (
        -- PHASE 1: BILATERAL HARD FILTERS + POSTGIS GEO RADIUS CHECK
        SELECT 
            p.id AS cand_id,
            p.*,
            COALESCE(cp.min_preferred_age, p.partner_age_min, 18) AS cand_min_age,
            COALESCE(cp.max_preferred_age, p.partner_age_max, 99) AS cand_max_age,
            COALESCE(cp.preferred_religion, p.partner_religion, 'any') AS cand_pref_religion,
            COALESCE(cp.strict_religion_veto, false) AS cand_strict_religion,
            COALESCE(cp.preferred_city, 'any') AS cand_pref_city,
            COALESCE(cp.use_geo_radius, false) AS cand_use_geo,
            COALESCE(cp.geo_radius_km, 50) AS cand_geo_km,
            COALESCE(cp.accepts_has_children, true) AS cand_accepts_children,
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date)) AS cand_age
        FROM public.profiles p
        LEFT JOIN public.user_matching_preferences cp ON cp.user_id = p.id
        WHERE p.id <> p_user_id
          -- 1. Gender Match (Straight matching)
          AND LOWER(p.gender) = LOWER(u_pref.preferred_gender)
          AND LOWER(u_record.gender) = LOWER(COALESCE(cp.preferred_gender, CASE WHEN p.gender = 'Male' THEN 'Female' ELSE 'Male' END))
          -- 2. Bilateral Age Range Boundary
          AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date)) BETWEEN u_pref.min_preferred_age AND u_pref.max_preferred_age
          AND u_age BETWEEN COALESCE(cp.min_preferred_age, p.partner_age_min, 18) AND COALESCE(cp.max_preferred_age, p.partner_age_max, 99)
          -- 3. Religion Preference & Religion Veto
          AND (u_pref.preferred_religion = 'any' OR u_pref.preferred_religion IS NULL OR p.religion = u_pref.preferred_religion)
          AND (COALESCE(cp.preferred_religion, 'any') = 'any' OR u_record.religion = cp.preferred_religion)
          AND NOT (u_pref.strict_religion_veto = true AND u_record.religion <> p.religion)
          AND NOT (COALESCE(cp.strict_religion_veto, false) = true AND p.religion <> u_record.religion)
          -- 4. Location Check (City OR PostGIS Geo Radius Toggle)
          AND (
              CASE 
                  -- If Geo Radius Toggle is ON for User A: Use PostGIS ST_DWithin
                  WHEN u_pref.use_geo_radius = true AND u_record.location_point IS NOT NULL AND p.location_point IS NOT NULL THEN
                      ST_DWithin(u_record.location_point, p.location_point, u_pref.geo_radius_km * 1000)
                  -- Otherwise fallback to City Selection match
                  WHEN u_pref.preferred_city <> 'any' AND u_pref.preferred_city IS NOT NULL AND u_pref.preferred_city <> '' THEN
                      p.city = u_pref.preferred_city
                  ELSE true
              END
          )
    ),
    scored_candidates AS (
        -- PHASE 2: WEIGHTED SCORING MATRIX (25% Demographics + 25% Personality + 35% Jaccard Tags + 15% Lifestyle)
        SELECT 
            c.cand_id,
            
            -- SCORING A -> B
            (
                -- Category A: Demographics & Life (25%)
                (CASE WHEN u_record.marital_status = c.marital_status THEN 7.0 ELSE 0.0 END) +
                (CASE WHEN COALESCE(u_record.city, '') = COALESCE(c.city, '') THEN 6.0 WHEN COALESCE(u_record.region, '') = COALESCE(c.region, '') THEN 4.2 ELSE 2.4 END) +
                (CASE WHEN COALESCE(u_record.career_category, u_record.job_title) = COALESCE(c.career_category, c.job_title) THEN 6.0 ELSE 3.0 END) +
                (CASE WHEN COALESCE(u_record.financial_mindset, u_record.finance_habit) = COALESCE(c.financial_mindset, c.finance_habit) THEN 6.0 ELSE 3.0 END) +

                -- Category B: Personality & Dynamics (25%)
                (CASE WHEN u_record.family_values = c.family_values THEN 7.5 ELSE 0.0 END) +
                (CASE 
                    WHEN u_record.conflict_resolution = c.conflict_resolution THEN 7.5 
                    WHEN (u_record.conflict_resolution = 'immediate_discussion' AND c.conflict_resolution = 'cool_off_then_talk') OR
                         (u_record.conflict_resolution = 'cool_off_then_talk' AND c.conflict_resolution = 'immediate_discussion') THEN 3.75 
                    ELSE 0.0 
                END) +
                (CASE WHEN COALESCE(u_record.religious_importance_level, 'medium') = COALESCE(c.religious_importance_level, 'medium') THEN 5.0 ELSE 2.5 END) +
                (CASE 
                    WHEN u_record.future_children = c.future_children THEN 5.0 
                    WHEN u_record.future_children <> c.future_children THEN -20.0 
                    ELSE 0.0 
                END) +

                -- Category C: Selected Key Preferences - Jaccard Index (35%)
                (
                    CASE 
                        WHEN (CARDINALITY(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) + CARDINALITY(COALESCE(c.selected_tags, c.spouse_requirements)) - CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) INTERSECT SELECT UNNEST(COALESCE(c.selected_tags, c.spouse_requirements))))) > 0 
                        THEN (
                            CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) INTERSECT SELECT UNNEST(COALESCE(c.selected_tags, c.spouse_requirements))))::NUMERIC / 
                            (CARDINALITY(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) + CARDINALITY(COALESCE(c.selected_tags, c.spouse_requirements)) - CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) INTERSECT SELECT UNNEST(COALESCE(c.selected_tags, c.spouse_requirements)))))::NUMERIC
                        ) * 35.0
                        ELSE 0.0 
                    END
                ) +

                -- Category D: Interests & Lifestyle (15%)
                (
                    CASE WHEN CARDINALITY(COALESCE(u_record.lifestyle_habits, ARRAY[u_record.lifestyle])) > 0 THEN
                        (CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(u_record.lifestyle_habits, ARRAY[u_record.lifestyle])) INTERSECT SELECT UNNEST(COALESCE(c.lifestyle_habits, ARRAY[c.lifestyle]))))::NUMERIC / CARDINALITY(COALESCE(u_record.lifestyle_habits, ARRAY[u_record.lifestyle]))::NUMERIC) * 8.0
                    ELSE 0.0 END
                ) +
                (
                    CASE WHEN CARDINALITY(u_record.hobbies) > 0 THEN
                        (CARDINALITY(ARRAY(SELECT UNNEST(u_record.hobbies) INTERSECT SELECT UNNEST(c.hobbies)))::NUMERIC / CARDINALITY(u_record.hobbies)::NUMERIC) * 7.0
                    ELSE 0.0 END
                ) +

                -- Veto & Penalties (Relocation & Child Intent)
                (CASE WHEN u_record.city <> c.city AND u_record.relocation_intent = false AND c.relocation_intent = false THEN -15.0 ELSE 0.0 END) +
                (CASE WHEN u_record.has_children = 'Yes' AND c.cand_accepts_children = false THEN -25.0 ELSE 0.0 END)
            ) AS raw_score_a_to_b,

            -- SCORING B -> A (Symmetric calculation)
            (
                (CASE WHEN c.marital_status = u_record.marital_status THEN 7.0 ELSE 0.0 END) +
                (CASE WHEN COALESCE(c.city, '') = COALESCE(u_record.city, '') THEN 6.0 WHEN COALESCE(c.region, '') = COALESCE(u_record.region, '') THEN 4.2 ELSE 2.4 END) +
                (CASE WHEN COALESCE(c.career_category, c.job_title) = COALESCE(u_record.career_category, u_record.job_title) THEN 6.0 ELSE 3.0 END) +
                (CASE WHEN COALESCE(c.financial_mindset, c.finance_habit) = COALESCE(u_record.financial_mindset, u_record.finance_habit) THEN 6.0 ELSE 3.0 END) +
                (CASE WHEN c.family_values = u_record.family_values THEN 7.5 ELSE 0.0 END) +
                (CASE 
                    WHEN c.conflict_resolution = u_record.conflict_resolution THEN 7.5 
                    WHEN (c.conflict_resolution = 'immediate_discussion' AND c.conflict_resolution = 'cool_off_then_talk') OR
                         (c.conflict_resolution = 'cool_off_then_talk' AND u_record.conflict_resolution = 'immediate_discussion') THEN 3.75 
                    ELSE 0.0 
                END) +
                (CASE WHEN COALESCE(c.religious_importance_level, 'medium') = COALESCE(u_record.religious_importance_level, 'medium') THEN 5.0 ELSE 2.5 END) +
                (CASE WHEN c.future_children = u_record.future_children THEN 5.0 WHEN c.future_children <> u_record.future_children THEN -20.0 ELSE 0.0 END) +
                (
                    CASE 
                        WHEN (CARDINALITY(COALESCE(c.selected_tags, c.spouse_requirements)) + CARDINALITY(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) - CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(c.selected_tags, c.spouse_requirements)) INTERSECT SELECT UNNEST(COALESCE(u_record.selected_tags, u_record.spouse_requirements))))) > 0 
                        THEN (
                            CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(c.selected_tags, c.spouse_requirements)) INTERSECT SELECT UNNEST(COALESCE(u_record.selected_tags, u_record.spouse_requirements))))::NUMERIC / 
                            (CARDINALITY(COALESCE(c.selected_tags, c.spouse_requirements)) + CARDINALITY(COALESCE(u_record.selected_tags, u_record.spouse_requirements)) - CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(c.selected_tags, c.spouse_requirements)) INTERSECT SELECT UNNEST(COALESCE(u_record.selected_tags, u_record.spouse_requirements)))))::NUMERIC
                        ) * 35.0
                        ELSE 0.0 
                    END
                ) +
                (CASE WHEN CARDINALITY(COALESCE(c.lifestyle_habits, ARRAY[c.lifestyle])) > 0 THEN (CARDINALITY(ARRAY(SELECT UNNEST(COALESCE(c.lifestyle_habits, ARRAY[c.lifestyle])) INTERSECT SELECT UNNEST(COALESCE(u_record.lifestyle_habits, ARRAY[u_record.lifestyle]))))::NUMERIC / CARDINALITY(COALESCE(c.lifestyle_habits, ARRAY[c.lifestyle]))::NUMERIC) * 8.0 ELSE 0.0 END) +
                (CASE WHEN CARDINALITY(c.hobbies) > 0 THEN (CARDINALITY(ARRAY(SELECT UNNEST(c.hobbies) INTERSECT SELECT UNNEST(u_record.hobbies)))::NUMERIC / CARDINALITY(c.hobbies)::NUMERIC) * 7.0 ELSE 0.0 END) +
                (CASE WHEN c.city <> u_record.city AND c.relocation_intent = false AND u_record.relocation_intent = false THEN -15.0 ELSE 0.0 END) +
                (CASE WHEN c.has_children = 'Yes' AND u_pref.accepts_has_children = false THEN -25.0 ELSE 0.0 END)
            ) AS raw_score_b_to_a

        FROM candidates c
    )
    SELECT 
        sc.cand_id,
        -- TWO-WAY GEOMETRIC MEAN FORMULA: sqrt(max(0, Score_A_to_B) * max(0, Score_B_to_A))
        ROUND(
            SQRT(
                GREATEST(0, sc.raw_score_a_to_b) * GREATEST(0, sc.raw_score_b_to_a)
            )::NUMERIC, 
            2
        ) AS final_compatibility_score,
        ROUND(GREATEST(0, sc.raw_score_a_to_b)::NUMERIC, 2) AS score_a_to_b,
        ROUND(GREATEST(0, sc.raw_score_b_to_a)::NUMERIC, 2) AS score_b_to_a
    FROM scored_candidates sc
    WHERE SQRT(GREATEST(0, sc.raw_score_a_to_b) * GREATEST(0, sc.raw_score_b_to_a)) > 0
    ORDER BY final_compatibility_score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_user_matches(UUID, INT, INT) TO authenticated, service_role;
