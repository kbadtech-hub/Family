/**
 * Multi-stage Duplicate Matching Engine for Beteseb Platform
 */
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeNameToken } from '../phonetics/normalization';
import { calculateNameSimilarity, generateEthiopicSoundex } from '../phonetics/ethiopian_soundex';

export interface DuplicateCheckInput {
  first_name: string;
  father_name: string;
  grandfather_name?: string;
  mother_name?: string;
  birth_date?: string; // YYYY-MM-DD
  city?: string;
  phone?: string;
  email?: string;
  current_user_id?: string;
}

export interface DuplicateCheckResult {
  has_duplicate: boolean;
  duplicate_type?: 'stage_1_warning' | 'stage_2_block' | 'phone_email_exists';
  matched_stage?: 'stage_1_basic' | 'stage_2_advanced' | 'phone_email_social';
  match_score: number;
  matched_profile_id?: string;
  matched_profile_name?: string;
  message_amharic: string;
  message_english: string;
  can_merge: boolean;
  requires_stage_2_input: boolean;
}

/**
 * Executes Multi-Stage Verification Logic against existing profiles.
 */
export async function checkDuplicateAccount(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
  const {
    first_name,
    father_name,
    grandfather_name = '',
    mother_name = '',
    birth_date,
    city = '',
    phone,
    email,
    current_user_id,
  } = input;

  // 0. Check Email / Phone Direct Match (Stage 0 / Account Merging)
  if (email || phone) {
    let query = supabaseAdmin.from('profiles').select('id, full_name, email, phone');
    if (current_user_id) {
      query = query.neq('id', current_user_id);
    }

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    }

    const { data: directMatches } = await query;
    if (directMatches && directMatches.length > 0) {
      const match = directMatches[0];
      return {
        has_duplicate: true,
        duplicate_type: 'phone_email_exists',
        matched_stage: 'phone_email_social',
        match_score: 1.0,
        matched_profile_id: match.id,
        matched_profile_name: match.full_name,
        message_amharic: 'በዚህ ስልክ ቁጥር ወይም ኢሜይል ቀደም ሲል የተከፈተ አካውንት አለ። አካውንቶቹን ማዋሃድ ይፈልጋሉ?',
        message_english: 'An account already exists with this phone or email. Would you like to merge accounts?',
        can_merge: true,
        requires_stage_2_input: false,
      };
    }
  }

  // Normalize candidate inputs
  const normFirstName = normalizeNameToken(first_name);
  const normFatherName = normalizeNameToken(father_name);
  const normGrandfatherName = normalizeNameToken(grandfather_name);
  const normMotherName = normalizeNameToken(mother_name);
  const normCity = normalizeNameToken(city);

  const phoneticFirstName = generateEthiopicSoundex(normFirstName);
  const phoneticFatherName = generateEthiopicSoundex(normFatherName);

  // Retrieve candidate profiles sharing birth_date or matching phonetic names
  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, first_name, father_name, grandfather_name, mother_name, birth_date, location');

  if (current_user_id) {
    query = query.neq('id', current_user_id);
  }

  if (birth_date) {
    query = query.eq('birth_date', birth_date);
  }

  const { data: candidates, error } = await query.limit(50);

  if (error || !candidates || candidates.length === 0) {
    return {
      has_duplicate: false,
      match_score: 0.0,
      message_amharic: 'ምንም አይነት ተመሳስሎ አልተገኘም።',
      message_english: 'No matching duplicates found.',
      can_merge: false,
      requires_stage_2_input: false,
    };
  }

  let highestScore = 0.0;
  let matchedProfile: any = null;
  let matchedStage: 'stage_1_basic' | 'stage_2_advanced' = 'stage_1_basic';
  let isStage2Triggered = false;

  for (const candidate of candidates) {
    const candFirstName = candidate.first_name || (candidate.full_name ? candidate.full_name.split(' ')[0] : '');
    const candFatherName = candidate.father_name || (candidate.full_name ? candidate.full_name.split(' ')[1] : '');
    const candGrandfatherName = candidate.grandfather_name || (candidate.full_name ? candidate.full_name.split(' ')[2] : '');
    const candMotherName = candidate.mother_name || '';
    const candCity = candidate.location?.city || '';

    // Stage 1 Verification: First Name + Father Name + DOB
    const firstNameSim = calculateNameSimilarity(normFirstName, candFirstName);
    const fatherNameSim = calculateNameSimilarity(normFatherName, candFatherName);
    const stage1Score = (firstNameSim + fatherNameSim) / 2.0;

    if (stage1Score >= 0.82) {
      let stage2Score = 0.0;

      // Stage 2 Verification: Grandfather Name + Mother Name + City
      if (normGrandfatherName || normMotherName || normCity) {
        const gfSim = normGrandfatherName ? calculateNameSimilarity(normGrandfatherName, candGrandfatherName) : 0.5;
        const motherSim = normMotherName ? calculateNameSimilarity(normMotherName, candMotherName) : 0.5;
        const citySim = normCity ? calculateNameSimilarity(normCity, candCity) : 0.5;

        stage2Score = (gfSim * 0.4) + (motherSim * 0.4) + (citySim * 0.2);
      }

      const totalMatchScore = stage2Score > 0 ? (stage1Score * 0.5) + (stage2Score * 0.5) : stage1Score;

      if (totalMatchScore > highestScore) {
        highestScore = totalMatchScore;
        matchedProfile = candidate;
        if (stage2Score >= 0.80) {
          matchedStage = 'stage_2_advanced';
          isStage2Triggered = true;
        } else {
          matchedStage = 'stage_1_basic';
        }
      }
    }
  }

  // Decision Thresholds
  if (highestScore >= 0.88 && isStage2Triggered) {
    // Stage 2 Block / Auto-Flag
    return {
      has_duplicate: true,
      duplicate_type: 'stage_2_block',
      matched_stage: 'stage_2_advanced',
      match_score: Math.round(highestScore * 100) / 100,
      matched_profile_id: matchedProfile.id,
      matched_profile_name: matchedProfile.full_name,
      message_amharic: 'የአያት፣ የእናት ስም እና የመኖሪያ ከተማ መረጃዎ ከሌላ ተመዝጋቢ ጋር ሙሉ በሙሉ ይመሳሰላል።',
      message_english: 'Grandfather name, mother name, and city match an existing registered account.',
      can_merge: true,
      requires_stage_2_input: false,
    };
  } else if (highestScore >= 0.80) {
    // Stage 1 Warning
    return {
      has_duplicate: true,
      duplicate_type: 'stage_1_warning',
      matched_stage: 'stage_1_basic',
      match_score: Math.round(highestScore * 100) / 100,
      matched_profile_id: matchedProfile.id,
      matched_profile_name: matchedProfile.full_name,
      message_amharic: 'የመጀመሪያ ስም፣ የአባት ስም እና የልደት ቀን ከሌላ አካውንት ጋር ተመሳስሏል። እርስዎ ነዎት?',
      message_english: 'First name, father name, and DOB match an existing account. Is this you?',
      can_merge: true,
      requires_stage_2_input: true,
    };
  }

  return {
    has_duplicate: false,
    match_score: Math.round(highestScore * 100) / 100,
    message_amharic: 'ተመሳሳይ አካውንት አልተገኘም።',
    message_english: 'No duplicate account detected.',
    can_merge: false,
    requires_stage_2_input: false,
  };
}
