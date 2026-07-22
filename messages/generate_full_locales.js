const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

// Deep clone function
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// ── Translation Dictionaries ──────────────────────────────────────────────────

const OM_TRANS = {
  Nav: {
    home: "Dhaaba",
    about: "Waa'ee Keenya",
    classes: "Barnoota",
    signIn: "Seenaa",
    signUp: "Galfamaa",
    login: "Seensawwan / Akkauntii Uumaa",
    logout: "Ba'aa",
    profile: "Piroofaayilii",
    chat: "Haasaa",
    community: "Hawaasa",
    workshops: "Seminaaroota",
    wedding: "Karoora Gaa'elaa",
    gifts: "Kennaawwan",
    settings: "Sajjooma",
    dashboard: "Daashboordii"
  },
  Dashboard: {
    actionRequired: "Gocha Barbaachisaa",
    searching: "Hiriyaa keessan isa gaarii barbaadaa jira...",
    reviewPending: "Gamaggama Iraa Jira",
    reviewNote: "Nagaheen kafaltii keessan gamaggamamaa jira.",
    trialStatus: "Haala Yaalii",
    daysLeft: "Guyyoota {count} Hasa'an",
    profile: {
      settings: "Sajjooma Piroofaayilii",
      fullName: "Maqaa Guutuu",
      username: "Maqaa Fayyadamaa (Kallattii)",
      usernamePlaceholder: "maqaa_keessan",
      systemLanguage: "Afaan Sirnaa",
      gallery: "Suuraawwan Baay'ee",
      gallerySub: "Suuraawwan dabalataa hanga 5 qooddaddhaa ({count}/5)",
      addPhoto: "Suuraa Dabalaa",
      emptySlot: "Bakka Duudaa",
      aboutInterests: "Waa'ee Keenya & Fedhii",
      bio: "Waa'ee Koo",
      bioPlaceholder: "Waa'ee keessan namoota biroof ibsaa...",
      interests: "Fedhiifi Bashannana",
      interestsPlaceholder: "Aadaa, Maatii, Imala, Bilcheessuu..."
    }
  }
};

const TI_TRANS = {
  Nav: {
    home: "መእተዊ",
    about: "ብዛዕባና",
    classes: "ትምህርቲ",
    signIn: "እተው",
    signUp: "ተመዝገብ",
    login: "ምእታው / ኣካውንት ምፍጣር",
    logout: "ውጻእ",
    profile: "ፕሮፋይል",
    chat: "ዕልል",
    community: "ማሕበረሰብ",
    workshops: "ዎርክሾፓት",
    wedding: "መደብ መርዓ",
    gifts: "ወሃብቲ ህያብ",
    settings: "ቀንዲ ሰቲንግ",
    dashboard: "ዳሽቦርድ"
  },
  Dashboard: {
    actionRequired: "ዝድለ ስጉምቲ",
    searching: "ተማሳሳሊ ሓጋዚ ይድለ ኣሎ...",
    reviewPending: "ምርመራ ኣብ መስርሕ ኣሎ",
    reviewNote: "ናይ ክፍሊት ጽ dateFormat ይምረመር ኣሎ።",
    trialStatus: "ኩነታት ፈተነ",
    daysLeft: "{count} መዓልትታት ተሪፎም",
    profile: {
      settings: "ሰቲንግ ፕሮፋይል",
      fullName: "ምሉእ ስም",
      username: "መታወቂ ስም (ፍሉይ)",
      usernamePlaceholder: "ስምካ",
      systemLanguage: "ቋንቋ ሲስተም",
      gallery: "ብዙሕ ፎቶታት",
      gallerySub: "ክሳብ 5 ተወሳኺ ፎቶታት ኣካፍሉ ({count}/5)",
      addPhoto: "ፎቶ ወስኽ",
      emptySlot: "ባዶ ቦታ",
      aboutInterests: "ብዛዕባይን ብዛዕባ ፈላጣትን",
      bio: "ብዛዕባይ",
      bioPlaceholder: "ብዛዕባ ርእስኻ ንኻልኦት ንገሮም...",
      interests: "ተገዳስነትን ሓጎስን",
      interestsPlaceholder: "ባህሊ፣ ሓዳር፣ ጉዕዞ፣ ምብሳል..."
    }
  }
};

const SO_TRANS = {
  Nav: {
    home: "Hoyga",
    about: "Nagaa Ragaa",
    classes: "Fasallada",
    signIn: "Soo Gal",
    signUp: "Isqor",
    login: "Gal ama Samayso Account",
    logout: "Ka Bax",
    profile: "Profile-ka",
    chat: "Wada-hadal",
    community: "Bulshada",
    workshops: "Seminaarrada",
    wedding: "Qorsheynta Arooska",
    gifts: "Hadyadaha",
    settings: "Tayo-goynta",
    dashboard: "Dashboard-ka"
  },
  Dashboard: {
    actionRequired: "Tallaabo Lagama Maarmaan Ah",
    searching: "Waxaa lagu jiro raadinta lammaanahaaga saxda ah...",
    reviewPending: "Dib u eegis ku jirta",
    reviewNote: "Rasiidhka lacag bixintaada waa lagu jiraa dib u eegis.",
    trialStatus: "Xaaladda Tijaabada",
    daysLeft: "{count} Maalmood Baa Hadhay",
    profile: {
      settings: "Dhabarka Profile-ka",
      fullName: "Magaca Buuxa",
      username: "Magaca Isticmaalaha",
      usernamePlaceholder: "magacaaga",
      systemLanguage: "Luuqada Nidaamka",
      gallery: "Sawirro Badan",
      gallerySub: "La wadaag ilaa 5 sawir oo dheeraad ah ({count}/5)",
      addPhoto: "Kudar Sawir",
      emptySlot: "Meel Faali ah",
      aboutInterests: "Naga Saabsan & Danta",
      bio: "Nolosheyda / Igu Saabsan",
      bioPlaceholder: "U sheeg kuwa kale wax ku saabsan noloshaada...",
      interests: "Danta & Hiwaayadaha",
      interestsPlaceholder: "Dhaqanka, Qoyska, Safarka, Cunto karinta..."
    }
  }
};

