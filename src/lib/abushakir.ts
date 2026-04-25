/**
 * Beteseb Abushakir Engine
 * Handles Ethiopian Calendar conversion and Star Sign calculation.
 */

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
}

export type StarSign = 
  | 'Hamel' | 'Sewr' | 'Jauza' | 'Sertan' 
  | 'Esed' | 'Sunbula' | 'Mizan' | 'Akreb' 
  | 'Qews' | 'Jedye' | 'Delwi' | 'Hout';

const STAR_SIGNS: StarSign[] = [
  'Hamel', 'Sewr', 'Jauza', 'Sertan', 
  'Esed', 'Sunbula', 'Mizan', 'Akreb', 
  'Qews', 'Jedye', 'Delwi', 'Hout'
];

/**
 * Basic Gregorian to Ethiopian conversion
 * This is a simplified version suitable for birth date mapping.
 */
export function toEthiopianDate(date: Date): EthiopianDate {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  let eYear = gYear - 8;
  
  // Transition happened around Sept 11/12
  const isLeap = (eYear + 1) % 4 === 0;
  const meskerem1 = isLeap ? 12 : 11;

  let eMonth: number;
  let eDay: number;

  if (gMonth < 9 || (gMonth === 9 && gDay < meskerem1)) {
    eYear = gYear - 8;
    // Calculation of day/month within the 13 months
    // For simplicity, we use an approximation based on 30-day months
    // Adjusting for the shift
    const dayOfYear = Math.floor((date.getTime() - new Date(gYear - 1, 8, meskerem1).getTime()) / (1000 * 60 * 60 * 24));
    eMonth = Math.floor(dayOfYear / 30) + 1;
    eDay = (dayOfYear % 30) + 1;
  } else {
    eYear = gYear - 7;
    const dayOfYear = Math.floor((date.getTime() - new Date(gYear, 8, meskerem1).getTime()) / (1000 * 60 * 60 * 24));
    eMonth = Math.floor(dayOfYear / 30) + 1;
    eDay = (dayOfYear % 30) + 1;
  }

  return { year: eYear, month: eMonth, day: eDay };
}

/**
 * Maps Ethiopian Month/Day to one of the 12 Star Signs.
 * Logic based on standard astrological cycles mapped to Ethiopian months.
 */
export function calculateStarSign(date: Date, time: string): StarSign {
  const ethDate = toEthiopianDate(date);
  
  // Index 0-11 based on month. 
  // Meskerem (1) maps to Hamel (0), etc.
  // This is a simplified mapping as requested.
  let index = (ethDate.month - 1) % 12;
  
  // If month is 13 (Pagume), we map it to Hout or Hamel based on day
  if (ethDate.month === 13) {
    index = 11; // Hout
  }

  return STAR_SIGNS[index];
}

export const StarSignLabels: Record<StarSign, string> = {
  'Hamel': 'Hamel (ሐምል) - Aries',
  'Sewr': 'Sewr (ሰውር) - Taurus',
  'Jauza': 'Jauza (ጀውዛ) - Gemini',
  'Sertan': 'Sertan (ሰርጣን) - Cancer',
  'Esed': 'Esed (አሰድ) - Leo',
  'Sunbula': 'Sunbula (ሱንቡላ) - Virgo',
  'Mizan': 'Mizan (ሚዛን) - Libra',
  'Akreb': 'Akreb (አቅረብ) - Scorpio',
  'Qews': 'Qews (ቀውስ) - Sagittarius',
  'Jedye': 'Jedye (ጄዲ) - Capricorn',
  'Delwi': 'Delwi (ደልዊ) - Aquarius',
  'Hout': 'Hout (ሑት) - Pisces',
};
