/**
 * Data Normalization & Amharic/English Phonetic Utilities for Beteseb Platform
 */

// Mapping of variant Amharic homophones to canonical representations
const AMHARIC_HOMOPHONE_MAP: Record<string, string> = {
  // Ha family
  'ሐ': 'ሀ', 'ኀ': 'ሀ', 'ኻ': 'ሀ', 'ኅ': 'ሀ', 'ኃ': 'ሀ',
  'ሁ': 'ሁ', 'ሑ': 'ሁ', 'ኁ': 'ሁ',
  'ሂ': 'ሂ', 'ሒ': 'ሂ', 'ኂ': 'ሂ',
  'ሃ': 'ሃ', 'ሓ': 'ሃ',
  'ሄ': 'ሄ', 'ሔ': 'ሄ', 'ኄ': 'ሄ',
  'ህ': 'ህ', 'ሕ': 'ህ',
  'ሆ': 'ሆ', 'ሖ': 'ሆ', 'ኆ': 'ሆ',

  // Se family
  'ሠ': 'ሰ', 'ሡ': 'ሱ', 'ሢ': 'ሲ', 'ሣ': 'ሳ', 'ሤ': 'ሴ', 'ሥ': 'ስ', 'ሦ': 'ሶ',

  // Tse family
  'ፀ': 'ጸ', 'ፁ': 'ጹ', 'ፂ': 'ጺ', 'ፃ': 'ጻ', 'ጼ': 'ጼ', 'ፅ': 'ጽ', 'ፆ': 'ጾ',

  // Alef / Ayin family
  'ዐ': 'አ', 'ዑ': 'ኡ', 'ዒ': 'ኢ', 'ዓ': 'ኣ', 'ዔ': 'ኤ', 'ዕ': 'እ', 'ዖ': 'ኦ',
  'ኣ': 'አ', 'እ': 'አ', 'ኦ': 'አ', 'ኢ': 'አ', 'ኤ': 'አ', 'ኡ': 'አ',
};

// Common English <-> Amharic name transliterations
const EN_TO_AMHARIC_MAP: Record<string, string> = {
  'kalid': 'ካሊድ',
  'khaled': 'ካሊድ',
  'khalid': 'ካሊድ',
  'abebe': 'አበበ',
  'kebede': 'ከበደ',
  'mohammed': 'ሙሐመድ',
  'mohamed': 'ሙሐመድ',
  'muhammad': 'ሙሐመድ',
  'muhammed': 'ሙሐመድ',
  'muhamad': 'ሙሐመድ',
  'yosef': 'ዮሴፍ',
  'yoseph': 'ዮሴፍ',
  'joseph': 'ዮሴፍ',
  'bethel': 'ቤተልሔም',
  'betelhem': 'ቤተልሔም',
  'bethlehem': 'ቤተልሔም',
  'selam': 'ሰላም',
  'selamawit': 'ሰላማዊት',
  'solomon': 'ሰሎሞን',
  'dawit': 'ዳዊት',
  'david': 'ዳዊት',
  'daniel': 'ዳንኤል',
  'samuel': 'ሳሙኤል',
  'sara': 'ሣራ',
  'sarah': 'ሣራ',
  'hanan': 'ሐናን',
  'hanna': 'ሐና',
  'meron': 'ሜሮን',
  'helen': 'ሄለን',
  'marta': 'ማርታ',
  'martha': 'ማርታ',
  'tsehay': 'ፀሐይ',
  'almaz': 'አልማዝ',
  'worknesh': 'ወርቅነሽ',
};

/**
 * Standardizes raw text input by trimming, lowercasing, and removing punctuation.
 */
export function cleanText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'’]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes Amharic homophones into canonical single representations.
 */
export function normalizeAmharicText(text: string): string {
  const cleaned = cleanText(text);
  let result = '';
  for (const char of cleaned) {
    result += AMHARIC_HOMOPHONE_MAP[char] || char;
  }
  return result;
}

/**
 * Resolves English names to normalized Amharic representation if available,
 * otherwise cleans and returns normalized text.
 */
export function normalizeNameToken(name: string | null | undefined): string {
  if (!name) return '';
  const cleaned = cleanText(name);
  
  // Check transliteration map first
  if (EN_TO_AMHARIC_MAP[cleaned]) {
    return normalizeAmharicText(EN_TO_AMHARIC_MAP[cleaned]);
  }
  
  return normalizeAmharicText(cleaned);
}
