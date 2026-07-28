const fs = require('fs');
const path = require('path');

const updates = {
  am: {
    Contact: {
      branchLabel: "ቅርንጫፍ ቢሮ",
      branchAddress: "አዲስ አበባ፣ ኢትዮጵያ",
      phone2: "+251 946 414018"
    }
  },
  om: {
    Community: {
      aiFilter: "Calala Qulqullinaa AI"
    },
    Auth: {
      terms: "Seera Tajaajilaa",
      privacy: "Iccitii Seeraa"
    },
    About: {
      badges: {
        level0: { title: "Badhaasa Nahaasaa" },
        level1: { title: "Badhaasa Meetaa" },
        level2: { title: "Badhaasa Warqii" },
        level3: { title: "Badhaasa Pilaatiiniyamii" },
        level4: { title: "Badhaasa Daayimandii" }
      }
    },
    Chatbot: {
      btn: { abushakir: "Abuushaakir" },
      botName: "Beteseb AI"
    },
    Onboarding: {
      fields: {
        starSign: "Mallattoo Urjii",
        unknown: "Kan Hin Beekamne"
      },
      idVerification: {
        idCaptured: "Waraqaan Waraaqaa Waraabameera",
        livePhoto: "Suuraa Kallattii Wal-simsiisuu",
        selfieCaptured: "Selfie-n Waraabameera"
      }
    },
    Constants: {
      Months: {
        Meskerem: "Mullata (Meskerem)",
        Tikemt: "Onkololeessa (Tikemt)",
        Hidar: "Sadaasa (Hidar)",
        Tahsas: "Muddee (Tahsas)",
        Tir: "Amajjii (Tir)",
        Yekatit: "Gurraandhala (Yekatit)",
        Megabit: "Bitootessa (Megabit)",
        Miazia: "Elba (Miazia)",
        Genbot: "Caamsaa (Genbot)",
        Sene: "Waxabajjii (Sene)",
        Hamle: "Adoolessa (Hamle)",
        Nehase: "Hagayya (Nehase)",
        Pagume: "Qaammee (Pagume)"
      },
      Locations: {
        Gondar: "Gondar",
        Jijiga: "Jijiga"
      },
      Countries: {
        "United Arab Emirates": "Imaraata Arabaa",
        "South Africa": "Afrikaa Kibbaa",
        "South Sudan": "Sudaan Kibbaa",
        Djibouti: "Jibuutii"
      }
    }
  },
  so: {
    Dashboard: {
      profile: {
        defaultCity: "Addis Ababa"
      }
    },
    Auth: {
      terms: "Shuruudaha Adeegga",
      privacy: "Siyaasadda Khaaska ah"
    },
    About: {
      badges: {
        level0: { title: "Biladda Nahaasta" },
        level1: { title: "Biladda Lacagta" },
        level2: { title: "Biladda Dahabka" },
        level3: { title: "Biladda Platinum-ka" },
        level4: { title: "Biladda Dheymanka" }
      }
    },
    Chatbot: {
      btn: { abushakir: "Abushakir" },
      botName: "Beteseb AI"
    },
    Constants: {
      Religions: {
        Muslim: "Muslim"
      },
      Values: {
        Liberal: "Liberaal"
      },
      Months: {
        Meskerem: "Meskerem",
        Tikemt: "Tikemt",
        Hidar: "Hidar",
        Tahsas: "Tahsas",
        Tir: "Tir",
        Yekatit: "Yekatit",
        Megabit: "Megabit",
        Miazia: "Miazia",
        Genbot: "Genbot",
        Sene: "Sene",
        Hamle: "Hamle",
        Nehase: "Nehase",
        Pagume: "Pagume"
      },
      Locations: {
        "Addis Ababa": "Addis Ababa",
        "Dire Dawa": "Dire Dawa",
        "Mekelle": "Mekelle",
        "Adama": "Adama",
        "Bahir Dar": "Bahir Dar",
        "Gondar": "Gondar",
        "Hawassa": "Hawassa",
        "Jimma": "Jimma",
        "Jijiga": "Jijiga"
      },
      Countries: {
        Qatar: "Qatar"
      }
    },
    Contact: {
      hqAddress: "London, England"
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

for (const lang of Object.keys(updates)) {
  const filePath = path.join('messages', `${lang}.json`);
  let content = {};
  if (fs.existsSync(filePath)) {
    content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  deepMerge(content, updates[lang]);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Final cleanups applied to ${lang}.json.`);
}
