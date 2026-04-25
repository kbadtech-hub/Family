const fs = require('fs');
const path = require('path');

const locales = ['am', 'ar', 'om'];
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

locales.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  let currentData = {};
  if (fs.existsSync(filePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Error parsing ${filePath}`, e);
    }
  }

  // Deep merge tool to ensure structure matches EN
  const sync = (template, current) => {
    const result = { ...current };
    for (const key in template) {
      if (typeof template[key] === 'object' && template[key] !== null && !Array.isArray(template[key])) {
        result[key] = sync(template[key], current[key] || {});
      } else if (result[key] === undefined) {
        // Fallback to EN if missing, so the app doesn't crash
        result[key] = template[key];
      }
    }
    return result;
  };

  const synchronizedData = sync(en, currentData);
  fs.writeFileSync(filePath, JSON.stringify(synchronizedData, null, 2));
  console.log(`Synchronized ${lang}.json with en.json`);
});
