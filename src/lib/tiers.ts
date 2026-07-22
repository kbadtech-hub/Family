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
  is_lifetime?: boolean;
  is_vip_member?: boolean;
  vip_expires_at?: string | null;
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

export type TrustTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'vip';

/**
 * Resolves user trust tier
 */
export function getUserTier(profile: ProfileData | null, hasVouchedRecords: boolean): TrustTier {
  if (!profile) return 'bronze';
  
  // 1. VIP Tier check (Active VIP Membership overrides verification status)
  const isVip = Boolean(profile.is_vip_member) &&
    (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date() || Boolean(profile.is_lifetime));
  if (isVip) {
    return 'vip';
  }

  // 2. Diamond Tier check (Active Standard subscription overrides verification status)
  const isDiamond = Boolean(profile.is_lifetime) || 
    (profile.premium_until && new Date(profile.premium_until) > new Date()) ||
    ['admin', 'super_admin', 'expert'].includes(profile.role || '');
  if (isDiamond) {
    return 'diamond';
  }
  
  const isIdVerified = profile.verification_status === 'verified';
  
  // 3. Bronze and Silver checks (If NOT ID verified and not paid)
  if (!isIdVerified) {
    return profile.onboarding_completed ? 'silver' : 'bronze';
  }
  
  // 4. Platinum Tier check (Gold + Peer Witness vouched)
  if (hasVouchedRecords) {
    return 'platinum';
  }
  
  // 5. Gold Tier (ID verified only)
  return 'gold';
}

export interface TierLimits {
  maxTexts: number;
  maxAudioCallMinutes: number;
  maxVideoCallMinutes: number;
  maxVoiceNoteSeconds: number;
}

/**
 * Fetches daily action limits per tier
 */
export function getTierLimits(tier: TrustTier): TierLimits {
  switch (tier) {
    case 'vip':
    case 'diamond':
      return { maxTexts: Infinity, maxAudioCallMinutes: Infinity, maxVideoCallMinutes: Infinity, maxVoiceNoteSeconds: 60 };
    case 'platinum':
      return { maxTexts: 7, maxAudioCallMinutes: 3, maxVideoCallMinutes: 3, maxVoiceNoteSeconds: 30 };
    case 'gold':
      return { maxTexts: 5, maxAudioCallMinutes: 2, maxVideoCallMinutes: 2, maxVoiceNoteSeconds: 15 };
    case 'silver':
    case 'bronze':
    default:
      return { maxTexts: 0, maxAudioCallMinutes: 0, maxVideoCallMinutes: 0, maxVoiceNoteSeconds: 0 };
  }
}
