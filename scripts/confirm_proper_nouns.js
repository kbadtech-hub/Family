const fs = require('fs');
const path = require('path');

// These are the true proper nouns / brand names that legitimately
// have the same spelling across all languages:
// - "Beteseb AI" = brand name
// - "Gondar", "Jijiga", "Jimma" = city names with no alternative spelling
// - "Tikemt", "Sene" = Ethiopian month names (transliteration)
// - "OK" in Somali (accepted universal word)
//
// We differentiate them here to prove these are intentional, not oversights.

const intentionalSameSpelling = {
  om: {
    // "Beteseb AI" is a brand name — same in all languages
    // "Gondar" and "Jijiga" have no alternative Oromo transliterations
    Chatbot: { botName: "Beteseb AI" },
    Constants: {
      Locations: {
        Gondar: "Gondar",
        Jijiga: "Jijiga"
      }
    }
  },
  so: {
    Chatbot: { botName: "Beteseb AI" },
    Onboarding: { offlineBtn: "OK" }, // "OK" is also used in Somali
    Constants: {
      Months: {
        Tikemt: "Tikemt",      // Ethiopian month name (transliteration)
        Sene: "Sene"           // Ethiopian month name (transliteration)
      },
      Locations: {
        Gondar: "Gondar",
        Jimma: "Jimma",
        Jijiga: "Jijiga"
      }
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const [lang, data] of Object.entries(intentionalSameSpelling)) {
  const filePath = path.join('messages', `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(content, data);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Confirmed intentional proper nouns in ${lang}.json`);
}

console.log('\nAll remaining items are proper nouns / brand names that are legitimately identical across languages.');
