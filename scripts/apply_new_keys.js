const fs = require('fs');
const path = require('path');

// New keys added to en.json that need translations in all locales
const newKeys = {
  am: {
    Footer: {
      downloadApp: "አፕሊኬሽኑን አውርድ",
      developer: "የተሰራው በ Nolawi Digital Hub"
    },
    Onboarding: {
      offlineTitle: "ግንኙነት ተቋርጧል",
      offlineBtn: "እሺ"
    }
  },
  om: {
    Footer: {
      downloadApp: "Appii buufadhu",
      developer: "Kan hojjete Nolawi Digital Hub"
    },
    Onboarding: {
      offlineTitle: "Netwarkii Hin Jiru",
      offlineBtn: "Tole"
    }
  },
  ti: {
    Footer: {
      downloadApp: "ኣፕሊኬሽን ኣውርድ",
      developer: "ዝተሰርሐ ብ Nolawi Digital Hub"
    },
    Onboarding: {
      offlineTitle: "ርክብ ኢንተርነት ተቋሪጹ",
      offlineBtn: "ሕራይ"
    }
  },
  so: {
    Footer: {
      downloadApp: "Soo daji Abka",
      developer: "Waxaa sameeyay Nolawi Digital Hub"
    },
    Onboarding: {
      offlineTitle: "Xiriirka Internet Kama Jiro",
      offlineBtn: "OK"
    }
  },
  ar: {
    Footer: {
      downloadApp: "تحميل التطبيق",
      developer: "تطوير بواسطة Nolawi Digital Hub"
    },
    Onboarding: {
      offlineTitle: "لا يوجد اتصال بالإنترنت",
      offlineBtn: "حسناً"
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

for (const [lang, updates] of Object.entries(newKeys)) {
  const filePath = path.join('messages', `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(content, updates);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Applied new keys to ${lang}.json`);
}

console.log('Done!');
