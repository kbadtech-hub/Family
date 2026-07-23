/**
 * Beteseb Welcome & Tier-Based Reward System (Blueprint v1.0)
 * Fully Automated Coin Allocation & Gating Rules
 */

export interface TierRewardConfig {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'vip';
  nameAm: string;
  nameEn: string;
  coins: number;
  cumulativeCoins: number;
  descriptionAm: string;
  ctaTextAm: string;
  ctaAction: 'onboarding' | 'verify' | 'download' | 'diamond' | 'vip' | 'none';
}

export const TIER_REWARDS: Record<string, TierRewardConfig> = {
  bronze: {
    tier: 'bronze',
    nameAm: 'Bronze (Sign Up)',
    nameEn: 'Bronze (Sign Up)',
    coins: 5,
    cumulativeCoins: 5,
    descriptionAm: 'እንኳን ወደ ቤተሰብ አፕሊኬሽን በደህና መጡ! 5 ነጻ የዌልካም ኮይን ወደ ዋሌትዎ ገቢ ተደርጓል።',
    ctaTextAm: 'ወደ Silver ደረጃ ለማደግ Onboarding ይጨርሱ',
    ctaAction: 'onboarding'
  },
  silver: {
    tier: 'silver',
    nameAm: 'Silver (Onboarding Completed)',
    nameEn: 'Silver (Onboarding Completed)',
    coins: 10,
    cumulativeCoins: 15,
    descriptionAm: 'የ Onboarding ሂደቱን ስለጨረሱ እንኳን ደስ አለዎት! अतिरिक्त 10 ኮይን አግኝተዋል።',
    ctaTextAm: 'ወደ Gold ደረጃ ለማደግ መታወቂያዎን ያረጋግጡ',
    ctaAction: 'verify'
  },
  gold: {
    tier: 'gold',
    nameAm: 'Gold (ID Verification Approved)',
    nameEn: 'Gold (ID Verification Approved)',
    coins: 15,
    cumulativeCoins: 30,
    descriptionAm: 'የማንነት ማረጋገጫ መረጃዎ በአድሚን ጸድቋል! 15 ኮይን በራስ-ሰር ተጨምሮልዎታል።',
    ctaTextAm: 'አሁኑኑ ያውርዱ',
    ctaAction: 'download'
  },
  platinum: {
    tier: 'platinum',
    nameAm: 'Platinum (App Downloaded)',
    nameEn: 'Platinum (App Downloaded)',
    coins: 20,
    cumulativeCoins: 50,
    descriptionAm: 'የቤተሰብ ሞባይል አፕሊኬሽን ስላወረዱ የ 20 ኮይን ቦነስ ተሰጥቶዎታል።',
    ctaTextAm: 'ወደ Diamond ደረጃ ያሳድጉ',
    ctaAction: 'diamond'
  },
  diamond: {
    tier: 'diamond',
    nameAm: 'Diamond (Diamond Tier Purchase)',
    nameEn: 'Diamond (Diamond Tier Purchase)',
    coins: 30,
    cumulativeCoins: 80,
    descriptionAm: 'የ Diamond አባልነት በመግዛትዎ እንኳን ደስ አለዎት! 30 የኮይን ሽልማት ተጨምሯል።',
    ctaTextAm: 'የ Diamond ደረጃ እንኳን ደስ አለዎት',
    ctaAction: 'none'
  },
  vip: {
    tier: 'vip',
    nameAm: 'VIP (VIP Subscription Purchase)',
    nameEn: 'VIP (VIP Subscription Purchase)',
    coins: 70,
    cumulativeCoins: 150,
    descriptionAm: 'የ VIP ሰብስክሪፕሽን አባል ስለሆኑ የ 70 ኮይን ልዩ ሽልማት ገቢ ሆኖልዎታል።',
    ctaTextAm: 'የ VIP ደረጃ እንኳን ደስ አለዎት',
    ctaAction: 'none'
  }
};

/**
 * Coin Gating Rule Enforcement:
 * Users must be at least GOLD tier (ID Verified) to spend coins (gifts, chat, profile views).
 */
export function canUserSpendCoins(profile: any): { allowed: boolean; message: string } {
  if (!profile) {
    return {
      allowed: false,
      message: 'እባክዎ መጀመሪያ ወደ አካውንትዎ ይግቡ።'
    };
  }

  const isIdVerified =
    profile.verification_status === 'verified' ||
    profile.is_verified === true ||
    Boolean(profile.is_vip_member) ||
    Boolean(profile.is_lifetime) ||
    ['admin', 'super_admin', 'expert'].includes(profile.role || '');

  if (!isIdVerified) {
    return {
      allowed: false,
      message: 'እባክዎ ያገኙትን ኮይን ለመጠቀም ደረጃዎን ወደ Gold ያሳድጉ (መታወቂያዎን ያረጋግጡ)።'
    };
  }

  return { allowed: true, message: '' };
}
