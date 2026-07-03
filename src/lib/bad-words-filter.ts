/**
 * Beteseb Community Bad Words Filter
 * Censors inappropriate content in posts and messages
 */

// Combined English + Amharic inappropriate words list
const BAD_WORDS: string[] = [
  // English profanity
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap', 'piss',
  'cock', 'dick', 'pussy', 'whore', 'slut', 'nigger', 'faggot',
  'idiot', 'stupid', 'moron', 'retard', 'kill yourself', 'kys',
  'hate you', 'ugly', 'loser', 'freak', 'dumbass', 'jackass',
  'asshole', 'bullshit', 'motherfucker', 'cunt',
  // Amharic/Tigrinya phonetic equivalents (romanized)
  'leba', 'dedeb', 'bahre', 'dingay', 'yeaba', 'azmari',
  'gematam', 'wusha', 'ahiya', 'tibs', 'kesel',
];

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns true if the text contains any bad words (case-insensitive, whole-word matching)
 */
export function containsBadWords(text: string): boolean {
  if (!text) return false;
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    return regex.test(text);
  });
}

/**
 * Replaces all bad words in the text with *** (case-insensitive, whole-word matching)
 */
export function filterText(text: string): string {
  if (!text) return text;
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

/**
 * Filters text and reports whether bad words were found
 */
export function filterAndWarn(text: string): { filtered: string; hadBadWords: boolean } {
  const hadBadWords = containsBadWords(text);
  return {
    filtered: filterText(text),
    hadBadWords,
  };
}
