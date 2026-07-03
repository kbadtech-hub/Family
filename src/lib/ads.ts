/**
 * BETESEB ADVERTISING SAFETY CONFIGURATION
 * Configures AdMob/Google Mobile Ads settings to target mature demographics (18+)
 * while filtering out inappropriate ad content (e.g., gambling, competitors, adult content).
 */

export interface AdConfiguration {
  maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
  tagForChildDirectedTreatment: boolean;
  tagForUnderAgeOfConsent: boolean;
  nonPersonalizedAdsOnly: boolean;
  blockedCategories: string[];
}

export const SECURE_AD_CONFIG: AdConfiguration = {
  // Enforce PG ad rating maximum to keep ads clean and family-friendly
  maxAdContentRating: 'PG',
  // Users are strictly 18+, so child-directed tags are false
  tagForChildDirectedTreatment: false,
  tagForUnderAgeOfConsent: false,
  nonPersonalizedAdsOnly: true, // Enforce strict privacy compliance
  // Categories explicitly blocked in network mediation
  blockedCategories: [
    'Dating & Relationships (Competitors)',
    'Gambling & Betting',
    'Sensual/Suggestive content',
    'Weapons & Firearms',
    'Alcohol & Tobacco',
    'Social Casino Games'
  ]
};

export function getAdRequestConfiguration() {
  return {
    maxAdContentRating: SECURE_AD_CONFIG.maxAdContentRating,
    tagForChildDirectedTreatment: SECURE_AD_CONFIG.tagForChildDirectedTreatment,
    tagForUnderAgeOfConsent: SECURE_AD_CONFIG.tagForUnderAgeOfConsent,
    nonPersonalizedAdsOnly: SECURE_AD_CONFIG.nonPersonalizedAdsOnly,
  };
}
