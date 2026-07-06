import ethiopianDate from 'ethiopian-date';

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
 * Converts Gregorian date to Ethiopian date using the official ethiopian-date package.
 */
export function toEthiopianDate(date: Date): EthiopianDate {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  const [eYear, eMonth, eDay] = ethiopianDate.toEthiopian(gYear, gMonth, gDay);

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
