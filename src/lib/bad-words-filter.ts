/**
 * Beteseb Community Bad Words Filter
 * Censors inappropriate content in posts and messages
 */

// Combined English + Amharic inappropriate words list (Ethiopic & Romanized)
const BAD_WORDS: string[] = [
  // English
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap', 'piss',
  'cock', 'dick', 'pussy', 'whore', 'slut', 'nigger', 'faggot',
  'idiot', 'stupid', 'moron', 'retard', 'kill yourself', 'kys',
  'hate you', 'ugly', 'loser', 'freak', 'porn', 'sex', 'asshole',
  // Amharic Ethiopic
  'ሸርሙጣ', 'ሴሰኛ', 'ቂጥ', 'ቂንጥር', 'ዲክ', 'እንክርት', 'በላተኛ',
  'ደደብ', 'ሌባ', 'በግ', 'አህያ', 'ሉጥ', 'ውሻ', 'ጅብ', 'ጣኦት',
  // Amharic phonetic equivalents (romanized)
  'leba', 'dedeb', 'shermuta', 'kit', 'kintir', 'lut', 'wusha',
  'ye-aba', 'yeaba', 'dingay', 'azmari'
];

export function containsBadWords(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => {
    // Escape special regex chars
    const escapedWord = word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
    // Using word boundary for latin words, but simple inclusion for non-latin Ethiopic since word boundary \b doesn't work for Ethiopic characters in standard JS regex
    const isEthiopic = /[\u1200-\u137F]/.test(word);
    const regex = isEthiopic 
      ? new RegExp(escapedWord, 'gi')
      : new RegExp(`\\b${escapedWord}\\b`, 'gi');
    return regex.test(lowerText);
  });
}

export function filterText(text: string): string {
  if (!text) return text;
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const escapedWord = word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
    const isEthiopic = /[\u1200-\u137F]/.test(word);
    const regex = isEthiopic 
      ? new RegExp(escapedWord, 'gi')
      : new RegExp(`\\b${escapedWord}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

export function filterAndWarn(text: string): { filtered: string; hadBadWords: boolean } {
  const hadBadWords = containsBadWords(text);
  return {
    filtered: filterText(text),
    hadBadWords
  };
}
