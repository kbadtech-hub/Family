/**
 * Trust Tiers & Profile Completion Logic (Beteseb v3.6)
 */

export interface ProfileData {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  username?: string | null;
  interests?: string | null;
  preferred_language?: string;
  birth_date?: string | null;
  gender?: string | null;
  location?: any;
  religion?: string | null;
  marital_status?: string | null;
  job_title?: string | null;
  family_values?: string | null;
  conflict_resolution?: string | null;
  hobbies?: string[];
  spouse_requirements?: string[];
  partner_intent?: string | null;
  video_selfie_url?: string | null;
  verification_status?: string;
  onboarding_completed?: boolean;
  premium_until?: string | null;
  role?: string;
  has_children?: string;
}

/**
 * Calculates profile completion rate between 0% and 100%
 */
export function calculateCompletionRate(profile: ProfileData | null): number {
  if (!profile) return 0;
  
  let score = 0;
  
  if (profile.full_name) score += 5;
  if (profile.email) score += 5;
  if (profile.phone) score += 5;
  if (profile.avatar_url) score += 10;
  if (profile.bio && profile.bio.length >= 100 && profile.bio.length <= 150) score += 10;
  else if (profile.bio) score += 5; // bio exists but not in ideal range
  
  if (profile.birth_date) score += 5;
  if (profile.gender) score += 5;
  
  // check location JSONB structure
  if (profile.location) {
    const loc = typeof profile.location === 'string' ? JSON.parse(profile.location) : profile.location;
    if (loc?.country && loc?.city) {
      score += 10;
    } else if (loc?.country) {
      score += 5;
    }
  }
  
  if (profile.religion) score += 5;
  if (profile.marital_status) score += 5;
  if (profile.job_title) score += 5;
  if (profile.family_values) score += 5;
  if (profile.conflict_resolution) score += 5;
  
  if (profile.spouse_requirements && profile.spouse_requirements.length > 0) score += 10;
  if (profile.partner_intent) score += 5;
  if (profile.video_selfie_url) score += 5;
  
  return Math.min(score, 100);
}

export type TrustTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * Resolves user trust tier
 */
export function getUserTier(profile: ProfileData | null, hasVouchedRecords: boolean): TrustTier {
  if (!profile) return 'bronze';
  
  const isPremium = (profile.premium_until && new Date(profile.premium_until) > new Date()) || 
                    ['admin', 'super_admin', 'expert'].includes(profile.role || '');
  
  if (isPremium) {
    return 'diamond';
  }
  
  const isIdVerified = profile.verification_status === 'verified';
  
  // Platinum Tier: Basic Verification + Legal ID Verification + Approved Community Vouched status
  if (isIdVerified && hasVouchedRecords) {
    return 'platinum';
  }
  
  // Gold Tier: Basic Verification + Complete Legal ID/Passport Verification approved
  if (isIdVerified) {
    return 'gold';
  }
  
  // Silver Tier: Basic verified criteria satisfied via Google/Facebook/Apple ID or onboarding completed
  if (profile.onboarding_completed) {
    return 'silver';
  }
  
  return 'bronze'; // Unverified / Bronze
}

export interface TierLimits {
  maxTexts: number;
  maxAudioCallMinutes: number;
  maxVideoCallMinutes: number;
}

/**
 * Fetches daily action limits per tier
 */
export function getTierLimits(tier: TrustTier): TierLimits {
  switch (tier) {
    case 'diamond':
      return { maxTexts: Infinity, maxAudioCallMinutes: Infinity, maxVideoCallMinutes: Infinity };
    case 'platinum':
      return { maxTexts: 7, maxAudioCallMinutes: 3, maxVideoCallMinutes: 3 };
    case 'gold':
      return { maxTexts: 5, maxAudioCallMinutes: 2, maxVideoCallMinutes: 2 };
    case 'silver':
      return { maxTexts: 3, maxAudioCallMinutes: 1, maxVideoCallMinutes: 1 };
    case 'bronze':
    default:
      return { maxTexts: 0, maxAudioCallMinutes: 0, maxVideoCallMinutes: 0 };
  }
}
