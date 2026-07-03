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

// Map Ethiopian star sign keys to their English counterparts used in ZODIAC_COMPATIBILITY
export const ETHIOPIAN_TO_ENGLISH_ZODIAC: Record<string, string> = {
  'Hamel': 'Aries',
  'Sewr': 'Taurus',
  'Jauza': 'Gemini',
  'Sertan': 'Cancer',
  'Esed': 'Leo',
  'Sunbula': 'Virgo',
  'Mizan': 'Libra',
  'Akreb': 'Scorpio',
  'Qews': 'Sagittarius',
  'Jedye': 'Capricorn',
  'Delwi': 'Aquarius',
  'Hout': 'Pisces'
};

export function calculateCompatibility(user: any, candidate: any): number {
  let score = 50; // Base score

  // 1. Optional Abushakir Zodiac Compatibility - Max 10% weight (at most 10 points contribution)
  // De-weighted to serve as an optional cultural insight signal rather than a guarantee.
  const isAbushakirEnabled = user.enable_abushakir !== false && candidate.enable_abushakir !== false;
  if (isAbushakirEnabled && user.star_sign && candidate.star_sign) {
    const userSignEng = ETHIOPIAN_TO_ENGLISH_ZODIAC[user.star_sign] || user.star_sign;
    const candidateSignEng = ETHIOPIAN_TO_ENGLISH_ZODIAC[candidate.star_sign] || candidate.star_sign;
    const signScore = ZODIAC_COMPATIBILITY[userSignEng]?.[candidateSignEng] || 75;
    
    // Scale zodiac score (which goes up to 95) so it contributes up to 10 points
    const zodiacContribution = (signScore / 95) * 10;
    score += zodiacContribution;
  }

  // 2. Shared Hobbies - Max 25% weight (5 points per shared hobby, up to 5)
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
    score += Math.min(25, common.length * 5);
  }

  // 3. Values & Family Intent - Max 25% weight (12.5 points each)
  if (user.family_values && candidate.family_values && user.family_values === candidate.family_values) {
    score += 12.5;
  }
  if (user.conflict_resolution && candidate.conflict_resolution && user.conflict_resolution === candidate.conflict_resolution) {
    score += 12.5;
  }

  // 4. Age matching - Max 20% weight
  if (candidate.birth_date && user.partner_age_min && user.partner_age_max) {
    const age = new Date().getFullYear() - new Date(candidate.birth_date).getFullYear();
    if (age >= user.partner_age_min && age <= user.partner_age_max) {
      score += 20;
    }
  }

  // 5. Location matching - Max 20% weight
  if (user.partner_location && candidate.location) {
    const candidateCountry = typeof candidate.location === 'string' 
      ? candidate.location 
      : candidate.location?.country || '';
    
    const partnerLocations = Array.isArray(user.partner_location)
      ? user.partner_location
      : typeof user.partner_location === 'string'
      ? [user.partner_location]
      : [];
      
    const isLocationMatch = partnerLocations.some((loc: string) => 
      loc.trim().toLowerCase() === 'anywhere' || 
      loc.trim().toLowerCase() === candidateCountry.trim().toLowerCase()
    );
    if (isLocationMatch) {
      score += 20;
    }
  }

  // Keep realistic bounds between 50% and 99%
  return Math.min(99, Math.max(50, Math.floor(score)));
}
