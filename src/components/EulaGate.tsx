'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ShieldCheck, Check, ChevronDown, ChevronUp, ScrollText, UserCheck, EyeOff } from 'lucide-react';

interface EulaGateProps {
  onAccept?: () => void;
  forceShow?: boolean;
}

export default function EulaGate({ onAccept, forceShow = false }: EulaGateProps = {}) {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  
  // Accordion active tab
  const [activeTab, setActiveTab] = useState<'eula' | 'terms' | 'privacy' | null>(null);

  // Checkbox values — no scroll-gate required; users check freely
  const [confirmAge, setConfirmAge] = useState(false);
  const [agreedToEula, setAgreedToEula] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
    } else {
      const accepted = localStorage.getItem('beteseb_eula_accepted');
      if (!accepted) {
        setIsVisible(true);
      }
    }
  }, [forceShow]);

  if (!isVisible) {
    return null;
  }

  const getTexts = (lang: string) => {
    switch (lang) {
      case 'am':
        return {
          title: 'የደህንነት ደንብ እና የአጠቃቀም ስምምነት (EULA)',
          sub: 'ለቤተሰብ አባላት ደህንነት ሲባል እባክዎ የሚከተሉትን ስምምነቶች በትክክል አንብበው ይስማሙ።',
          confirmAge: 'እድሜዬ 18 ወይም ከዚያ በላይ መሆኑን አረጋግጣለሁ።',
          confirmEula: 'በዜሮ-ታገስ ፖሊسيው እና በEULA ስምምነቱ ላይ ሙሉ ለሙሉ እስማማለሁ።',
          confirmTerms: 'የአጠቃቀም መመሪያዎችን (Terms of Service) እና የKYC ግዴታን ተስማምቻለሁ።',
          confirmPrivacy: 'የደህንነት ፖሊሲውን (Privacy Policy) እና መረጃዎችን ለሶስተኛ ወገን ያለማጋራት ደንቡን ተስማምቻለሁ።',
          readFirst: 'እባክዎ መጀመሪያ ስምምነቱን ወደ ታች ስክሮል በማድረግ እስከ መጨረሻው ያንብቡት!',
          btn: 'ስምምነቱን አፅድቄ ልግባ',
          termsLink: 'የአጠቃቀም ደንብ',
          privacyLink: 'የደህንነት ፖሊሲ',
          scrollDown: 'ለመስማማት ወደ ታች ይሂዱ ⬇️',
          readyToAgree: 'የተነበበ - አሁን መስማማት ይችላሉ ✅',
          
          eulaTitle: '1. EULA እና የዜሮ-ታገስ ስምምነት (ስክሪንሾት ክልከላን ጨምሮ)',
          eulaContent: "• ዜሮ-ታገስ ፖሊሲ (Zero-Tolerance)፦ ቤተሰብ ማናቸውንም የስድብ፣ የጥላቻ ንግግር፣ የሀሰት መለያ፣ ማጭበርበር ወይም የወሲብ ይዘት ያላቸውን ነገሮች በፍጹም አይታገስም። ደንቡን የጣሰ አካውንት ያለምንም ማስጠንቀቂያ ወዲያውኑ ይዘጋል (Permanent Ban)።\n\n• ስክሪንሾት እና ቀረጻ ክልከላ (Screenshot & Recording Ban)፦ የአባላትን ደህንነት እና ምስጢራዊነት ለመጠበቅ የሌሎችን ፕሮፋይል ስክሪንሾት ማድረግ፣ ፎቶዎችን ሴቭ ማድረግ ወይም የስልክ/የቪዲዮ ጥሪዎችን መቅረጽ በቤተሰብ መድረክ ላይ በፍጹም የተከለከለ ነው። ይህንን ደንብ መጣስ በቀጥታ ከሲስተሙ ያለምንም ቅድመ-ማስጠንቀቂያ ያባርራል።\n\n• መከባበር፦ ሁሉም አባላት በታማኝነት እና በመከባበር መንቀሳቀስ አለባቸው። ህገ-ወጥ ድርጊቶች ወይም የስም ማጥፋት ሙከራዎች ለህግ አካላት ሪፖርት ይደረጋሉ።",
          
          termsTitle: '2. የአጠቃቀም መመሪያ እና የKYC ማንነት ማረጋገጫ ግዴታ',
          termsContent: "• የKYC ማንነት ማረጋገጫ (Identity Verification)፦ እውነተኛ እና አስተማማኝ ማህበረሰብ ለመፍጠር ሁሉም ተጠቃሚዎች የKYC (Know Your Customer) ማንነት ማረጋገጥ አለባቸው። ትክክለኛ የመንግስት መታወቂያ፣ ፓስፖርት ወይም የመንጃ ፈቃድ እና የቀጥታ ፎቶ (selfie) ማቅረብ ግዴታ ነው።\n\n• የጊፍት እና የኮይኖች አጠቃቀም፦ ማንነትዎ በደህንነት ቡድናችን ቬሪፋይድ እስካልተደረገ ድረስ ከሰዎች ጋር መዛመድ (match)፣ መልእክት መላክ ወይም ምናባዊ ስጦታዎችን (gifts) መላክም ሆነ መቀበል አይችሉም።\n\n• የእድሜ ግዴታ፦ በመድረኩ ለመመዝገብ እድሜዎ 18 ወይም ከዚያ በላይ መሆን አለበት። የሀሰት መረጃ መስጠት አካውንትን ያስዘጋል።",
          
          privacyTitle: '3. የደህንነት ፖሊሲ እና መረጃዎችን ለሶስተኛ ወገን ያለማጋራት ደንብ',
          privacyContent: "• ለሶስተኛ ወገን ያለማጋራት (No Third-Party Sharing)፦ የእርስዎ የግል መረጃዎች፣ የጫኗቸው መታወቂያዎች፣ ፎቶዎች፣ መገኛ ቦታዎ እና ቻቶችዎ በከፍተኛ ምስጠራ (encryption) የተጠበቁ ናቸው። መረጃዎትን ለሶስተኛ ወገን በፍጹም አናጋራም፣ አንሸጥም ወይም አናሳይም።\n\n• የመረጃ ምስጠራ፦ ቻቶች እና ጥሪዎች በምስጠራ የሚተላለፉ በመሆናቸው ማንም ጣልቃ መግባት አይችልም።\n\n• የፕሮፋይል ቁጥጥር፦ በማንኛውም ጊዜ አካውንትዎን እና መረጃዎችዎን ሙሉ በሙሉ የመሰረዝ መብት አልዎት። አካውንት ሲሰረዝ ሁሉም መረጃዎ ከሰርቨራችን ላይ ሙሉ በሙሉ ይወገዳል።"
        };
      case 'om':
        return {
          title: 'Waliigaltee EULA fi Nageenyaa (EULA)',
          sub: 'Nageenya miseensota Maatiif, jalqaba waliigaltee kana sirriitti dubbistanii irratti walii galuu qabdu.',
          confirmAge: 'Umriin koo 18 fi isaa ol ta\'uu isaa nan mirkaneessa.',
          confirmEula: 'Waliigaltee EULA fi Imaammata Obsa-Zero irratti walii nan gala.',
          confirmTerms: 'Shuruudaha Adeegga fi dirqama KYC nan fudhadha.',
          confirmPrivacy: 'Imaammata Nageenyaa fi ragaa qaama sadaffaaf kennuu dhabuu nan fudhadha.',
          readFirst: 'Maaloo jalqaba waliigaltee kana gadi buustanii hanga dhumaatti dubbisaa!',
          btn: 'Waliigaltee nan fudhadha',
          termsLink: 'Shuruudaha Adeegga',
          privacyLink: 'Imaammata Nageenyaa',
          scrollDown: 'Dubbisuuf gadi bu\'aa ⬇️',
          readyToAgree: 'Dubbifameera - Fudhachuu dandeessu ✅',
          
          eulaTitle: '1. Waliigaltee EULA fi Imaammata Obsa-Zero (Screenshot dhoorkuu)',
          eulaContent: "• Imaammata Obsa-Zero: Maatiin arrabsachuu, qaanessuu, profiles sobaa fi gochaalee nagaa booressan kamiyyuu irratti obsa hin qabu. Seera kana kan cabse battalatti adabama.\n\n• Dhorkaa Screenshot fi Waraabbii: Nageenya miseensotaa eeguuf, screenshot kaasuun, suuraa eeguun ykn sagalee fi viidiyoo waraabuun guutummaatti dhorkaadha. Seera kana cabsuun battalatti profile cufuudha.\n\n• Nageenya fi Kabaja: Miseensonni hundi amanamummaa fi kabajaan waliin haasa’uuf dirqama qabu.",
          
          termsTitle: '2. Shuruudaha Adeegga fi Dirqama KYC Mirkaneessuu',
          termsContent: "• KYC Mirkaneessuu: Hawaasa dhugaa fi nageenya qabu uumuuf, fayyadamtoonni hundi KYC (Know Your Customer) mirkaneessuuf dirqama qabu. Waraqaa eenyummaa fi suuraa selfie dhiheessuun dirqama.\n\n• Kennaa fi Gifting: Eenyummaan keessan eessattuu mirkanaa'uu dura namoota waliin match gochuu, ergaa erguu ykn kennaa (gifts) erguu fi fudhachuu hin dandeessan.\n\n• Umrii: Umriin keessan 18 fi isaa ol ta'uu qaba. Odeeffannoo sobaa kennuun profile cufa.",
          
          privacyTitle: '3. Imaammata Nageenyaa fi Ragaa Qaama Sadaffaaf Kennuu Dhabuu',
          privacyContent: "• Data Qaama Sadaffaaf Kennuu Dhabuu: Odeeffannoon keessan dhuunfaa, waraqaan eenyummaa, suuraalee fi chats keessan iccitiidhaan eegama. Data keessan qaama sadaffaaf hin gurgurru, hin kenninus.\n\n• Eegumsa Iccitii: Chats fi viidiyoon keessan iccitiidhaan kan dabru dha.\n\n• Control Dhuunfaa: Yeroo barbaaddanitti odeeffannoo keessan guutummaatti haquuf mirga qabdu."
        };
      case 'ti':
        return {
          title: 'ውዕል ደህንነትን ኣጠቓቕማን (EULA)',
          sub: 'ንደሕንነት ኣባላት ስድራቤት፡ ቅድም ቀዳድም ነዚ ውዕል ብምሉእ ኣንቢብኩም ክትሰማምዑ ይግባእ።',
          confirmAge: 'ዕድመይ 18 ወይ ካብኡ ንላዕሊ ምዃኑ አረጋግጽ።',
          confirmEula: 'ኣብዚ ፖሊሲ ዜሮ-ተፃዋርነትን ውዕል ኣጠቓቕማን (EULA) ምሉእ ብምሉእ እሰማማዕ።',
          confirmTerms: 'ኣብ ውዕል ኣጠቓቕማን (Terms of Service) ምርግጋጽ KYCን እሰማማዕ።',
          confirmPrivacy: 'ኣብ ፖሊሲ ደህንነትን (Privacy Policy) ንሳልሳይ ወገን ዘይምክፋልን እሰማማዕ።',
          readFirst: 'በጃኹም ቅድም ቀዳድም ውዕል ክሳብ መወዳእታ ኣንብብዎ!',
          btn: 'ነዚ ውዕል አፅዲቐ ክኣቱ',
          termsLink: 'ውዕል ኣጠቓቕማ',
          privacyLink: 'ፖሊسي ደህንነት',
          scrollDown: 'ንምንባብ ንድሕሪት ውረዱ ⬇️',
          readyToAgree: 'ተነቢቡ - ሕጂ ክትሰማምዑ ትኽእሉ ✅',
          
          eulaTitle: '1. ውዕል EULAን ፖሊሲ ዜሮ-ተፃዋርነትን (ስክሪንሾት ምእጋድን)',
          eulaContent: "• ፖሊሲ ዜሮ-ተፃዋርነት፦ ቤተሰብ ዝኾነ ጸርፊ፣ ጾታዊ ትንኮሳ፣ ናይ ሓሶት መለያ ወይ ምትላል በፍጹም ኣይዕገስን። ሕጊ ዝጠሓሰ አካውንት ብዘይ መጠንቀቕታ ብቕጽበት ክዕጾ እዩ።\n\n• ክልከላ ስክሪንሾትን ቀረጻን፦ ናይ ኣባላት ደህንነት ንምሕላው ናይ የሕዋት ፕሮፋይል ስክሪንሾት ምግባር፣ ፎቶታት ምስራቕ ወይ ቪድዮ ቀረጻ ምግባር ምሉእ ብምሉእ ዝተከለከለ እዩ። ነዚ ምጥሓስ ንሓዋሩ ምእጋድ የስዕብ።\n\n• መከባበር፦ ኩሎም ኣባላት ብእምነትን ብኽብርን ክንቀሳቐሱ ይግባእ። ዘይሕጋዊ ተግባራት ናብ ሕጊ ክቐርቡ እዮም።",
          
          termsTitle: '2. ውዕል ኣጠቓቕማን ምርግጋጽ KYCን',
          termsContent: "• ምርግጋጽ KYC፦ ሓቀኛን ደህንነቱ ዝተሓለወን ማሕበረሰብ ንምፍጣር ኩሎም ተጠቀምቲ ናይ KYC ምርግጋጽ ከካይዱ ይግባእ። መታወቂያን ናይ ህይወት ፎቶን (Selfie) ምቕራብ ግዴታ እዩ።\n\n• ጊፍትን ቻትን፦ ማንነትኩም ብደህንነት ጉጅለና ክሳብ ዝረጋገጽ ምስ ሰባት ክትዛመዱ (match)፣ መልእኽቲ ክትሰዱ ወይ ጊፍት ክትሰዱን ክትቅበሉን ኣይፍቀድን።\n\n• ዕድመ፦ ዕድመኹም 18 ወይ ካብኡ ንላዕሊ ክኸውን ኣለዎ። ሓሶት መረዳእታ ምቕራብ አካውንት የዕጽው。",
          
          privacyTitle: '3. ፖሊሲ ደህንነትን ንሳልሳይ ወገን ዘይምክፋልን',
          privacyContent: "• ንሳልሳይ ወገን ዘይምክፋል፦ ናትኩም ውልቃዊ መረዳእታ፣ መታወቂያታት፣ ፎቶታት፣ መገኛ ቦታታትን ቻትን ብምስጢር ዝተሓለዉ እዮም። ንሳልሳይ ወገን ኣይንህብን፣ ኣይንሸጥን።\n\n• ምስጢራዊ ምስናይ፦ ቻትን ቪድዮን ምስጢራዊ ብዝኾነ መገዲ ስለ ዝመሓላለፉ ማንም ክርእዮም ኣይኽእልን。\n\n• ምቁጽጻር ፕሮፋይል፦ በማእከልኩም መረዳእታኹም ምሉእ ብምሉእ ክትድምስሱ መሰል ኣለኩም።"
        };
      case 'so':
        return {
          title: 'Heshiiska EULA & Amniga',
          sub: 'Amniga xubnaha qoyska awgeed, fadlan marka hore akhri heshiiskan si sax ahna u ogolaato.',
          confirmAge: 'Waxaan xaqiijinayaa inaan ahay 18 sano ama ka weyn.',
          confirmEula: 'Waxaan ogolahay heshiiska EULA iyo Siyaasadda Obsa-Zero.',
          confirmTerms: 'Waxaan ogolahay Shuruudaha Adeegga iyo Xaqiijinta KYC.',
          confirmPrivacy: 'Waxaan ogolahay Siyaasadda Khaaska ah iyo ilaalinta xogta.',
          readFirst: 'Fadlan marka hore hoos u deji heshiiska ilaa dhamaadka si aad u ogolaato!',
          btn: 'Aqbal oo Gal',
          termsLink: 'Shuruudaha Adeegga',
          privacyLink: 'Siyaasadda Khaaska ah',
          scrollDown: 'Fadlan hoos u deji ⬇️',
          readyToAgree: 'Waa la akhriyay - Waad ogolaan kartaa ✅',
          
          eulaTitle: '1. Heshiiska EULA & Siyaasadda Obsa-Zero (Mamnuucidda Screenshot)',
          eulaContent: "• Obsa-Zero: Beteseb uma dulqaato xadgudubyada, aflagaadada, sawirada anshax xumada ah ama profiles-ka been abuurka ah. Koontada jebisa sharciga waa la xiri doonaa digniin la'aan.\n\n• Dhanka Screenshot & Record-ka: Si loo ilaaliyo amniga isticmaalayaasha, waa mamnuuc in screenshot laga qaado profiles-ka, sawirada la keydiyo ama la duubo wicitaanada. Qofkii sharcigan jebiya waxaa laga saarayaa system-ka weligiis.\n\n• Ixtiraamka: Dhammaan isticmaalayaasha waa inay is-ixtiraamaan si daacad ahna u wada xiriiraan.",
          
          termsTitle: '2. Shuruudaha Adeegga & Xaqiijinta KYC ee Diiwaangelinta',
          termsContent: "• Xaqiijinta KYC: Si loo hubiyo amniga bulshada, qof kasta waxaa ku waajib ah inuu maro xaqiijinta KYC (Know Your Customer) asagoo soo upload-gareynaya ID sax ah iyo selfie live ah.\n\n• Gifting iyo Match-ka: Ma awoodi doontid inaad qof la match-gareyso, fariimo dirto, ama hadiyado (gifts) dirto oo aad hesho ilaa amnigaaga la xaqiijiyo.\n\n• Da'da: Waa inaad tahay 18 sano ama ka weyn si aad isku diiwaangeliso.",
          
          privacyTitle: '3. Siyaasadda Khaaska ah & Ilaalinta Macluumaadka Gaarka ah',
          privacyContent: "• Wadaagid La'aan: Macluumaadkaaga gaarka ah, ID-gaaga, sawiradaada iyo fariimahaaga si buuxda ayaa loo qariyay. Marnaba la wadaagi mayno oo ka iibin mayno qaab saddexaad.\n\n• Encryption: Fariimaha iyo wicitaanada waxay u gudbaan si qarsoodi ah oo amni ah.\n\n• Control: Waxaad awood u leedahay inaad delete-gareyso profile-kaaga iyo dhammaan macluumaadkaaga waqti kasta."
        };
      case 'ar':
        return {
          title: 'اتفاقية ترخيص المستخدم النهائي والأمان (EULA)',
          sub: 'للحفاظ على سلامة مجتمع بيتسيب، يرجى قراءة الشروط والموافقة عليها أولاً.',
          confirmAge: 'أؤكد أن عمري 18 عاماً أو أكثر.',
          confirmEula: 'أوافق على اتفاقية EULA وسياسة عدم التسامح المطلق.',
          confirmTerms: 'أوافق على شروط الخدمة والتحقق من الهوية (KYC).',
          confirmPrivacy: 'أوافق على سياسة الخصوصية وحماية البيانات الشخصية.',
          readFirst: 'يرجى التمرير لأسفل وقراءة الاتفاقية بالكامل حتى النهاية أولاً!',
          btn: 'قبول ومتابعة',
          termsLink: 'شروط الخدمة',
          privacyLink: 'سياسة الخصوصية',
          scrollDown: 'يرجى التمرير لأسفل للقراءة ⬇️',
          readyToAgree: 'تمت القراءة - يمكنك الموافقة الآن ✅',
          
          eulaTitle: '1. اتفاقية EULA وسياسة عدم التسامح المطلق (حظر تصوير الشاشة)',
          eulaContent: "• عدم التسامح المطلق: تتبع منصة بيتسيب سياسة صارمة ضد التحرش، المحتوى الإباحي، الحسابات المزيفة، أو الاحتيال. سيتم حظر أي حساب مخالف فوراً وبدون سابق إنذار.\n\n• حظر تصوير الشاشة والتسجيل: لحماية خصوصية الأعضاء، يُحظر تماماً التقاط صور للشاشة (Screenshot) للملفات الشخصية، أو حفظ الصور الخاصة، أو تسجيل المكالمات الصوتية والمرئية. انتهاك هذه القاعدة سيؤدي إلى حظر الحساب نهائياً وفوراً.\n\n• الاحترام المتبادل: يجب على جميع الأعضاء التعامل بصدق واحترام.",
          
          termsTitle: '2. شروط الخدمة والتحقق من الهوية (KYC) الإلزامي',
          termsContent: "• التحقق من الهوية (KYC): لضمان مجتمع حقيقي وآمن، يجب على جميع المستخدمين إكمال التحقق من الهوية عن طريق تحميل وثيقة هوية صالحة وصورة شخصية (Selfie) مباشرة.\n\n• الهدايا والمطابقة: لن تتمكن من مطابقة المستخدمين الآخرين، أو إرسال الرسائل، أو إرسال واستقبال الهدايا الافتراضية قبل إكمال التحقق من الهوية واعتماده من فريق الأمان.\n\n• السن القانوني: يجب أن لا يقل عمرك عن 18 عاماً للتسجيل.",
          
          privacyTitle: '3. سياسة الخصوصية وحظر مشاركة البيانات مع أي طرف ثالث',
          privacyContent: "• عدم مشاركة البيانات مع طرف ثالث: جميع بياناتك الشخصية، وثائق الهوية، موقعك، ومحادثاتك مشفرة بالكامل. نحن لا نشارك أو نبيع بياناتك لأي طرف ثالث على الإطلاق.\n\n• تشفير المحادثات: يتم نقل المحادثات والمكالمات بشكل مشفر وآمن لمنع أي تطفل.\n\n• التحكم بالملف الشخصي: لديك الحق الكامل في حذف حسابك وجميع بياناتك المرتبطة به في أي وقت."
        };
      default:
        return {
          title: 'End-User License Agreement (EULA) & Safety Gate',
          sub: 'To ensure the safety of the Beteseb family, you must review and agree to our guidelines.',
          confirmAge: 'I confirm that I am 18 years of age or older.',
          confirmEula: 'I agree to the Zero-Tolerance Policy and the EULA Terms.',
          confirmTerms: 'I agree to the Terms of Service and KYC Requirements.',
          confirmPrivacy: 'I agree to the Privacy Policy and Zero Third-Party Sharing.',
          readFirst: 'Please scroll down and read the agreement to the bottom first!',
          btn: 'Accept & Enter Beteseb',
          termsLink: 'Terms of Service',
          privacyLink: 'Privacy Policy',
          scrollDown: 'Scroll down to read ⬇️',
          readyToAgree: 'Read - You may now agree ✅',
          
          eulaTitle: '1. EULA & Zero-Tolerance Abuse Policy (Including Screenshot Ban)',
          eulaContent: "• Zero Tolerance: Beteseb operates under a strict zero-tolerance policy for abuse, pornography, hate speech, and harassment. Any violations will result in immediate account termination.\n\n• Screenshot & Screen Recording Ban: To protect member privacy, attempting to screenshot profiles, save private photos, or record audio/video calls is strictly prohibited. Violating this rule will lead to an instant and permanent ban from the platform.\n\n• Safety and Respect: All members must interact with honesty and respect. Any fraudulent patterns or scam behavior will be reported to legal authorities.",
          
          termsTitle: '2. Terms of Service & KYC Identity Verification Requirement',
          termsContent: "• KYC Verification: To ensure a genuine and safe community, all users must complete KYC (Know Your Customer) identity verification. You will be required to upload a valid ID document and a live selfie.\n\n• Gifts & Matching Gate: You cannot match with other users, send messages, or send/receive virtual gifts until your identity is fully verified by our safety team.\n\n• Age Requirement: You must be at least 18 years old to register. Providing false information is a violation of these terms.",
          
          privacyTitle: '3. Privacy Policy & Zero Third-Party Data Sharing',
          privacyContent: "• Zero Third-Party Sharing: Your personal data, document uploads (ID and selfie), locations, and chats are encrypted and securely stored. We never share, sell, or expose your data to any third parties.\n\n• Data Encryption: Chats and video calls are transmitted securely to prevent interception.\n\n• Profile Control: You retain full ownership and control over your profile data, with the right to delete your account and all associated data at any time."
        };
    }
  };

  const texts = getTexts(locale);

  const handleAccept = () => {
    if (confirmAge && agreedToEula && agreedToTerms && agreedToPrivacy) {
      localStorage.setItem('beteseb_eula_accepted', 'true');
      setIsVisible(false);
      if (onAccept) {
        onAccept();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
        
        {/* Header (Static) */}
        <div className="relative space-y-4 shrink-0 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white italic tracking-tight leading-tight">
                {texts.title}
              </h2>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Beteseb Trust & Safety</p>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
            {texts.sub}
          </p>
        </div>

        {/* Scrollable Agreement List (Body) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">

          {/* 1. Age Confirmation (Simple check, no scroll required) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3.5 cursor-pointer" onClick={() => setConfirmAge(!confirmAge)}>
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={confirmAge}
                onChange={(e) => setConfirmAge(e.target.checked)}
                className="peer h-5.5 w-5.5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
              <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-200 font-bold select-none leading-snug">
              {texts.confirmAge}
            </span>
          </div>

          {/* 2. EULA & Zero-Tolerance Abuse Policy */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => setActiveTab(activeTab === 'eula' ? null : 'eula')}
              className="w-full p-4 flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ScrollText size={16} className="text-primary" />
                <span>{texts.eulaTitle}</span>
              </div>
              {activeTab === 'eula' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {activeTab === 'eula' && (
              <div className="p-4 pt-0 space-y-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-[140px] overflow-y-auto text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-line">
                  {texts.eulaContent}
                </div>

                <div
                  onClick={() => setAgreedToEula(!agreedToEula)}
                  className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${agreedToEula ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'}`}
                >
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreedToEula}
                      onChange={(e) => setAgreedToEula(e.target.checked)}
                      className="peer h-5.5 w-5.5 appearance-none rounded-md border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-bold select-none leading-snug">
                    {texts.confirmEula}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Terms of Service & KYC Warning */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => setActiveTab(activeTab === 'terms' ? null : 'terms')}
              className="w-full p-4 flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-primary" />
                <span>{texts.termsTitle}</span>
              </div>
              {activeTab === 'terms' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {activeTab === 'terms' && (
              <div className="p-4 pt-0 space-y-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-[140px] overflow-y-auto text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-line">
                  {texts.termsContent}
                </div>

                <div
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${agreedToTerms ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'}`}
                >
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="peer h-5.5 w-5.5 appearance-none rounded-md border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-bold select-none leading-snug">
                    {texts.confirmTerms}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Privacy Policy & Zero Third-Party Sharing */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => setActiveTab(activeTab === 'privacy' ? null : 'privacy')}
              className="w-full p-4 flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <EyeOff size={16} className="text-primary" />
                <span>{texts.privacyTitle}</span>
              </div>
              {activeTab === 'privacy' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {activeTab === 'privacy' && (
              <div className="p-4 pt-0 space-y-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-[140px] overflow-y-auto text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-line">
                  {texts.privacyContent}
                </div>

                <div
                  onClick={() => setAgreedToPrivacy(!agreedToPrivacy)}
                  className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${agreedToPrivacy ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'}`}
                >
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                      className="peer h-5.5 w-5.5 appearance-none rounded-md border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-bold select-none leading-snug">
                    {texts.confirmPrivacy}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer (Static Accept Button) */}
        <div className="relative shrink-0 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={handleAccept}
            disabled={!confirmAge || !agreedToEula || !agreedToTerms || !agreedToPrivacy}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            {texts.btn}
          </button>
        </div>
      </div>
    </div>
  );
}
