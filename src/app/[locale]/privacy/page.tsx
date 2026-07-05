'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { ShieldCheck, Lock, EyeOff, Heart, FileText, CheckCircle } from 'lucide-react';

export default function PrivacyPage() {
  const locale = useLocale();
  const [selectedLang, setSelectedLang] = useState<string>(locale);

  // 6 Language localized privacy content
  const content: Record<string, {
    title: string;
    subtitle: string;
    tagline: string;
    vaultTitle: string;
    vaultContent: string;
    sections: { title: string; body: string }[];
  }> = {
    en: {
      title: "Privacy Policy & Data Security Covenant",
      subtitle: "Your Safety and Privacy are Our Priority",
      tagline: "Beteseb - Source of Love, Family, and Trust",
      vaultTitle: "Secured Data Storage & App Store Compliance",
      vaultContent: "Beteseb processes all user data in accordance with international privacy guidelines (including App Store Guideline 5.1.1). We utilize industry-standard TLS encryption for all chats, secure salt-hashed database records, and isolated bucket storage for ID verifications. Your video selfies are analyzed solely for biometric liveness matching against your ID cards and are never sold or shared with any third party.",
      sections: [
        {
          title: "1. Information We Collect",
          body: "We collect: (a) registration data (name, email, birth date, phone number); (b) detailed demographic and career choices; (c) preferences regarding future spouses; (d) photo gallery uploads and a live selfie for AI verification; and (e) optional guardian contact emails."
        },
        {
          title: "2. How We Use Your Data",
          body: "Your profile information is used to calculate matching percentages and display compatibility reports. Your identification details and video selfie are analyzed strictly by our automated AI verification engine to approve your verified profile badge."
        },
        {
          title: "3. Chat Privacy & Guardian Oversight",
          body: "Private chat messages are secure and hidden from the public. However, if you link a Guardian (Wali/Mize) to your account, the guardian will have access to the group chat log (Wali Room) to monitor chat transcripts as part of our culturally-honored matchmaking model."
        },
        {
          title: "4. Account Deletion & Data Purge Rights",
          body: "Under App Store rules, you retain the complete right to request account self-deletion. You can click 'Delete Account' under the settings dashboard, which immediately triggers the delete_own_user_account() database ledger. All your personal data, matches, and images will be permanently purged within 48 hours."
        },
        {
          title: "5. Data Retention & Disclosures",
          body: "We retain transaction details (coin transactions) for financial auditing purposes. We do not sell user profiles to advertisers. We only disclose personal information if required by law or to protect the physical safety of candidates in cases of harassment."
        }
      ]
    },
    am: {
      title: "የግላዊነት ፖሊሲ እና የዳታ ደህንነት ቃል-ኪዳን",
      subtitle: "የእርስዎ ደህንነት እና ሚስጥራዊነት ቅድሚያችን ነው",
      tagline: "ቤተሰብ - የፍቅር፣ የትዳር እና የታማኝነት መገኛ",
      vaultTitle: "ደህንነቱ የተጠበቀ የመረጃ ማከማቻ እና የህግ ተገዢነት",
      vaultContent: "ቤተሰብ የተጠቃሚዎችን መረጃ በአለም አቀፍ የግላዊነት መርሆዎች (የአፕል መደብር መመሪያ 5.1.1ን ጨምሮ) መሠረት ያስተዳድራል። ለሁሉም የውይይት መልእክቶች የኢንክሪፕሽን ቴክኖሎጂን እንጠቀማለን። የማንነት ማረጋገጫዎች ደህንነቱ በተጠበቀ ማከማቻ ውስጥ የሚቀመጡ ሲሆን ለማንኛውም ሶስተኛ ወገን አይጋሩም።",
      sections: [
        {
          title: "1. የምንሰበስበው መረጃ",
          body: "የምንሰበስበው፡ (ሀ) የምዝገባ መረጃ (ስም፣ ኢሜይል፣ የልደት ቀን፣ ስልክ ቁጥር)፤ (ለ) የባህሪ እና የሙያ ምርጫዎች፤ (ሐ) የትዳር መስፈርቶች፤ (መ) ፎቶዎች እና ማንነትን ለማረጋገጥ የሚላክ የቪዲዮ ሰልፊ፤ እና (ሠ) የዋሊ/ሞግዚት የኢሜይል አድራሻን ነው።"
        },
        {
          title: "2. መረጃዎን የምንጠቀምበት መንገድ",
          body: "የመገለጫ መረጃዎ እጩዎችን ለማዛመድ እና የንጽጽር ውጤቶችን ለማስላት ጥቅም ላይ ይውላል። የመታወቂያ ሰነዶችዎ እና የቪዲዮ ሰልፊዎ የሚገመገሙት የትክክለኛ ሰው መለያ ባጅዎን ለማጽደቅ ብቻ ነው።"
        },
        {
          title: "3. የውይይት ሚስጥራዊነት እና የዋሊ (Guardian) ቁጥጥር",
          body: "የእጮኛሞች የውስጥ ቻት ሙሉ በሙሉ ሚስጥራዊ ነው። ነገር ግን፥ ከባህላችን አንጻር የሞግዚት (ዋሊ) ስልክ ወይም ኢሜይል ሲያስገቡ የቤተሰብ መቆጣጠሪያውን ክፍል (Wali Room) በመጠቀም ውይይቱን የመከታተል እድል ይኖራቸዋል።"
        },
        {
          title: "4. አካውንት መሰረዝ እና መረጃን የማጥፋት መብት",
          body: "በአፕል/ጎግል መመሪያዎች መሠረት አካውንትዎን ሙሉ በሙሉ የመሰረዝ መብት አለዎት። በቅንብሮች ውስጥ ያለውን 'Delete Account' የሚለውን በመጫን የ delete_own_user_account() ፋንክሽንን ማስፈጸም ይችላሉ። ሁሉም ፎቶዎችዎ፣ መልእክቶችዎ እና መረጃዎችዎ በ48 ሰዓት ውስጥ ሙሉ በሙሉ ይጠፋሉ።"
        },
        {
          title: "5. መረጃን ስለማቆየትና ይፋ ማድረግ",
          body: "የሳንቲም ግብይቶችን ለሂሳብ ምርመራ ስንል ብቻ እናቆያለን። የተጠቃሚዎችን መረጃ ለሶስተኛ ወገን አስተዋዋቂዎች ፈጽሞ አንሸጥም። መረጃን ይፋ የምናደርገው በህግ ሲታዘዝ ወይም የተጠቃሚዎችን ደህንነት ለመጠበቅ ብቻ ነው።"
        }
      ]
    },
    om: {
      title: "Imaammata Ikuummaa fi Nageenya Xoggaa",
      subtitle: "Nageenyi fi Ikuummaan keessan Hoji Keenya Duraati",
      tagline: "Beteseb - Hundee Jaalalaa fi Nageenyaa",
      vaultTitle: "Kuusaa Nageenya Qabu fi Seera App Store",
      vaultContent: "Beteseb odeeffannoo keessan seera nageenyaa addunyaa eeguun kuusa. TLS encryption fayyadamuudhaan chat keessan iccitiin isaa akka eegamu goona.",
      sections: [
        {
          title: "1. Odeeffannoo Nyaannu",
          body: "Maqaa, email, guyyaa dhalootaa, bilbila, suuraa fi kaardii eenyummaa keessan ni fudhanna."
        },
        {
          title: "2. Akkaataa Itti Fayyadamnu",
          body: "Eenyummaa keessan mirkaneessuu fi gaa'elaaf isin walitti fiduuf qofa tajaajila."
        },
        {
          title: "3. Iccitii Chat fi Wali",
          body: "Waliin keessan dubbii keessan akka hordofan affeeruuf mirga qabdu."
        },
        {
          title: "4. Mirga Account Haquu",
          body: "Settings keessaa account keessan haquu ni dandeessu. Sa'aatii 48 keessatti odeeffannoon hundi ni haqama."
        },
        {
          title: "5. Odeeffannoo Dabarsuu",
          body: "Odeeffannoo keessan qaama biraatti hin gurgurru, hin dabarsinus."
        }
      ]
    },
    ti: {
      title: "ፖሊሲ ግላውነትን ውሕስነት መረዳእታን",
      subtitle: "ውሕስነትኩምን ምስጢርኩምን ቀዳምነትና እዩ",
      tagline: "ቤተሰብ - መሰረት ፍቕርን ትካልን",
      vaultTitle: "ውሑስ መኽዘን መረዳእታን ሕጊ App Storeን",
      vaultContent: "ቤተሰብ ንኹሉ መረዳእታታት ብመሰረት ኣህጉራዊ ሕግጋት ግላውነት (App Store Guideline 5.1.1 ሓዊሱ) ይሕዞ። ቪድዮ ሰልፊ ንምርግጋጽ መንነት ጥራይ የገልግል።",
      sections: [
        {
          title: "1. እንእክቦ መረዳእታ",
          body: "ሽም፣ ኢመይል፣ ቴሌፎን፣ ፎቶታት፣ ሰነድ መንነትን ቪድዮ ሰልፊን የጠቓልል።"
        },
        {
          title: "2. ኣጠቓቕማ መረዳእታ",
          body: "እቲ መረዳእታ ንምምእዛን እጮኛታትን ትክክለኛነት መንነትኩም ንምርግጋጽን ጥራይ የገልግል።"
        },
        {
          title: "3. ምስጢራዊነት ዕላልን ዋሊን",
          body: "ሓላዊ (ዋሊ) ኣብቲ ዕላል ተሳታፊ ክኸውን ይኽእል እዩ።"
        },
        {
          title: "4. መሰል ምስራዝ ሒሳብ",
          body: "ሒሳብኩም ክትሰርዙ ምሉእ መሰል ኣለኩም። ኣብ ውሽጢ 48 ሰዓት ምሉእ ብምሉእ ይእለ።"
        },
        {
          title: "5. ምዕቃብ መረዳእታ",
          body: "ንንግዳዊ ረብሓ ኢልና መረዳእታኹም ንሳልሳይ ወገን ኣይንህብን።"
        }
      ]
    },
    so: {
      title: "Siyaasadda Khaaska ah & Nabadgelyada Xogta",
      subtitle: "Ammaankaaga iyo Qufnaantaadu Waa Mudnaantayada",
      tagline: "Beteseb - Xarunta Jacaylka iyo Kalsoonida",
      vaultTitle: "Kaydinta Xogta Amniga ah & Shuruucda App Store",
      vaultContent: "Beteseb waxay u hoggaansantaa xeerarka qarsoodiga caalamiga ah. Xogtaada wada hadalka waxaa lagu ilaaliyaa habka TLS.",
      sections: [
        {
          title: "1. Xogta aan Ururino",
          body: "Waxaan ururinaa magacaaga, emailkaaga, lambarka telefoonkaaga, suuraalkaaga iyo aqoonsigaaga."
        },
        {
          title: "2. Sida aan u Isticmaalno Xogta",
          body: "Waxaan u isticmaalnaa xogtaada kaliya si aan kuugu helno lamaane ku habboon iyo xaqiijinta aqoonsigaaga."
        },
        {
          title: "3. Wada sheekaysiga iyo Mas'uulka (Wali)",
          body: "Waalidiinta ama mas'uulka aad doorato waxay arki karaan wada hadalka si ay u kormeeraan."
        },
        {
          title: "4. Xuquuqda Tirtiridda Koontada",
          body: "Waxaad tirtiri kartaa koontadaada wakhti kasta. Xogtaada oo dhan waxaa lagu tirtirayaa 48 saac gudahood."
        },
        {
          title: "5. Ilaalinta Xogtaada",
          body: "Waligeen uma iibino xogtaada shirkadaha xayaysiiska."
        }
      ]
    },
    ar: {
      title: "سياسة الخصوصية وميثاق أمان البيانات والسرية",
      subtitle: "أمانكم وخصوصية بياناتكم على رأس أولوياتنا",
      tagline: "بيتسب - منبع الحب، الأسرة والأمان",
      vaultTitle: "تخزين البيانات الآمن والتوافق مع معايير المتاجر",
      vaultContent: "يقوم بيتسب بمعالجة كافة البيانات الحيوية للمستخدمين وفقاً لأرقى المعايير والقوانين الدولية المنظمة لسرية المعلومات وحمايتها (بما يشمل قانون حماية البيانات ومتطلبات متاجر التطبيقات). جميع المحادثات مشفرة بتشفير TLS قوي لمنع التسريب.",
      sections: [
        {
          title: "١. البيانات التي نجمعها",
          body: "نجمع البيانات الأساسية كالاسم والبريد ورقم الهاتف، بالإضافة للبيانات الديموغرافية والمهنية الاختيارية وصور الملف الشخصي وفيديو تأكيد الهوية."
        },
        {
          title: "٢. كيف نستخدم معلوماتك",
          body: "نستخدم البيانات لغرض التوافق والمطابقة والبحث عن شريك الحياة، والتحقق الآلي من أن صاحب الحساب شخص حقيقي لتجنب الاحتيال."
        },
        {
          title: "٣. خصوصية المحادثات ومراقبة الوالي",
          body: "محادثات الأعضاء مشفرة وسرية، لكن عند قيامك بإشراك ولي أمر (الوالي)، فإن له الصلاحية الكاملة لمراجعة محتوى المحادثة لضمان التوافق الأسري."
        },
        {
          title: "٤. حقوق حذف الحساب والتطهير",
          body: "بموجب قوانين المتاجر، يمتلك العضو الحق الكامل في حذف حسابه ذاتياً عبر لوحة الإعدادات، مما يفعل حذفاً نهائياً ومباشراً لكافة السجلات والصور خلال 48 ساعة."
        },
        {
          title: "٥. الإفصاح عن البيانات",
          body: "لا نقوم ببيع معلومات الأعضاء للمعلنين مطلقاً. يتم الإفصاح فقط في حال صدور أمر قضائي رسمي أو حماية لحياة الأعضاء ضد أي مضايقات حقيقية."
        }
      ]
    }
  };

  const current = content[selectedLang] || content.en;

  return (
    <div className="min-h-screen bg-muted py-24 px-6 md:px-12" dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        
        {/* Language Selector */}
        <div className="flex justify-end gap-2 mb-8">
          {[
            { code: 'en', label: 'English' },
            { code: 'am', label: 'አማርኛ' },
            { code: 'om', label: 'Oromoo' },
            { code: 'ti', label: 'ትግርኛ' },
            { code: 'so', label: 'Somali' },
            { code: 'ar', label: 'العربية' }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${selectedLang === lang.code ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-muted text-gray-500'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Title Header */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-accent tracking-tighter italic leading-tight">
            {current.title}
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
          <p className="text-gray-400 text-xs uppercase tracking-widest font-black italic">
            {current.subtitle}
          </p>
        </div>

        {/* Apple/Google Vault Security Notice Card */}
        <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 md:p-8 mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
          <div className="flex items-center gap-3 text-primary">
            <Lock size={24} />
            <h3 className="font-black text-xs uppercase tracking-wider">{current.vaultTitle}</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-bold">
            {current.vaultContent}
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {current.sections.map((section, idx) => (
            <div 
              key={idx} 
              className="card-premium p-8 rounded-[2rem] animate-in fade-in slide-in-from-bottom-12 duration-1000"
              style={{ animationDelay: `${(idx + 2) * 100}ms` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                  <FileText size={18} />
                </div>
                <h2 className="text-base font-black text-accent uppercase tracking-wide mt-2">
                  {section.title}
                </h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium italic pl-14">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Brand Seal */}
        <div className="mt-12 text-center text-primary pt-8 border-t border-border flex items-center justify-center gap-2">
          <Heart className="fill-current text-primary animate-pulse" size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {current.tagline}
          </span>
        </div>

      </div>
    </div>
  );
}
