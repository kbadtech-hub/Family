
const fs = require('fs');
['en', 'ar', 'am', 'om'].forEach(lang => {
  const data = JSON.parse(fs.readFileSync('messages/' + lang + '.json', 'utf8'));
  
  const translations = {
    en: { doc: 'Upload Document', idType: 'ID Card or Passport', idCaptured: 'ID Captured', takeSelfie: 'Take Selfie', livePhoto: 'Live Photo Match', selfieCaptured: 'Selfie Captured', submitAI: 'Submit for AI Verification', rejected: 'Verification was rejected. Please ensure your photos are clear and try again.' },
    am: { doc: 'ማንነት ማረጋገጫ ይጫኑ', idType: 'ፓስፖርት ወይም መታወቂያ', idCaptured: 'ማረጋገጫ ተጭኗል', takeSelfie: 'ፎቶ አንሳ', livePhoto: 'የቀጥታ ፎቶ', selfieCaptured: 'ፎቶ ተነስቷል', submitAI: 'ለAI ማረጋገጫ ላክ', rejected: 'ማረጋገጫው ተቀባይነት አላገኘም። እባክዎ ፎቶዎች ግልጽ መሆናቸውን አረጋግጠው እንደገና ይሞክሩ።' },
    ar: { doc: 'تحميل المستند', idType: 'بطاقة هوية أو جواز سفر', idCaptured: 'تم التقاط الهوية', takeSelfie: 'التقط صورة ذاتية', livePhoto: 'صورة حية', selfieCaptured: 'تم التقاط صورة ذاتية', submitAI: 'إرسال للتحقق من الذكاء الاصطناعي', rejected: 'تم رفض التحقق. يرجى التأكد من وضوح الصورة.' },
    om: { doc: 'ማንነት ማረጋገጫ ይጫኑ', idType: 'ፓስፖርት ወይም መታወቂያ', idCaptured: 'ማረጋገጫ ተጭኗል', takeSelfie: 'ፎቶ አንሳ', livePhoto: 'የቀጥታ ፎቶ', selfieCaptured: 'ፎቶ ተነስቷል', submitAI: 'ለAI ማረጋገጫ ላክ', rejected: 'ማረጋገጫው ተቀባይነት አላገኘም።' }
  };

  data.Onboarding.idVerification = { ...data.Onboarding.idVerification, ...translations[lang] };
  fs.writeFileSync('messages/' + lang + '.json', JSON.stringify(data, null, 2));
});
