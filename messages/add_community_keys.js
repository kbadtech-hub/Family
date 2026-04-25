const fs = require('fs');
['en', 'ar', 'am', 'om'].forEach(lang => {
  const data = JSON.parse(fs.readFileSync('messages/' + lang + '.json', 'utf8'));
  
  const translations = {
    en: { 
      moderated: 'Moderated', 
      topicDay: 'Topic of the Day', 
      topicQuestion: '"What are the three core values you believe are essential for a lasting marriage in the digital age?"',
      topicJoin: 'Join the discussion with 1,200+ Beteseb family members. Your voice matters.',
      joinBtn: 'Join Discussion',
      aiFilter: 'AI Safety Filter Active',
      checking: 'Checking...',
      verifyToPostTitle: 'Verification Required to Post',
      verifyToPostSub: 'You can read community posts, but you need to verify your identity to join the discussion.',
      memberBadge: 'Beteseb Member',
      loadingFeed: 'Loading Family Feed...',
      safetyAlert: 'Your post contains content that does not align with our family-oriented community values. Please keep it respectful.'
    },
    am: { 
      moderated: 'የተገመገመ', 
      topicDay: 'የቀኑ አጀንዳ', 
      topicQuestion: '"በትዳር ውስጥ ለዘላቂ ደስታ አስፈላጊ ናቸው ብለው የሚያምኑባቸው ሶስት ዋና እሴቶች ምንድን ናቸው?"',
      topicJoin: 'ከ 1,200 በላይ ከሚሆኑ የቤተሰብ አባላት ጋር ይወያዩ። የእርስዎ ድምጽ አስፈላጊ ነው።',
      joinBtn: 'ውይይቱን ይቀላቀሉ',
      aiFilter: 'AI የደህንነት ማጣሪያ ነቅቷል',
      checking: 'እየተረጋገጠ ነው...',
      verifyToPostTitle: 'ለመሳተፍ ማረጋገጫ ያስፈልጋል',
      verifyToPostSub: 'ውይይቶችን ማንበብ ይችላሉ፣ ነገር ግን ለመሳተፍ ማንነትዎን ማረጋገጥ አለብዎት።',
      memberBadge: 'የቤተሰብ አባል',
      loadingFeed: 'መረጃው እየተጫነ ነው...',
      safetyAlert: 'መልእክትዎ ከቤተሰባችን እሴቶች ጋር የማይጣጣም ይዘት ይዟል። እባክዎን በትህትና ይግለጹ።'
    },
    ar: { 
      moderated: 'مراقب', 
      topicDay: 'موضوع اليوم', 
      topicQuestion: '"ما هي القيم الثلاث الأساسية التي تعتقد أنها ضرورية لزواج دائم في العصر الرقمي؟"',
      topicJoin: 'انضم إلى المناقشة مع أكثر من 1200 فرد من عائلة بيتسب. صوتك مهم.',
      joinBtn: 'انضم للمناقشة',
      aiFilter: 'مرشح أمان الذكاء الاصطناعي نشط',
      checking: 'جاري التحقق...',
      verifyToPostTitle: 'مطلوب التحقق للنشر',
      verifyToPostSub: 'يمكنك قراءة المنشورات، لكنك تحتاج إلى التحقق من هويتك للانضمام إلى المناقشة.',
      memberBadge: 'عضو بيتسب',
      loadingFeed: 'جاري تحميل التغذية...',
      safetyAlert: 'يحتوي منشورك على محتوى لا يتوافق مع قيم مجتمعنا. يرجى الحفاظ على الاحترام.'
    },
    om: { 
      moderated: 'የተገመገመ', 
      topicDay: 'የቀኑ አጀንዳ', 
      topicQuestion: '"በትዳር ውስጥ ለዘላቂ ደስታ አስፈላጊ ናቸው ብለው የሚያምኑባቸው ሶስት ዋና እሴቶች ምንድን ናቸው?"',
      topicJoin: 'ከ 1,200 በላይ ከሚሆኑ የቤተሰብ አባላት ጋር ይወያዩ። የእርስዎ ድምጽ አስፈላጊ ነው።',
      joinBtn: 'ውይይቱን ይቀላቀሉ',
      aiFilter: 'AI የደህንነት ማጣሪያ ነቅቷል',
      checking: 'እየተረጋገጠ ነው...',
      verifyToPostTitle: 'ለመሳተፍ ማረጋገጫ ያስፈልጋል',
      verifyToPostSub: 'ውይይቶችን ማንበብ ይችላሉ፣ ነገር ግን ለመሳተፍ ማንነትዎን ማረጋገጥ አለብዎት።',
      memberBadge: 'የቤተሰብ አባል',
      loadingFeed: 'መረጃው እየተጫነ ነው...',
      safetyAlert: 'መልእክትዎ ከቤተሰባችን እሴቶች ጋር የማይጣጣም ይዘት ይዟል። እባክዎን በትህትና ይግለጹ።'
    }
  };

  data.community = { ...data.community, ...translations[lang] };
  
  const aboutExtra = {
    en: { joinStats: 'Join 1,000+ Happy Families' },
    am: { joinStats: 'ከ 1,000 በላይ ደስተኛ ቤተሰቦችን ይቀላቀሉ' },
    ar: { joinStats: 'انضم إلى أكثر من 1000 عائلة سعيدة' },
    om: { joinStats: 'ከ 1,000 በላይ ደስተኛ ቤተሰቦችን ይቀላቀሉ' }
  };
  data.About = { ...data.About, ...aboutExtra[lang] };

  fs.writeFileSync('messages/' + lang + '.json', JSON.stringify(data, null, 2));
});
