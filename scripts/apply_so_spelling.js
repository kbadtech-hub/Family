const fs = require('fs');
const path = require('path');

const soUpdate = {
  Dashboard: {
    profile: {
      defaultCity: "Caddis Abeba"
    }
  },
  Chatbot: {
    btn: { abushakir: "Abuushaakir" },
    botName: "Beteseb AI"
  },
  Constants: {
    Religions: {
      Muslim: "Muslin"
    },
    Months: {
      Meskerem: "Meskarem",
      Tikemt: "Tikemt",
      Hidar: "Xidaar",
      Tahsas: "Tahsaas",
      Tir: "Tiir",
      Yekatit: "Yekaatiit",
      Megabit: "Magaabiit",
      Miazia: "Miyaasiya",
      Genbot: "Ginboot",
      Sene: "Sene",
      Hamle: "Xamle",
      Nehase: "Nahaase",
      Pagume: "Paguume"
    },
    Locations: {
      "Addis Ababa": "Caddis Abeba",
      "Dire Dawa": "Diri Dhabe",
      "Mekelle": "Makelle",
      "Adama": "Adaama",
      "Bahir Dar": "Baxar Daar",
      "Gondar": "Gondar",
      "Hawassa": "Xawasa",
      "Jimma": "Jimma",
      "Jijiga": "Jijiga"
    },
    Countries: {
      Qatar: "Qadar"
    }
  },
  Contact: {
    hqAddress: "London, Ingiiriiska"
  }
};

const omUpdate = {
  Chatbot: {
    botName: "Beteseb AI"
  },
  Constants: {
    Locations: {
      Gondar: "Gondar",
      Jijiga: "Jijiga"
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

const soFile = path.join('messages', 'so.json');
let soContent = JSON.parse(fs.readFileSync(soFile, 'utf8'));
deepMerge(soContent, soUpdate);
fs.writeFileSync(soFile, JSON.stringify(soContent, null, 2), 'utf8');

const omFile = path.join('messages', 'om.json');
let omContent = JSON.parse(fs.readFileSync(omFile, 'utf8'));
deepMerge(omContent, omUpdate);
fs.writeFileSync(omFile, JSON.stringify(omContent, null, 2), 'utf8');

console.log('Soomaali and Oromoo updates finished.');
