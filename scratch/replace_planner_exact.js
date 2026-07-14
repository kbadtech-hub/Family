const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'WeddingPlannerView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace imports
content = content.replace(
  "import { useLocale } from 'next-intl';",
  "import { useLocale, useTranslations } from 'next-intl';"
);

// Insert hook and helpers
const hookTarget = '  const locale = useLocale();';
const hookReplacement = `  const locale = useLocale();
  const t = useTranslations('Dashboard.planner');

  const getPkgName = (pkgId: string, defaultName: string) => {
    try {
      return t(\`packages.\${pkgId}.name\`);
    } catch (e) {
      return defaultName;
    }
  };

  const getPkgDesc = (pkgId: string, defaultDesc: string) => {
    try {
      return t(\`packages.\${pkgId}.desc\`);
    } catch (e) {
      return defaultDesc;
    }
  };`;

content = content.replace(hookTarget, hookReplacement);

// Exact replacements
const exacts = [
  {
    target: "alert(locale === 'am' ? 'እባክዎ የታሰበውን የሰርግ ቀን ያስገቡ።' : 'Please select a wedding date.');",
    replacement: "alert(t('selectDateAlert'));"
  },
  {
    target: "alert(locale === 'am' \n        ? 'የሰርግ እቅድ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! አማካሪዎቻችን በቅርቡ ያነጋግሩዎታል።' \n        : 'Your wedding planning inquiry has been submitted! Our planners will contact you shortly.');",
    replacement: "alert(t('successAlert'));"
  },
  {
    target: "alert(locale === 'am' \r\n        ? 'የሰርግ እቅድ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! አማካሪዎቻችን በቅርቡ ያነጋግሩዎታል።' \r\n        : 'Your wedding planning inquiry has been submitted! Our planners will contact you shortly.');",
    replacement: "alert(t('successAlert'));"
  },
  {
    target: "{locale === 'am' ? 'የሰርግ ዝግጅት እቅድ አውጪ' : 'Royal Wedding Planner'}",
    replacement: "{t('title')}"
  },
  {
    target: "{locale === 'am' ? 'ውብ ህልምዎን \\n እውን እናድርግ።' : 'Design Your \\n Royal Tomorrow.'}",
    replacement: "{t('subtitle')}"
  },
  {
    target: `{locale === 'am'
                ? 'ምርጥ የሰርግ አዳራሾችን፣ የምግብ ዝግጅቶችን፣ አልባሳትን እና የፎቶ ባለሙያዎችን በአንድ ላይ ያቅዱ።'
                : 'Curate your perfect wedding with verified premium halls, gourmet traditional catering, designer attire, and cinema experts.'}`,
    replacement: "{t('introText')}"
  },
  {
    target: "label: locale === 'am' ? 'የምግብ ዝግጅት' : 'Gourmet Buffet'",
    replacement: "label: t('gourmetBuffet')"
  },
  {
    target: "label: locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Cinema & Photos'",
    replacement: "label: t('cinemaPhotos')"
  },
  {
    target: "label: locale === 'am' ? 'ዲዛይነር ልብስ' : 'Royal Attire'",
    replacement: "label: t('royalAttire')"
  },
  {
    target: "label: locale === 'am' ? 'ውብ ትዝታ' : 'Perfect Memories'",
    replacement: "label: t('perfectMemories')"
  },
  {
    target: "{locale === 'am' ? 'አዳራሽ እና ምግብ' : 'Halls & Catering'}",
    replacement: "{t('hallCatering')}"
  },
  {
    target: "{locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Photo & Cinema'}",
    replacement: "{t('photoCinema')}"
  },
  {
    target: "{locale === 'am' ? 'ውበት እና አልባሳት' : 'Beauty & Attire'}",
    replacement: "{t('beautyAttire')}"
  },
  {
    target: "{locale === 'am' ? 'የዋጋ ስሌት ማጠቃለያ' : 'Cost Estimation summary'}",
    replacement: "{t('costEstimation')}"
  },
  {
    target: "{locale === 'am' ? 'አዳራሽ እና ምግብ' : 'Venue & Food'}",
    replacement: "{t('venueFood')}"
  },
  {
    target: "{locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Photos & Video'}",
    replacement: "{t('photosVideo')}"
  },
  {
    target: "{locale === 'am' ? 'ውበት እና አልባሳት' : 'Beauty & Clothes'}",
    replacement: "{t('beautyClothes')}"
  },
  {
    target: "{locale === 'am' ? 'ጠቅላላ ዋጋ (ግምት)' : 'Total Estimate'}",
    replacement: "{t('totalEstimate')}"
  },
  {
    target: "{locale === 'am' ? 'የሰርግ አማካሪ ያግኙ' : 'Inquire / Book Consultation'}",
    replacement: "{t('inquireBook')}"
  },
  {
    target: "placeholder={locale === 'am' ? 'እባክዎ የተለየ ፍላጎት ካለዎት እዚህ ይግለጹ...' : 'Write custom requirements here...'}",
    replacement: "placeholder={t('customRequirements')}"
  },
  {
    target: "{locale === 'am' ? 'የተረጋገጡ የሰርግ አገልግሎት አቅራቢዎች' : 'Verified Wedding Vendors'}",
    replacement: "{t('verifiedVendors')}"
  },
  {
    target: `{locale === 'am' 
              ? 'በቤተሰብ የተረጋገጡ ምርጥ ሰርግ አዳራሾች፥ ዲዛይነሮች እና ፎቶግራፍ አንሺዎች' 
              : 'Beteseb-partnered luxury wedding services, venues, and cinema studios'}`,
    replacement: "{t('verifiedVendorsSubtitle')}"
  },
  {
    target: `{locale === 'am' \n              ? 'በቤተሰብ የተረጋገጡ ምርጥ ሰርግ አዳራሾች፥ ዲዛይነሮች እና ፎቶግራፍ አንሺዎች' \n              : 'Beteseb-partnered luxury wedding services, venues, and cinema studios'}`,
    replacement: "{t('verifiedVendorsSubtitle')}"
  },
  {
    target: `{locale === 'am' \r\n              ? 'በቤተሰብ የተረጋገጡ ምርጥ ሰርግ አዳራሾች፥ ዲዛይነሮች እና ፎቶግራፍ አንሺዎች' \r\n              : 'Beteseb-partnered luxury wedding services, venues, and cinema studios'}`,
    replacement: "{t('verifiedVendorsSubtitle')}"
  },
  {
    target: "{locale === 'am' ? 'የእርስዎ የቀጠሮ ጥያቄዎች' : 'Your Consultation Bookings'}",
    replacement: "{t('bookings')}"
  },
  {
    target: `{locale === 'am' 
              ? 'የሰርግ እቅድ አውጪ የምክር እና የሂሳብ ግምት ቀጠሮዎች ዝርዝር' 
              : 'Track the status of your royal wedding planning consultations'}`,
    replacement: "{t('bookingsSubtitle')}"
  },
  {
    target: `{locale === 'am' \n              ? 'የሰርግ እቅድ አውጪ የምክር እና የሂሳብ ግምት ቀጠሮዎች ዝርዝር' \n              : 'Track the status of your royal wedding planning consultations'}`,
    replacement: "{t('bookingsSubtitle')}"
  },
  {
    target: `{locale === 'am' \r\n              ? 'የሰርግ እቅድ አውጪ የምክር እና የሂሳብ ግምት ቀጠሮዎች ዝርዝር' \r\n              : 'Track the status of your royal wedding planning consultations'}`,
    replacement: "{t('bookingsSubtitle')}"
  },
  {
    target: "{locale === 'am' ? 'እስካሁን ምንም ቀጠሮ አልተያዘም።' : 'No planning consultations scheduled yet.'}",
    replacement: "{t('noBookings')}"
  },
  {
    target: "locale === 'am' ? 'ጥያቄ ላክ' : 'Send Planner Inquiry'",
    replacement: "t('sendInquiry')"
  }
];

exacts.forEach(({ target, replacement }) => {
  if (content.includes(target)) {
    content = content.replace(target, replacement);
  } else {
    // Try without carriage returns
    const cleanTarget = target.replace(/\r/g, '');
    if (content.replace(/\r/g, '').includes(cleanTarget)) {
      // replace on carriage-return-cleaned content, then restore
      content = content.replace(/\r/g, '').replace(cleanTarget, replacement);
    } else {
      console.log(`Failed to replace: ${target.slice(0, 45)}...`);
    }
  }
});

// Loop variables
content = content.replace(/\{locale === 'am' \? pkg\.nameAm : pkg\.name\}/g, "{getPkgName(pkg.id, pkg.name)}");
content = content.replace(/\{locale === 'am' \? pkg\.descriptionAm : pkg\.description\}/g, "{getPkgDesc(pkg.id, pkg.description)}");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed exact replacements in WeddingPlannerView.tsx!");
