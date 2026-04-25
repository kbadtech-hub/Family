
const fs = require('fs');
['en', 'ar', 'am', 'om'].forEach(lang => {
  const data = JSON.parse(fs.readFileSync('messages/' + lang + '.json', 'utf8'));
  const translations = {
    en: { botName: 'Beteseb AI' },
    am: { botName: 'ቤተሰብ AI' },
    ar: { botName: 'بيتسب AI' },
    om: { botName: 'Beteseb AI' }
  };
  data.Chatbot = { ...data.Chatbot, ...translations[lang] };
  fs.writeFileSync('messages/' + lang + '.json', JSON.stringify(data, null, 2));
});
