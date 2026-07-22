const fs = require('fs');

const localeData = {
  en: {
    paymentSuccess: {
      coinsTitle: 'Coins Purchased!',
      coinsBody: 'Your coins have been credited to your account. Enjoy sending gifts and unlocking features!',
      vipTitle: 'VIP Access Activated!',
      vipBody: 'Your VIP membership is now active. Enjoy exclusive access and premium features!',
      premiumTitle: 'Premium Activated!',
      premiumBody: 'Your premium subscription is now active. Explore all the exclusive features!',
    },
    paymentError: {
      title: 'Payment Verification Failed',
      body: 'We could not verify your payment. Please contact support with your transaction reference.',
    },
    navWedding: 'Wedding Planner',
    navGifts: 'Gifts',
  },
  am: {
    paymentSuccess: {
      coinsTitle: 'ኮይኖቹ ገቡ!',
      coinsBody: 'ኮይኖቹ ወደ አካውንቱ ገብተዋል። ስጦታ መላክ እና ባህሪያትን ለመክፈት ተጠቀምባቸው!',
      vipTitle: 'VIP አባልነት ተሰጥቷል!',
      vipBody: 'VIP አባልነትዎ አሁን ንቁ ነው። ልዩ ሙሉ ተጠቃሚ ሆነዋል!',
      premiumTitle: 'ፕሪሚየም ተሰጥቷል!',
      premiumBody: 'ፕሪሚየም አባልነትዎ አሁን ንቁ ነው። ሁሉንም ልዩ ባህሪያት ያሰሱ!',
    },
    paymentError: {
      title: 'ክፍያ ማረጋገጫ አልተሳካም',
      body: 'ክፍያዎን ማረጋገጥ አልቻልንም። እባክዎ ከትራንዛክሽን ማጣቀሻዎ ጋር ድጋፍን ያነጋግሩ።',
    },
    navWedding: 'የሰርግ እቅድ',
    navGifts: 'ስጦታዎች',
  },
  om: {
    paymentSuccess: {
      coinsTitle: 'Kooyinoonni Galanii!',
      coinsBody: 'Kooyinoonni akkaawuntii kee keessatti galanii jiru. Kennaa erguu fi meeshaalee saaquu irratti fayyadami!',
      vipTitle: 'Miseensummaa VIP Argatte!',
      vipBody: 'Miseensummaan VIP kee amma hojjechaa jira. Fayyadamaa qulqulluu guutuu taatee jirta!',
      premiumTitle: 'Premium Argatte!',
      premiumBody: "Miseensummaan premium kee amma hojjechaa jira. Meeshaalee mara sakatta'i!",
    },
    paymentError: {
      title: 'Mirkaneessaan Kafaltii Hin Milkoofne',
      body: 'Kafaltii kee mirkaneessuu hin dandeenye. Maaloo deeggarsa faayidaa transaction kee waliin quunnamii.',
    },
    navWedding: 'Karoora Cidha',
    navGifts: 'Kennaalee',
  },
};

['en', 'am', 'om'].forEach(locale => {
  const filePath = './messages/' + locale + '.json';
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.Dashboard) data.Dashboard = {};
  data.Dashboard.paymentSuccess = localeData[locale].paymentSuccess;
  data.Dashboard.paymentError = localeData[locale].paymentError;
  
  if (!data.Nav) data.Nav = {};
  data.Nav.wedding = localeData[locale].navWedding;
  data.Nav.gifts = localeData[locale].navGifts;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated ' + locale + '.json');
});
