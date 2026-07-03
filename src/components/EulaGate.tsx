'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ShieldCheck, Heart, AlertOctagon, Check } from 'lucide-react';

export default function EulaGate() {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [agreedToEula, setAgreedToEula] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);

  useEffect(() => {
    // Check if EULA was accepted
    const accepted = localStorage.getItem('beteseb_eula_accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const getTexts = (lang: string) => {
    switch (lang) {
      case 'am':
        return {
          title: 'የደህንነት ደንብ እና የአጠቃቀም ስምምነት (EULA)',
          sub: 'ለቤተሰብ አባላት ደህንነት ሲባል መጀመሪያ በዚህ ስምምነት ላይ መስማማት አለብዎት።',
          zeroTolerance: 'የማያስተማምን ዜሮ-ታገስ ፖሊሲ (Zero-Tolerance Policy)',
          zeroDesc: 'በዚህ መድረክ ላይ ማናቸውንም የስድብ፣ ፆታዊ ትንኮሳ፣ የሀሰት መለያ፣ ማጭበርበር ወይም የስነ-ምግባር መርሆዎችን የሚጥሱ አካውንቶች ያለምንም ቅድመ-ማስጠንቀቂያ ወዲያውኑ ይዘጋሉ (terminated)።',
          confirmAge: 'እድሜዬ 18 ወይም ከዚያ በላይ መሆኑን አረጋግጣለሁ።',
          confirmEula: 'በዜሮ-ታገስ ፖሊሲው እና በአጠቃቀም ስምምነቱ (EULA) ላይ ሙሉ ለሙሉ እስማማለሁ።',
          btn: 'ስምምነቱን አፅድቄ ልግባ',
          termsLink: 'የአጠቃቀም ደንብ',
          privacyLink: 'የደህንነት ፖሊሲ'
        };
      case 'om':
        return {
          title: 'Waliigaltee EULA fi Nageenyaa',
          sub: 'Nageenya miseensota Maatiif, jalqaba waliigaltee kana irratti walii galuu qabdu.',
          zeroTolerance: 'Imaammata Obsa-Zero (Zero-Tolerance Policy)',
          zeroDesc: 'Arrabsachuu, qaanessuu, profile sobaa, fi gochaalee nagaa booressan kamiyyuu irratti obsa hin qabnu. Malleen kun battalatti adabamu.',
          confirmAge: 'Umriin koo 18 fi isaa ol ta\'uu isaa nan mirkaneessa.',
          confirmEula: 'Waliigaltee EULA fi Imaammata Obsa-Zero irratti walii nan gala.',
          btn: 'Waliigaltee nan fudhadha',
          termsLink: 'Waliigaltee fayyadamaa',
          privacyLink: 'Imaammata Nageenyaa'
        };
      case 'ti':
        return {
          title: 'ውዕል ደህንነትን ኣጠቓቕማን (EULA)',
          sub: 'ንደሕንነት ኣባላት ስድራቤት፡ ቅድም ቀዳድም ኣብዚ ውዕል ክትሰማምዑ ይግባእ።',
          zeroTolerance: 'ፖሊሲ ዜሮ-ተፃዋርነት (Zero-Tolerance Policy)',
          zeroDesc: 'ዝኾነ ፀርፊ፣ ፆታዊ ትንኮሳ፣ ናይ ሓሶት መለያ፣ ወይ ካልእ ንሕጊ ዘይእዘዝ አካውንት ብዘይ ዝኾነ መጠንቀቕታ ብቕጽበት ክዕጾ እዩ።',
          confirmAge: 'ዕድመይ 18 ወይ ካብኡ ንላዕሊ ምዃኑ አረጋግጽ።',
          confirmEula: 'ኣብዚ ፖሊሲ ዜሮ-ተፃዋርነትን ውዕል ኣጠቓቕማን (EULA) ምሉእ ብምሉእ እሰማማዕ።',
          btn: 'ነዚ ውዕል አፅዲቐ ክኣቱ',
          termsLink: 'ውዕል ኣጠቓቕማ',
          privacyLink: 'ፖሊሲ ደህንነት'
        };
      case 'so':
        return {
          title: 'Heshiiska EULA & Amniga',
          sub: 'Amniga xubnaha qoyska awgeed, waa inaad marka hore aqbashaa heshiiskan.',
          zeroTolerance: 'Siyaasadda Dulqaad-La\'aanta (Zero-Tolerance Policy)',
          zeroDesc: 'Xadgudub kasta, sawiro qaawan, profiles been abuur ah iyo khiyaano ayaa keeni doona in koontada isla markaaba la xiro digniin la\'aan.',
          confirmAge: 'Waxaan xaqiijinayaa inaan ahay 18 sano ama ka weyn.',
          confirmEula: 'Waxaan ogolahay heshiiska EULA iyo Siyaasadda Dulqaad-La\'aanta.',
          btn: 'Aqbal oo Gal',
          termsLink: 'Shuruudaha Adeegga',
          privacyLink: 'Siyaasadda Khaaska ah'
        };
      case 'ar':
        return {
          title: 'اتفاقية ترخيص المستخدم النهائي والأمان (EULA)',
          sub: 'للحفاظ على سلامة مجتمع بيتسيب، يرجى الموافقة على الشروط أولاً.',
          zeroTolerance: 'سياسة عدم التسامح المطلق (Zero-Tolerance)',
          zeroDesc: 'نحن نتبع سياسة صارمة ضد الإساءة أو المحتوى الفاضح أو الحسابات المزيفة. سيتم إغلاق أي حساب مخالف فوراً ودون إنذار مسبق.',
          confirmAge: 'أؤكد أن عمري 18 عاماً أو أكثر.',
          confirmEula: 'أوافق على سياسة عدم التسامح المطلق وشروط الاستخدام.',
          btn: 'قبول ومتابعة',
          termsLink: 'شروط الخدمة',
          privacyLink: 'سياسة الخصوصية'
        };
      default:
        return {
          title: 'End-User License Agreement (EULA) & Safety Gate',
          sub: 'To ensure the safety of the Beteseb family, you must review and agree to our guidelines.',
          zeroTolerance: 'Zero-Tolerance Safety Policy',
          zeroDesc: 'We enforce an absolute zero-tolerance policy against abusive behavior, harassment, explicit content, scamming, or fake profiles. Any account engaging in non-compliant behavior will be terminated instantly without prior warning or refund.',
          confirmAge: 'I confirm that I am 18 years of age or older.',
          confirmEula: 'I agree to the Zero-Tolerance Policy and the EULA Terms.',
          btn: 'Accept & Enter Beteseb',
          termsLink: 'Terms of Service',
          privacyLink: 'Privacy Policy'
        };
    }
  };

  const texts = getTexts(locale);

  const handleAccept = () => {
    if (agreedToEula && confirmAge) {
      localStorage.setItem('beteseb_eula_accepted', 'true');
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0F172A]/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
        
        <div className="relative space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white italic tracking-tight">
                {texts.title}
              </h2>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Beteseb Trust & Safety</p>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
            {texts.sub}
          </p>

          {/* Zero Tolerance Callout */}
          <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
              <AlertOctagon size={16} />
              {texts.zeroTolerance}
            </div>
            <p className="text-[11px] text-red-600/90 dark:text-red-400/90 leading-relaxed font-semibold">
              {texts.zeroDesc}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Age Confirmation */}
            <div 
              onClick={() => setConfirmAge(!confirmAge)} 
              className="flex items-start gap-3.5 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={confirmAge}
                  onChange={(e) => setConfirmAge(e.target.checked)}
                  className="peer h-5.5 w-5.5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 dark:border-slate-700 transition-all checked:bg-primary checked:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
                <Check 
                  size={14} 
                  className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" 
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold select-none leading-snug">
                {texts.confirmAge}
              </span>
            </div>

            {/* EULA & Zero Tolerance Checkbox */}
            <div 
              onClick={() => setAgreedToEula(!agreedToEula)} 
              className="flex items-start gap-3.5 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreedToEula}
                  onChange={(e) => setAgreedToEula(e.target.checked)}
                  className="peer h-5.5 w-5.5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 dark:border-slate-700 transition-all checked:bg-primary checked:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
                <Check 
                  size={14} 
                  className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" 
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold select-none leading-snug">
                {texts.confirmEula}
              </span>
            </div>
          </div>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={!agreedToEula || !confirmAge}
            className="w-full bg-primary text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            {texts.btn}
          </button>

          {/* Links */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-2">
            <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{texts.termsLink}</a>
            <span>•</span>
            <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{texts.privacyLink}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
