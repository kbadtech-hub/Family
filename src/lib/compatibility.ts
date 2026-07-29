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

/**
 * Calculates Jaccard Similarity Index between two sets of tags.
 * Formula: |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(tagsA: string[] = [], tagsB: string[] = []): number {
  if (!tagsA.length || !tagsB.length) return 0;
  
  const setA = new Set(tagsA.map(t => t.trim().toLowerCase()));
  const setB = new Set(tagsB.map(t => t.trim().toLowerCase()));
  
  let intersectionCount = 0;
  setA.forEach(tag => {
    if (setB.has(tag)) intersectionCount++;
  });
  
  const unionCount = new Set([...setA, ...setB]).size;
  if (unionCount === 0) return 0;
  
  return intersectionCount / unionCount;
}

/**
 * Computes Two-Way Directional Score from User A to User B
 * Based on Beteseb1 100% Weighted Matrix
 */
export function calculateDirectionalScore(userA: any, prefA: any, userB: any, prefB: any): number {
  let score = 0;

  // Category A: Demographics & Life (25%)
  if (userA.marital_status && userB.marital_status && userA.marital_status === userB.marital_status) {
    score += 7.0;
  }
  const cityA = userA.city || userA.location?.city || '';
  const cityB = userB.city || userB.location?.city || '';
  const regionA = userA.region || userA.location?.region || '';
  const regionB = userB.region || userB.location?.region || '';
  if (cityA && cityB && cityA.toLowerCase() === cityB.toLowerCase()) {
    score += 6.0;
  } else if (regionA && regionB && regionA.toLowerCase() === regionB.toLowerCase()) {
    score += 4.2;
  } else {
    score += 2.4;
  }

  const careerA = userA.career_category || userA.job_title || '';
  const careerB = userB.career_category || userB.job_title || '';
  if (careerA && careerB && careerA.toLowerCase() === careerB.toLowerCase()) {
    score += 6.0;
  } else {
    score += 3.0;
  }

  const financeA = userA.financial_mindset || userA.finance_habit || '';
  const financeB = userB.financial_mindset || userB.finance_habit || '';
  if (financeA && financeB && financeA.toLowerCase() === financeB.toLowerCase()) {
    score += 6.0;
  } else {
    score += 3.0;
  }

  // Category B: Personality & Dynamics (25%)
  if (userA.family_values && userB.family_values && userA.family_values === userB.family_values) {
    score += 7.5;
  }
  if (userA.conflict_resolution && userB.conflict_resolution) {
    if (userA.conflict_resolution === userB.conflict_resolution) {
      score += 7.5;
    } else if (
      (userA.conflict_resolution === 'immediate_discussion' && userB.conflict_resolution === 'cool_off_then_talk') ||
      (userA.conflict_resolution === 'cool_off_then_talk' && userB.conflict_resolution === 'immediate_discussion')
    ) {
      score += 3.75;
    }
  }

  const relImpA = userA.religious_importance_level || 'medium';
  const relImpB = userB.religious_importance_level || 'medium';
  score += relImpA === relImpB ? 5.0 : 2.5;

  const childPrefA = userA.future_children || userA.child_preference || '';
  const childPrefB = userB.future_children || userB.child_preference || '';
  if (childPrefA && childPrefB) {
    if (childPrefA === childPrefB) {
      score += 5.0;
    } else {
      score -= 20.0; // Penalty
    }
  }

  // Category C: Selected Key Preferences (35%) via Jaccard Index
  const tagsA = userA.selected_tags || userA.spouse_requirements || [];
  const tagsB = userB.selected_tags || userB.spouse_requirements || [];
  const jaccard = calculateJaccardSimilarity(tagsA, tagsB);
  score += jaccard * 35.0;

  // Category D: Interests & Lifestyle (15%)
  const habitsA = userA.lifestyle_habits || (userA.lifestyle ? [userA.lifestyle] : []);
  const habitsB = userB.lifestyle_habits || (userB.lifestyle ? [userB.lifestyle] : []);
  const habitsJaccard = calculateJaccardSimilarity(habitsA, habitsB);
  score += habitsJaccard * 8.0;

  const hobbiesA = userA.hobbies || [];
  const hobbiesB = userB.hobbies || [];
  const hobbiesJaccard = calculateJaccardSimilarity(hobbiesA, hobbiesB);
  score += hobbiesJaccard * 7.0;

  // Penalties
  if (cityA && cityB && cityA.toLowerCase() !== cityB.toLowerCase() && !userA.relocation_intent && !userB.relocation_intent) {
    score -= 15.0;
  }
  const acceptsChildrenB = prefB?.accepts_has_children ?? true;
  if (userA.has_children === 'Yes' && !acceptsChildrenB) {
    score -= 25.0;
  }

  return Math.max(0, score);
}

/**
 * Two-Way Geometric Mean Compatibility Calculator
 * Final Score = sqrt(Score_A_to_B * Score_B_to_A)
 */
export function calculateTwoWayGeometricMeanScore(
  userA: any,
  prefA: any,
  userB: any,
  prefB: any
): { finalCompatibilityScore: number; scoreAtoB: number; scoreBtoA: number } {
  const scoreAtoB = calculateDirectionalScore(userA, prefA, userB, prefB);
  const scoreBtoA = calculateDirectionalScore(userB, prefB, userA, prefA);
  
  const finalCompatibilityScore = Number(Math.sqrt(scoreAtoB * scoreBtoA).toFixed(2));
  
  return {
    finalCompatibilityScore,
    scoreAtoB: Number(scoreAtoB.toFixed(2)),
    scoreBtoA: Number(scoreBtoA.toFixed(2))
  };
}

