const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const locales = ['om', 'ti', 'so', 'ar', 'am'];

locales.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const missingKeys = [];

  const inspect = (template, current, keyPath = '') => {
    for (const k in template) {
      const fullPath = keyPath ? `${keyPath}.${k}` : k;
      if (typeof template[k] === 'object' && template[k] !== null && !Array.isArray(template[k])) {
        inspect(template[k], current ? current[k] : undefined, fullPath);
      } else {
        if (!current || current[k] === undefined || current[k] === template[k]) {
          missingKeys.push({ path: fullPath, en: template[k] });
        }
      }
    }
  };

  inspect(en, data);
  console.log(`=== ${lang.toUpperCase()} Missing/Fallback Keys (${missingKeys.length}) ===`);
  missingKeys.slice(0, 20).forEach(m => console.log(`${m.path} -> "${m.en}"`));
});
