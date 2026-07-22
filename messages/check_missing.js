const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const locales = ['am', 'om', 'ti', 'so', 'ar'];

const isEnglish = (str) => {
  if (typeof str !== 'string') return false;
  // If string contains English words and no Ge'ez or Arabic characters when it's not en
  const clean = str.trim();
  if (clean.length === 0) return false;
  // Check if string contains English words longer than 4 chars
  return /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(clean) && clean.length > 5;
};

locales.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`Missing file: ${filePath}`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let missingCount = 0;
  let englishFallbackCount = 0;

  const inspect = (template, current, keyPath = '') => {
    for (const k in template) {
      const fullPath = keyPath ? `${keyPath}.${k}` : k;
      if (typeof template[k] === 'object' && template[k] !== null && !Array.isArray(template[k])) {
        inspect(template[k], current ? current[k] : undefined, fullPath);
      } else {
        if (!current || current[k] === undefined) {
          missingCount++;
        } else if (typeof current[k] === 'string' && isEnglish(current[k]) && current[k] === template[k]) {
          englishFallbackCount++;
        }
      }
    }
  };

  inspect(en, data);
  console.log(`[${lang.toUpperCase()}] Missing keys: ${missingCount}, Untranslated English fallbacks: ${englishFallbackCount}`);
});
