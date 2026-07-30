/**
 * Ethiopian Soundex & Name Similarity Engine for Beteseb Platform
 */
import { normalizeNameToken, cleanText } from './normalization';

/**
 * Computes Levenshtein Distance between two strings.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Computes Jaro-Winkler Similarity score (0.0 to 1.0).
 */
export function calculateJaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  let matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  if (matchWindow < 0) matchWindow = 0;

  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3.0;

  // Winkler prefix adjustment
  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(maxPrefix, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  const p = 0.1; // scaling factor
  return jaro + prefix * p * (1 - jaro);
}

/**
 * Generates an Amharic/Ethiopic Soundex Hash Key.
 */
export function generateEthiopicSoundex(name: string): string {
  const normalized = normalizeNameToken(name);
  if (!normalized) return '0000';

  // Consonant base family grouping for Ge'ez characters
  let code = '';
  for (const char of normalized) {
    const charCode = char.charCodeAt(0);
    // Group Ge'ez unicode blocks into consonant families
    if (charCode >= 0x1200 && charCode <= 0x137c) {
      const family = Math.floor((charCode - 0x1200) / 8);
      code += family.toString(36);
    } else {
      code += char;
    }
  }

  return (code + '0000').substring(0, 8);
}

/**
 * Calculates total fuzzy similarity score between two names (0.0 to 1.0).
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeNameToken(name1);
  const norm2 = normalizeNameToken(name2);

  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;

  // Check Soundex match
  const soundex1 = generateEthiopicSoundex(norm1);
  const soundex2 = generateEthiopicSoundex(norm2);
  const isSoundexMatch = soundex1 === soundex2;

  const jaroWinkler = calculateJaroWinklerSimilarity(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const levenshtein = calculateLevenshteinDistance(norm1, norm2);
  const levenshteinSim = 1.0 - levenshtein / maxLen;

  let combinedScore = jaroWinkler * 0.6 + levenshteinSim * 0.4;
  if (isSoundexMatch) {
    combinedScore = Math.min(1.0, combinedScore + 0.15);
  }

  return Math.round(combinedScore * 100) / 100;
}
