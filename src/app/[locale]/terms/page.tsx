'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Gavel, Scale, Heart, ShieldAlert, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function TermsPage() {
  const locale = useLocale();
  const [selectedLang, setSelectedLang] = useState<string>(locale);

  // 6 Language localized legal content
  const content: Record<string, {
    title: string;
    subtitle: string;
    tagline: string;
    eulaTitle: string;
    eulaContent: string;
    sections: { title: string; body: string }[];
  }> = {
    en: {
      title: "End User License Agreement & Terms of Service",
      subtitle: "Walking with Sincerity and Honor",
      tagline: "Beteseb - Source of Love, Family, and Trust",
      eulaTitle: "Apple/Google EULA & Abuse Zero-Tolerance Policy",
      eulaContent: "Beteseb enforces a zero-tolerance policy against objectionable content and abusive users. You are strictly prohibited from posting pornographic material, explicit content, hate speech, harassment, or illegal material. Users who violate these rules will be instantly banned, and their accounts will be permanently terminated. Any member can flag/report objectionable content or block abusive candidates. Reported content is reviewed by moderators within 24 hours, and offending material is removed immediately.",
      sections: [
        {
          title: "1. Purpose of the Platform",
          body: "Beteseb is a serious, family-oriented matchmaking platform designed strictly for individuals seeking marriage. It is not a casual dating app. By registering, you affirm that your intention is marriage, and you agree to act in a respectful, culturally honorable manner."
        },
        {
          title: "2. Identity Verification & Trust",
          body: "To protect our community, all users are requested to submit valid identification documents and a video selfie for AI verification. Providing false information, impersonating others, or creating dummy accounts is a direct violation of these Terms and will result in immediate suspension."
        },
        {
          title: "3. Guardian (Wali) Involvement",
          body: "In accordance with Ethiopian cultural values, candidates are encouraged to link their profiles to a Guardian (Wali or Mize). Guardians have the right to access shared chat rooms (Wali Rooms) to oversee conversation logs. By matching, you consent to this family-involvement model."
        },
        {
          title: "4. Monetization, Payments & Refunds",
          body: "Access to advanced matching classes, counselor bookings, and virtual gifting requires internal Coins. Coins can be bought via compliant payment gateways. Coins are non-refundable and cannot be exchanged for real cash. External payment requests on mobile native apps are hidden to comply with App Store rules."
        },
        {
          title: "5. User-Generated Content & Code of Conduct",
          body: "You are solely responsible for the messages, posts, and comments you share. You must not: (a) harass, stalk, or abuse candidates; (b) share contact info publicly in forums; (c) bypass security; or (d) post marketing links. We utilize automated moderation tools to flag violations."
        },
        {
          title: "6. Account Termination & Deletion",
          body: "You have the right to delete your own account at any time using the 'Delete Account' button in your settings tab. Upon deletion, your profile, matches, photos, and messages are permanently purged from our database within 48 hours."
        }
      ]
    },
    am: {
      title: "የተጠቃሚ ስምምነት እና የአጠቃቀም ውሎች (EULA)",
      subtitle: "በቅንነትና በክብር መጓዝ",
      tagline: "ቤተሰብ - የፍቅር፣ የትዳር እና የታማኝነት መገኛ",
      eulaTitle: "የአፕል እና ጎግል ህግጋት እና የጥላቻ/ህገወጥ ይዘት እገዳ",
      eulaContent: "ቤተሰብ ማንኛውንም አይነት ወሲባዊ፣ ጥላቻ አዘል፣ ጸያፍ፣ ትንኮሳ ወይም ህገ-ወጥ ይዘቶችን በሚያጋሩ ተጠቃሚዎች ላይ ፍጹም ዜሮ-ቻይነት (Zero-Tolerance) መመሪያ ይከተላል። እነዚህን ደንቦች የሚጥሱ ተጠቃሚዎች ያለ ምንም ማስጠንቀቂያ ወዲያውኑ ይታገዳሉ። ማንኛውም አባል አግባብ ያልሆነ ይዘትን ሪፖርት (Report) ማድረግ ወይም አላስፈላጊ እጮኛን መቆለፍ (Block) ይችላል። ሪፖርት የተደረጉ ይዘቶች በ24 ሰዓት ውስጥ በሞደሬተሮች ተገምግመው ወዲያውኑ እንዲወገዱ ይደረጋል።",
      sections: [
        {
          title: "1. የመድረኩ ዓላማ",
          body: "ቤተሰብ ለትዳር አጋር መፈለጊያ ብቻ የተዘጋጀ መድረክ ነው። ተራ የፍቅር ጓደኝነት (casual dating) መተግበሪያ አይደለም። በመመዝገብዎ ዓላማዎ ትዳር መሆኑን ያረጋግጣሉ፤ እንዲሁም በባህላዊ እና በሥነ-ምግባር እሴቶች መሠረት ለመንቀሳቀስ ቃል ይገባሉ።"
        },
        {
          title: "2. ማንነትን ማረጋገጥና ታማኝነት",
          body: "የማህበረሰባችንን ደህንነት ለመጠበቅ እያንዳንዱ ተጠቃሚ መታወቂያ እና የቪዲዮ ሰልፊ በማቅረብ ማንነቱን ማረጋገጥ ይጠበቅበታል። የሐሰት መረጃ ማቅረብ ወይም የሌላ ሰውን ማንነት መጠቀም ህግ መጣስ ሲሆን መለያዎ ወዲያውኑ እንዲዘጋ ያደርጋል።"
        },
        {
          title: "3. የቤተሰብ እና የሞግዚት (Wali) ተሳትፎ",
          body: "ከሀገራችን ባህል አንጻር ተጠቃሚዎች የሞግዚት (ዋሊ ወይም ሚዜ) ስልክ ቁጥር እንዲያስገቡ ይበረታታሉ። ዋሊዎች የተጠቃሚውን የውይይት መድረክ (Wali Room) የመከታተል መብት አላቸው። እጮኛሞች ሲገናኙ ይህንን የቤተሰብ ተሳትፎ አሠራር መስማማታቸውን ያረጋግጣሉ።"
        },
        {
          title: "4. ክፍያዎች እና ሳንቲሞች (Coins)",
          body: "የአማካሪ ቀጠሮዎችን ለመያዝ እና ስጦታዎችን ለመላክ የቤተሰብ ሳንቲሞች (Coins) ጥቅም ላይ ይውላሉ። ሳንቲሞች መመለስ (Refund) ወይም ወደ እውነተኛ ገንዘብ መለወጥ አይችሉም። በሞባይል መተግበሪያዎች ላይ የሱቅ ህጎችን ለማክበር የውጭ ክፍያዎች ተደብቀዋል።"
        },
        {
          title: "5. የተጠቃሚዎች ይዘት እና ሥነ-ምግባር",
          body: "በመድረኩ ላይ ለሚያጋሯቸው መልእክቶች፣ ጽሑፎች እና አስተያየቶች ሙሉ ኃላፊነት ይወስዳሉ። ሌሎችን ማዋረድ፣ የግል መረጃዎችን በይፋ መለጠፍ ወይም ህገ-ወጥ ማስታወቂያዎችን ማጋራት በጥብቅ የተከለከለ ነው።"
        },
        {
          title: "6. አካውንት መሰረዝ",
          body: "ማንኛውም ተጠቃሚ በቅንብሮች ገጽ ውስጥ ያለውን 'Delete Account' የሚለውን ቁልፍ በመጫን አካውንቱን የመሰረዝ መብት አለው። አካውንትዎ ሲሰረዝ ሁሉም ፎቶዎች፣ መልእክቶች እና መረጃዎች በ48 ሰዓታት ውስጥ ሙሉ በሙሉ ይወገዳሉ።"
        }
      ]
    },
    om: {
      title: "Waliigalte Shartii Fayyadamaa EULA",
      subtitle: "Aadaa fi Kabajaan Adeemuu",
      tagline: "Beteseb - Hundee Jaalalaa fi Nageenyaa",
      eulaTitle: "Seera EULA Google/Apple fi Yakka Balaaleffachuu",
      eulaContent: "Giddugalli Beteseb namoota jechoota ykn suuraalee fitsiisi/fokkisaa, jibbiinsa fi doorsisa tamsaasan battalatti ni dhorka. Namni kamiyyuu qaama biraa gabaasuu (Report) ykn dhorguu (Block) ni danda'a. Gabaasni dhiyaate sa'aatii 24 keessatti sakatta'amee ni haqama.",
      sections: [
        {
          title: "1. Kaayyoo Platformichaa",
          body: "Beteseb kaayyoo gaa'ela qofaaf kan qophaa'edha. Namoota gaa'ela dhugaa barbaadaniif qofa tajaajila."
        },
        {
          title: "2. Eenyummaa Mirkaneessuu",
          body: "Nageenya maatii eeguuf eenyummaan keessan kaardii eenyummaa fi viidiyoodhaan mirkaneeffamuu qaba."
        },
        {
          title: "3. Waliin Hojjechuu Wali (Wali/Mize)",
          body: "Maatiin keessan dubbii keessan akka hordofan affeeruuf mirga qabdu."
        },
        {
          title: "4. Kaffaltii fi Qarshii Coins",
          body: "Coins kaffaltii keessoo platformii qofaaf tajaajila. Boodatti hin deebifamu."
        },
        {
          title: "5. Qajeelfama Nageenyaa",
          body: "Jechoota arrabsoo fi jibbiinsaa fayyadamuu dhorgaadha."
        },
        {
          title: "6. Account Haquu",
          body: "Koreen keessan yeroo barbaaddanitti account keessan haquu ni dandeessu. Sa'aatii 48 keessatti ni haqama."
        }
      ]
    },
    ti: {
      title: "ውዕል ስምምዕነት ተጠቃሚ EULA",
      subtitle: "ብቅንዕናን ብክብርን ምጉዓዝ",
      tagline: "ቤተሰብ - መሰረት ፍቕርን ትካልን",
      eulaTitle: "ሕግጋት EULA Apple/Googleን ጸረ-ጸያፍ ትሕዝቶን",
      eulaContent: "ቤተሰብ ጸያፍ፣ ጽልኢ ወይ ጎነጽ ዝመልኦም ጽሑፋት ዘርግሑ ተጠቀምቲ ብቅጽበት ይእግድ። ዝኾነ ተጠቃሚ ሪፖርት (Report) ክገብር ወይ ብሎክ (Block) ክገብር ይኽእል እዩ። እቶም ትሕዝቶታት ብሞደሬተራት ተገምጊሞም ይእለዩ።",
      sections: [
        {
          title: "1. ዕላማ መድረኽ",
          body: "እዚ መድረኽ ንዕላማ መውስቦ ጥራይ ዝተዳለወ እዩ። ተራ ምቅርራብ ዝፍቀደሉ ኣይኮነን።"
        },
        {
          title: "2. ምርግጋጽ መንነት",
          body: "መንነትኩም ብቪድዮን መለለይን ምርግጋጽ ግዴታ እዩ።"
        },
        {
          title: "3. ተሳትፎ ሓላዊ (ዋሊ)",
          body: "ሓለውቲ ናይቲ ዕላል ዝርዝር ክከታተሉ ይኽእሉ እዮም።"
        },
        {
          title: "4. ክፍሊት ሳንቲም (Coins)",
          body: "ሳንቲም ንድፊ ውሽጣዊ ክፍሊት ጥራይ ዘገልግል ኮይኑ ናብ ገንዘብ ኣይቅየርን።"
        },
        {
          title: "5. ውሕስነት ይዘት",
          body: "ኣብዚ መድረኽ ጸያፍ ጽሑፋት ምዝርጋሕ ክልኩል እዩ።"
        },
        {
          title: "6. ምስራዝ ሒሳብ",
          body: "ሒሳብኩም ኣብ ውሽጢ 48 ሰዓት ምሉእ ብምሉእ ክእለ ይኽእል እዩ።"
        }
      ]
    },
    so: {
      title: "Heshiiska Isticmaalka Isticmaalaha EULA",
      subtitle: "Ku Socoshada Daacadnimo iyo Sharaf",
      tagline: "Beteseb - Xarunta Jacaylka iyo Kalsoonida",
      eulaTitle: "Shuruucda EULA ee Apple/Google & Ka hortagga Xadgudubka",
      eulaContent: "Beteseb ma ogola haba yaraatee waxyaabaha xun xun, nacaybka ama rabshadaha. Waxaad ku dhiiran kartaa inaad xannibto (Block) ama aad soo sheegto (Report) qofka xadgudba. Waxaa lagu baari doonaa 24 saac gudahood.",
      sections: [
        {
          title: "1. Ujeedada Platform-ka",
          body: "Madashani waxay u gaar tahay oo kaliya guurka sharciga ah, ma aha shukaansi caadi ah."
        },
        {
          title: "2. Xaqiijinta Aqoonsiga",
          body: "Aqoonsigaaga waa in lagu xaqiijiyaa kaarka aqoonsiga iyo muuqaal selfi ah."
        },
        {
          title: "3. Ka qaybgalka Mas'uulka (Wali)",
          body: "Mas'uuliyiinta ama waalidiinta waxay geli karaan qolalka wada sheekaysiga si ay u kormeeraan."
        },
        {
          title: "4. Kafiilka iyo Shinnida (Coins)",
          body: "Coins waa lacagta gudaha ee lagu iibsado hadiyadaha mana la celin karo."
        },
        {
          title: "5. Hab-dhaqanka Isticmaalaha",
          body: "Lama ogola hadallada nacaybka ama aflagaadada ah."
        },
        {
          title: "6. Tiridda Koontada",
          body: "Waad tirtiri kartaa koontadaada markasta, xogtaaduna waxay ku go'aysaa 48 saac gudahood."
        }
      ]
    },
    ar: {
      title: "اتفاقية ترخيص المستخدم النهائي وشروط الخدمة",
      subtitle: "السير بصدق وشرف ونية صالحة",
      tagline: "بيتسب - منبع الحب، الأسرة والأمان",
      eulaTitle: "سياسة EULA لشركتي آبل وجوجل وعدم التسامح مع المحتوى المسيء",
      eulaContent: "يطبق بيتسب سياسة صارمة خالية من التسامح تجاه أي محتوى إباحي، أو يحث على الكراهية، أو التنمر. يمتلك جميع الأعضاء الحق في الإبلاغ (Report) عن أي سلوك أو حظر (Block) المستخدمين. تتم مراجعة التقارير خلال 24 ساعة وإزالة المحتوى المخالف فوراً.",
      sections: [
        {
          title: "١. الغرض من المنصة",
          body: "بيتسب هي منصة جادة تهدف لبناء الأسرة والزواج الصالح وليست للتعارف العابر."
        },
        {
          title: "٢. التحقق من الهوية",
          body: "يتوجب على جميع المستخدمين تأكيد هوياتهم عبر بطاقة الهوية والصورة الشخصية الحية لضمان الأمان."
        },
        {
          title: "٣. إشراك ولي الأمر (الوالي)",
          body: "تتيح المنصة إشراك الأولياء لمراقبة غرف المحادثات لضمان بيئة آمنة ومتوافقة مع التقاليد الأصيلة."
        },
        {
          title: "٤. العملات الرقمية والمدفوعات",
          body: "العملات الداخلية (Coins) مخصصة فقط للخدمات والجوائز وغير قابلة للاسترجاع أو التحويل لنقد حقيقي."
        },
        {
          title: "٥. السلوك والمحتوى المقبول",
          body: "يُحظر تماماً نشر أي محتوى مسيء أو تجاري أو محاولة التحايل على خيارات الأمان بالمنصة."
        },
        {
          title: "٦. حذف الحساب والبيانات",
          body: "يمتلك العضو كامل الحق في حذف حسابه في أي وقت، وسيتم إزالة كافة ملفاته ومحادثاته نهائياً خلال 48 ساعة."
        }
      ]
    }
  };

  const current = content[selectedLang] || content.en;

  return (
    <div className="min-h-screen bg-muted py-24 px-6 md:px-12" dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-primary transition-colors">
            ← {locale === 'am' ? 'ወደ መነሻ ገጽ ተመለስ' : 'Back to Home'}
          </Link>
        </div>
        
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
            <Gavel size={40} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-accent tracking-tighter italic leading-tight">
            {current.title}
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
          <p className="text-gray-400 text-xs uppercase tracking-widest font-black italic">
            {current.subtitle}
          </p>
        </div>

        {/* Apple/Google Compliance Notice Card */}
        <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-6 md:p-8 mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
          <div className="flex items-center gap-3 text-red-600">
            <ShieldAlert size={24} />
            <h3 className="font-black text-xs uppercase tracking-wider">{current.eulaTitle}</h3>
          </div>
          <p className="text-xs text-red-700/80 leading-relaxed font-bold">
            {current.eulaContent}
          </p>
        </div>

        {/* Legal Sections */}
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
