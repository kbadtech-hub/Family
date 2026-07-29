import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import { calculateTwoWayGeometricMeanScore } from './compatibility';

export interface MatchCandidate {
  candidateId: string;
  finalCompatibilityScore: number;
  scoreAtoB: number;
  scoreBtoA: number;
  profile?: any;
}

export interface UserMatchingPreferences {
  user_id: string;
  preferred_gender: string;
  min_preferred_age: number;
  max_preferred_age: number;
  preferred_religion: string;
  strict_religion_veto: boolean;
  preferred_country: string;
  preferred_region: string;
  preferred_city: string;
  use_geo_radius: boolean;
  geo_radius_km: number;
  accepts_divorced: boolean;
  accepts_has_children: boolean;
}

/**
 * Fetches user matches using the optimized PostgreSQL Stored Procedure `fn_get_user_matches`.
 * Supports fallback to persistent DB cache or memory calculation.
 */
export async function getMatchesForUser(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<MatchCandidate[]> {
  try {
    // 1. Call Database Two-Way Geometric Mean RPC
    const { data: rpcMatches, error } = await supabaseAdmin.rpc('fn_get_user_matches', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.warn('RPC fn_get_user_matches call warning, attempting fallback:', error.message);
      return await getMatchesFallback(userId, limit, offset);
    }

    if (!rpcMatches || rpcMatches.length === 0) {
      return [];
    }

    // 2. Fetch candidate profile details for UI display
    const candidateIds = rpcMatches.map((m: any) => m.candidate_id);
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, birth_date, gender, location, city, region, country, religion, job_title, career_category, marital_status, has_children, hobbies, selected_tags')
      .in('id', candidateIds);

    if (profileErr) {
      console.error('Error fetching candidate profiles:', profileErr);
    }

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return rpcMatches.map((m: any) => ({
      candidateId: m.candidate_id,
      finalCompatibilityScore: Number(m.final_compatibility_score),
      scoreAtoB: Number(m.score_a_to_b),
      scoreBtoA: Number(m.score_b_to_a),
      profile: profileMap.get(m.candidate_id) || null
    }));
  } catch (err) {
    console.error('Error in getMatchesForUser:', err);
    return [];
  }
}

/**
 * Fallback in-memory query for development or when RPC function is initializing
 */
async function getMatchesFallback(
  userId: string,
  limit: number,
  offset: number
): Promise<MatchCandidate[]> {
  const { data: targetProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (!targetProfile) return [];

  const { data: targetPref } = await supabaseAdmin.from('user_matching_preferences').select('*').eq('user_id', userId).single();

  const targetGenderPref = targetPref?.preferred_gender || (targetProfile.gender === 'Male' ? 'Female' : 'Male');

  const { data: candidates } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .neq('id', userId)
    .ilike('gender', targetGenderPref)
    .range(offset, offset + limit * 2);

  if (!candidates) return [];

  const scored = candidates.map(candidate => {
    const scoreResult = calculateTwoWayGeometricMeanScore(targetProfile, targetPref, candidate, {});
    return {
      candidateId: candidate.id,
      finalCompatibilityScore: scoreResult.finalCompatibilityScore,
      scoreAtoB: scoreResult.scoreAtoB,
      scoreBtoA: scoreResult.scoreBtoA,
      profile: candidate
    };
  });

  return scored
    .sort((a, b) => b.finalCompatibilityScore - a.finalCompatibilityScore)
    .slice(0, limit);
}

/**
 * Updates matching preferences for a user
 */
export async function updateUserMatchingPreferences(
  userId: string,
  preferences: Partial<UserMatchingPreferences>
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('user_matching_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to update matching preferences:', error);
    return false;
  }

  // Clear pre-calculated cache for user on preference change
  await supabaseAdmin.from('user_match_cache').delete().eq('user_id', userId);
  return true;
}