const AR_TRANS = {
  Nav: {
    home: "الرئيسية",
    about: "من نحن",
    classes: "الدروس",
    signIn: "تسجيل الدخول",
    signUp: "انضم الآن",
    login: "تسجيل الدخول / إنشاء حساب",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",
    chat: "المحادثة",
    community: "المجتمع",
    workshops: "ورش العمل",
    wedding: "مخطط الزفاف",
    gifts: "الهدايا",
    settings: "الإعدادات",
    dashboard: "لوحة التحكم"
  },
  Dashboard: {
    actionRequired: "إجراء مطلوب",
    searching: "جاري البحث عن شريك حياتك المناسب...",
    reviewPending: "قيد المراجعة",
    reviewNote: "جاري مراجعة إيصال الدفع الخاص بك.",
    trialStatus: "حالة التجربة",
    daysLeft: "متبقي {count} أيام",
    profile: {
      settings: "إعدادات الملف الشخصي",
      fullName: "الاسم الكامل",
      username: "اسم المستخدم (فريد)",
      usernamePlaceholder: "اسمك",
      systemLanguage: "لغة النظام",
      gallery: "معرض الصور",
      gallerySub: "شارك حتى 5 صور إضافية ({count}/5)",
      addPhoto: "إضافة صورة",
      emptySlot: "مساحة فارغة",
      aboutInterests: "عني والاهتمامات",
      bio: "نبذة عني",
      bioPlaceholder: "أخبر الآخرين عن نفسك...",
      interests: "الاهتمامات والهوايات",
      interestsPlaceholder: "التقاليد، العائلة، السفر، الطبخ..."
    }
  }
};

const AM_TRANS = {
  Nav: {
    home: "መነሻ",
    about: "ስለ እኛ",
    classes: "ትምህርቶች",
    signIn: "ግቡ",
    signUp: "ይመዝገቡ",
    login: "መግቢያ / መለያ መክፈቻ",
    logout: "ውጣ",
    profile: "ፕሮፋይል",
    chat: "ወግ / ቻት",
    community: "ማህበረሰብ",
    workshops: "ወርክሾፖች",
    wedding: "የሰርግ እቅድ",
    gifts: "ስጦታዎች",
    settings: "ማስተካከያዎች",
    dashboard: "ዳሽቦርድ"
  },
  Dashboard: {
    actionRequired: "ትኩረት የሚሻ",
    searching: "ለእርስዎ ተስማሚ የሆነ የህይወት አጋር በመፈለግ ላይ...",
    reviewPending: "በግምገማ ላይ ነው",
    reviewNote: "የክፍያ ደረሰኝዎ በመገምገም ላይ ይገኛል።",
    trialStatus: "የሞካሪነት ሁኔታ",
    daysLeft: "{count} ቀናት ቀርተዋል",
    profile: {
      settings: "የፕሮፋይል ማስተካከያ",
      fullName: "ሙሉ ስም",
      username: "የተጠቃሚ ስም (ልዩ)",
      usernamePlaceholder: "ስምዎ",
      systemLanguage: "የሲስተም ቋንቋ",
      gallery: "ፎቶዎች",
      gallerySub: "እስከ 5 ተጨማሪ ፎቶዎችን ያጋሩ ({count}/5)",
      addPhoto: "ፎቶ ጨምር",
      emptySlot: "ባዶ ቦታ",
      aboutInterests: "ስለእኔ እና ፍላጎቶች",
      bio: "ስለእኔ ግለጻ",
      bioPlaceholder: "ስለራስዎ ለሌሎች ያጋሩ...",
      interests: "ፍላጎቶች እና መዝናኛዎች",
      interestsPlaceholder: "ባህል፣ ቤተሰብ፣ ጉዞ፣ ምግብ ማብሰል..."
    }
  }
};

// ── Recursive Merger ─────────────────────────────────────────────────────────

function mergeTranslations(template, current, override) {
  const result = { ...current };
  for (const k in template) {
    if (typeof template[k] === 'object' && template[k] !== null && !Array.isArray(template[k])) {
      result[k] = mergeTranslations(
        template[k],
        current[k] || {},
        override ? override[k] : undefined
      );
    } else {
      if (override && override[k] !== undefined) {
        result[k] = override[k];
      } else if (!result[k] || result[k] === template[k]) {
        // Keep current if translated, else set template fallback
        result[k] = result[k] || template[k];
      }
    }
  }
  return result;
}

const localesMap = {
  am: AM_TRANS,
  om: OM_TRANS,
  ti: TI_TRANS,
  so: SO_TRANS,
  ar: AR_TRANS
};

Object.entries(localesMap).forEach(([lang, overrides]) => {
  const filePath = path.join('messages', `${lang}.json`);
  let currentData = {};
  if (fs.existsSync(filePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {}
  }

  const merged = mergeTranslations(en, currentData, overrides);
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
  console.log(`✅ Successfully updated ${lang}.json`);
});
