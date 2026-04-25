
const fs = require('fs');
['en', 'ar', 'am', 'om'].forEach(lang => {
  const data = JSON.parse(fs.readFileSync('messages/' + lang + '.json', 'utf8'));
  
  const translations = {
    en: { trialExpired: 'Trial Expired', trialEnded: 'Your 3-day trial has ended. Please subscribe to continue finding your perfect match.', upgradeNow: 'Upgrade Now', backToDash: 'Back to Dashboard', subscription: 'Subscription' },
    am: { trialExpired: 'የሙከራ ጊዜዎ አልቋል', trialEnded: 'የ 3 ቀን የሙከራ ጊዜዎ አልቋል። ፍጹም አጋርዎን ማግኘት ለመቀጠል እባክዎ ይመዝገቡ።', upgradeNow: 'አሁን ያሻሽሉ', backToDash: 'ወደ ማስተዳደሪያ ይመለሱ', subscription: 'ምዝገባ' },
    ar: { trialExpired: 'انتهت الفترة التجريبية', trialEnded: 'لقد انتهت الفترة التجريبية التي تبلغ 3 أيام. يرجى الاشتراك لمواصلة العثور على شريكك المثالي.', upgradeNow: 'قم بالترقية الآن', backToDash: 'العودة إلى لوحة القيادة', subscription: 'الاشتراك' },
    om: { trialExpired: 'የሙከራ ጊዜዎ አልቋል', trialEnded: 'የ 3 ቀን የሙከራ ጊዜዎ አልቋል።', upgradeNow: 'አሁን ያሻሽሉ', backToDash: 'ወደ ማስተዳደሪያ ይመለሱ', subscription: 'ምዝገባ' }
  };

  data.Dashboard = { ...data.Dashboard, ...translations[lang] };
  fs.writeFileSync('messages/' + lang + '.json', JSON.stringify(data, null, 2));
});
