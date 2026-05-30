export interface ZodiacMatrix {
  [key: string]: { [key: string]: number };
}

// Zodiac compatibility element matrix
export const ZODIAC_COMPATIBILITY: ZodiacMatrix = {
  "Aries": { "Leo": 95, "Sagittarius": 90, "Libra": 85, "Capricorn": 60, "Cancer": 50 },
  "Taurus": { "Virgo": 95, "Capricorn": 90, "Scorpio": 85, "Leo": 60, "Aquarius": 55 },
  "Gemini": { "Libra": 95, "Aquarius": 90, "Sagittarius": 85, "Virgo": 60, "Pisces": 50 },
  "Cancer": { "Scorpio": 95, "Pisces": 90, "Capricorn": 85, "Aries": 60, "Libra": 55 },
  "Leo": { "Aries": 95, "Sagittarius": 90, "Aquarius": 85, "Scorpio": 60, "Taurus": 55 },
  "Virgo": { "Taurus": 95, "Capricorn": 90, "Pisces": 85, "Gemini": 60, "Sagittarius": 50 },
  "Libra": { "Gemini": 95, "Aquarius": 90, "Aries": 85, "Cancer": 60, "Capricorn": 55 },
  "Scorpio": { "Cancer": 95, "Pisces": 90, "Taurus": 85, "Leo": 60, "Aquarius": 50 },
  "Sagittarius": { "Leo": 95, "Aries": 90, "Gemini": 85, "Virgo": 60, "Pisces": 55 },
  "Capricorn": { "Taurus": 95, "Virgo": 90, "Cancer": 85, "Libra": 60, "Aries": 50 },
  "Aquarius": { "Gemini": 95, "Libra": 90, "Leo": 85, "Scorpio": 60, "Taurus": 50 },
  "Pisces": { "Cancer": 95, "Scorpio": 90, "Virgo": 85, "Sagittarius": 60, "Gemini": 50 }
};

export function calculateCompatibility(user: any, candidate: any): number {
  let score = 70; // Base score

  // 1. Zodiac Compatibility - 30% weight
  if (user.star_sign && candidate.star_sign) {
    const signScore = ZODIAC_COMPATIBILITY[user.star_sign]?.[candidate.star_sign] || 75;
    score += (signScore - 70) * 0.5;
  }

  // 2. Shared Hobbies - 30% weight
  if (user.hobbies && candidate.hobbies) {
    const userHobbies = Array.isArray(user.hobbies) 
      ? user.hobbies 
      : typeof user.hobbies === 'string' 
      ? user.hobbies.split(',') 
      : [];
    const candidateHobbies = Array.isArray(candidate.hobbies) 
      ? candidate.hobbies 
      : typeof candidate.hobbies === 'string' 
      ? candidate.hobbies.split(',') 
      : [];
      
    const common = userHobbies.filter((h: string) => 
      candidateHobbies.some((ch: string) => ch.trim().toLowerCase() === h.trim().toLowerCase())
    );
    score += common.length * 5; // +5% per shared hobby
  }

  // 3. Values & Family Intent - 20% weight
  if (user.family_values && candidate.family_values && user.family_values === candidate.family_values) {
    score += 8;
  }
  if (user.conflict_resolution && candidate.conflict_resolution && user.conflict_resolution === candidate.conflict_resolution) {
    score += 7;
  }

  // 4. Age & Location matching - 20% weight
  if (candidate.birth_date && user.partner_age_min && user.partner_age_max) {
    const age = new Date().getFullYear() - new Date(candidate.birth_date).getFullYear();
    if (age >= user.partner_age_min && age <= user.partner_age_max) {
      score += 10;
    }
  }

  // Keep realistic bounds between 50% and 99%
  return Math.min(99, Math.max(50, Math.floor(score)));
}
