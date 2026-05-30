export interface ZodiacMatrix {
  [key: string]: { [key: string]: number };
}

// Zodiac Compatibility matrix based on Astrological Element affinities
export const ZODIAC_COMPATIBILITY: ZodiacMatrix = {
  "Aries": { "Leo": 95, "Sagittarius": 90, "Libra": 85, "Aries": 80, "Gemini": 75, "Aquarius": 75, "Taurus": 55, "Virgo": 55, "Capricorn": 60, "Cancer": 50, "Scorpio": 50, "Pisces": 45 },
  "Taurus": { "Virgo": 95, "Capricorn": 90, "Taurus": 80, "Cancer": 85, "Scorpio": 85, "Pisces": 75, "Leo": 60, "Aquarius": 55, "Aries": 55, "Gemini": 50, "Libra": 50, "Sagittarius": 45 },
  "Gemini": { "Libra": 95, "Aquarius": 90, "Gemini": 80, "Aries": 75, "Leo": 75, "Sagittarius": 85, "Virgo": 60, "Pisces": 50, "Taurus": 50, "Cancer": 55, "Scorpio": 55, "Capricorn": 45 },
  "Cancer": { "Scorpio": 95, "Pisces": 90, "Cancer": 80, "Taurus": 85, "Virgo": 85, "Capricorn": 85, "Aries": 60, "Leo": 55, "Sagittarius": 50, "Gemini": 55, "Libra": 55, "Aquarius": 45 },
  "Leo": { "Aries": 95, "Sagittarius": 90, "Leo": 80, "Gemini": 75, "Libra": 75, "Aquarius": 85, "Scorpio": 60, "Taurus": 55, "Cancer": 55, "Virgo": 50, "Capricorn": 50, "Pisces": 45 },
  "Virgo": { "Taurus": 95, "Capricorn": 90, "Virgo": 80, "Cancer": 85, "Scorpio": 75, "Pisces": 85, "Gemini": 60, "Sagittarius": 50, "Aries": 55, "Leo": 50, "Libra": 55, "Aquarius": 45 },
  "Libra": { "Gemini": 95, "Aquarius": 90, "Libra": 80, "Aries": 85, "Leo": 75, "Sagittarius": 75, "Cancer": 60, "Capricorn": 55, "Taurus": 50, "Virgo": 55, "Scorpio": 50, "Pisces": 45 },
  "Scorpio": { "Cancer": 95, "Pisces": 90, "Scorpio": 80, "Taurus": 85, "Virgo": 75, "Capricorn": 75, "Leo": 60, "Aquarius": 50, "Aries": 50, "Gemini": 55, "Libra": 50, "Sagittarius": 45 },
  "Sagittarius": { "Leo": 95, "Aries": 90, "Sagittarius": 80, "Gemini": 85, "Libra": 75, "Aquarius": 75, "Virgo": 60, "Pisces": 55, "Taurus": 45, "Cancer": 50, "Scorpio": 45, "Capricorn": 50 },
  "Capricorn": { "Taurus": 95, "Virgo": 90, "Capricorn": 80, "Cancer": 85, "Scorpio": 75, "Pisces": 75, "Libra": 60, "Aries": 50, "Gemini": 45, "Leo": 50, "Sagittarius": 50, "Aquarius": 55 },
  "Aquarius": { "Gemini": 95, "Libra": 90, "Aquarius": 80, "Aries": 75, "Leo": 85, "Sagittarius": 75, "Scorpio": 60, "Taurus": 50, "Cancer": 45, "Virgo": 45, "Capricorn": 55, "Pisces": 50 },
  "Pisces": { "Cancer": 95, "Scorpio": 90, "Pisces": 80, "Taurus": 75, "Virgo": 85, "Capricorn": 75, "Sagittarius": 60, "Gemini": 50, "Aries": 45, "Leo": 45, "Libra": 45, "Aquarius": 50 }
};

export function calculateCompatibility(user: any, candidate: any): number {
  if (!user || !candidate) return 75;

  let score = 70; // Base baseline score

  // 1. Zodiac Sign Compatibility (Max 30%)
  if (user.star_sign && candidate.star_sign) {
    const zodiacScore = ZODIAC_COMPATIBILITY[user.star_sign]?.[candidate.star_sign] || 75;
    // zodiacScore is between 45 and 95. We map this contribution to up to +20 or -15 to score
    score += (zodiacScore - 70) * 0.4;
  }

  // 2. Shared Hobbies / Interests (Max 30%)
  // Hobbies might be arrays or comma separated strings
  let userHobbies: string[] = [];
  if (Array.isArray(user.hobbies)) {
    userHobbies = user.hobbies;
  } else if (typeof user.hobbies === 'string') {
    userHobbies = user.hobbies.split(',').map((h: string) => h.trim());
  }

  let candidateHobbies: string[] = [];
  if (Array.isArray(candidate.hobbies)) {
    candidateHobbies = candidate.hobbies;
  } else if (typeof candidate.hobbies === 'string') {
    candidateHobbies = candidate.hobbies.split(',').map((h: string) => h.trim());
  }

  if (userHobbies.length > 0 && candidateHobbies.length > 0) {
    const shared = userHobbies.filter((h: string) => 
      candidateHobbies.some((ch: string) => ch.toLowerCase() === h.toLowerCase())
    );
    score += Math.min(20, shared.length * 6); // Add up to 20% for common hobbies
  }

  // 3. Career Habits, Values & Conflict Resolution (Max 20%)
  if (user.family_values && candidate.family_values) {
    if (user.family_values.toLowerCase() === candidate.family_values.toLowerCase()) {
      score += 7;
    }
  }
  if (user.conflict_resolution && candidate.conflict_resolution) {
    if (user.conflict_resolution.toLowerCase() === candidate.conflict_resolution.toLowerCase()) {
      score += 7;
    }
  }
  if (user.finance_habit && candidate.finance_habit) {
    if (user.finance_habit.toLowerCase() === candidate.finance_habit.toLowerCase()) {
      score += 6;
    }
  }

  // 4. Age Preferences (Max 20%)
  if (candidate.birth_date && user.partner_age_min && user.partner_age_max) {
    const birthYear = new Date(candidate.birth_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const candidateAge = currentYear - birthYear;
    
    if (candidateAge >= user.partner_age_min && candidateAge <= user.partner_age_max) {
      score += 10;
    } else {
      score -= 5;
    }
  }

  // 5. Shared Religion and marital intent bonuses
  if (user.religion && candidate.religion && user.religion.toLowerCase() === candidate.religion.toLowerCase()) {
    score += 5;
  }
  if (user.partner_intent && candidate.partner_intent && user.partner_intent.toLowerCase() === candidate.partner_intent.toLowerCase()) {
    score += 5;
  }

  // Cap score realistically between 55% and 98%
  return Math.min(98, Math.max(55, Math.floor(score)));
}
