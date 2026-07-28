const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const locales = ['am', 'om', 'ti', 'so', 'ar'];

locales.forEach(lang => {
  const data = JSON.parse(fs.readFileSync(`messages/${lang}.json`, 'utf8'));
  const untranslated = [];
  function check(template, current, p = '') {
    for (const k in template) {
      const fullP = p ? `${p}.${k}` : k;
      if (typeof template[k] === 'object' && template[k] !== null && !Array.isArray(template[k])) {
        check(template[k], current ? current[k] : {}, fullP);
      } else {
        if (!current || current[k] === undefined || current[k] === template[k]) {
          const val = template[k];
          if (typeof val === 'string' && !val.includes('betesebhub@gmail.com') && !val.startsWith('+') && !/^\d+[\d%+,]*$/.test(val.trim())) {
            untranslated.push({ path: fullP, en: val, current: current ? current[k] : undefined });
          }
        }
      }
    }
  }
  check(en, data);
  console.log(`=== ${lang.toUpperCase()} (${untranslated.length} untranslated/fallback keys) ===`);
  untranslated.forEach(u => console.log(`  ${u.path}: "${u.en}" -> "${u.current}"`));
});
