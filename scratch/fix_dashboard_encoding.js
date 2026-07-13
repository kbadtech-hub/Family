const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Helper functions to be inserted at appropriate location
const helperFunctions = `
  const getCandidatesLabel = (count: number, currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return \`\${count} ዕጩዎች\`;
      case 'om': return \`\${count} dorgomaa\`;
      case 'ar': return \`\${count} مرشحين\`;
      case 'ti': return \`\${count} ሕፁያት\`;
      case 'so': return \`\${count} musharaxiin\`;
      case 'en':
      default: return \`\${count} candidates\`;
    }
  };

  const getPremiumSub = (currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return 'ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።';
      case 'om': return 'Garmalee wal-gitiinsaa daangaa malee, odeeffannoo guutuu piroofaayilaa fi deeggarsa dursa argadhu.';
      case 'ar': return 'احصل على تطابقات غير محدودة، وتفاصيل الملف الشخصي الكاملة، ودعم ذو أولوية.';
      case 'ti': return 'ዘይተደረተ ግጥምማት፣ ምሉእ ዝርዝር ፕሮፋይልን ቀዳምነት ዝወሃቦ ደገፍን ረኸቡ።';
      case 'so': return 'Hel ku-habboonaan aan xadidnayn, faahfaahinta profile-ka oo buuxda, iyo taageero mudnaan leh.';
      case 'en':
      default: return 'Unlock unlimited matches, full profile details, and priority support.';
    }
  };

  const getFriendRequestText = (senderName: string, currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return senderName ? \`\${senderName} የጓደኝነት ጥያቄ ልኮልዎታል።\` : 'የጓደኝነት ጥያቄ ልኮልዎታል።';
      case 'om': return senderName ? \`\${senderName} gaaffii michummaa isinii ergeera.\` : 'gaaffii michummaa isinii ergeera.';
      case 'ar': return senderName ? \`أرسل لك \${senderName} طلب صداقة.\` : 'أرسل لك طلب صداقة.';
      case 'ti': return senderName ? \`\${senderName} ናይ ዕርክነት ሕቶ ልኢኹልካ ኣሎ።\` : 'ናይ ዕርክነት ሕቶ ልኢኹልካ ኣሎ።';
      case 'so': return senderName ? \`\${senderName} wuxuu kuu soo diray codsi saaxiibtinimo.\` : 'wuxuu kuu soo diray codsi saaxiibtinimo.';
      case 'en':
      default: return senderName ? \`\${senderName} sent you a friend request.\` : 'sent you a friend request.';
    }
  };

  const getAcceptLabel = (currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return 'ተቀበል';
      case 'om': return 'Fudhadhu';
      case 'ar': return 'قبول';
      case 'ti': return 'ተቐበል';
      case 'so': return 'Oggolow';
      case 'en':
      default: return 'Accept';
    }
  };

  const getDeclineLabel = (currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return 'አትቀበል';
      case 'om': return 'Didu';
      case 'ar': return 'رفض';
      case 'ti': return 'ኣይትቀበል';
      case 'so': return 'Diid';
      case 'en':
      default: return 'Decline';
    }
  };
`;

// Insert the helpers right inside DashboardContent, after 'const COIN_PER_POST = 20;'
content = content.replace(
  'const COIN_PER_POST = 20;',
  'const COIN_PER_POST = 20;\n' + helperFunctions
);

// 1. Fix languages list
const badLanguages = `  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'áŠ áˆ›áˆ­áŠ›' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' },
    { id: 'ti', label: 'á‰µáŒ áˆ­áŠ›' },
    { id: 'so', label: 'Soomaali' }
  ];`;

const goodLanguages = `  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'አማርኛ' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'العربية' },
    { id: 'ti', label: 'ትግርኛ' },
    { id: 'so', label: 'Soomaali' }
  ];`;

content = content.replace(badLanguages, goodLanguages);

// 2. Fix tier icons
content = content.replace("case 'diamond': return 'ðŸ’Ž';", "case 'diamond': return '💎';");
content = content.replace("case 'platinum': return 'ðŸŒŸ';", "case 'platinum': return '🌟';");
content = content.replace("case 'gold': return 'ðŸ¥‡';", "case 'gold': return '🥇';");
content = content.replace("case 'silver': return 'ðŸ¥ˆ';", "case 'silver': return '🥈';");
content = content.replace("case 'bronze':", "case 'bronze':");
content = content.replace("default: return 'ðŸ¥‰';", "default: return '🥉';");
content = content.replace("ðŸ‘‘", "👑");

// 3. Fix getTierName translations
const badGetTierName = `  const getTierName = (tier: string) => {
    switch (tier) {
      case 'diamond': return locale === 'am' ? 'á‹³á‹­áˆ˜áŠ•á‹µ (Diamond Tier)' : 'Diamond Tier';
      case 'platinum': return locale === 'am' ? 'á •áˆ‹á‰²áŠ’á‹¨ˆ  (Platinum Tier)' : 'Platinum Tier';
      case 'gold': return locale === 'am' ? 'áŒŽáˆ á‹°áŠ• (Gold Tier)' : 'Gold Tier';
      case 'silver': return locale === 'am' ? 'á‰¤á‹šáŠ­ áˆ›áˆ¨áŒ‹áŒˆáŒ« (Silver Tier)' : 'Basic Verified (Silver Tier)';
      case 'bronze':
      default: return locale === 'am' ? 'á‹«áˆ á‰°áˆ¨áŒ‹áŒ  (Bronze Tier)' : 'Unverified (Bronze Tier)';
    }
  };`;

const goodGetTierName = `  const getTierName = (tier: string) => {
    switch (locale) {
      case 'am':
        switch (tier) {
          case 'diamond': return 'ዳይመንድ (Diamond Tier)';
          case 'platinum': return 'ፕላቲኒየም (Platinum Tier)';
          case 'gold': return 'ጎልደን (Gold Tier)';
          case 'silver': return 'ቤዚክ ማረጋገጫ (Silver Tier)';
          case 'bronze':
          default: return 'ያልተረጋገጠ (Bronze Tier)';
        }
      case 'om':
        switch (tier) {
          case 'diamond': return 'Daayimondii (Diamond Tier)';
          case 'platinum': return 'Pilaatinimii (Platinum Tier)';
          case 'gold': return 'Warqee (Gold Tier)';
          case 'silver': return 'Mirkanaa\\'aa Bu\\'uuraa (Silver Tier)';
          case 'bronze':
          default: return 'Kan hin mirkaneeffamin (Bronze Tier)';
        }
      case 'ar':
        switch (tier) {
          case 'diamond': return 'الماسي (Diamond Tier)';
          case 'platinum': return 'البلاتيني (Platinum Tier)';
          case 'gold': return 'الذهبي (Gold Tier)';
          case 'silver': return 'مفتوح أساسي (Silver Tier)';
          case 'bronze':
          default: return 'غير مؤكد (Bronze Tier)';
        }
      case 'ti':
        switch (tier) {
          case 'diamond': return 'ዳይመንድ (Diamond Tier)';
          case 'platinum': return 'ፕላቲኒየም (Platinum Tier)';
          case 'gold': return 'ወርቂ (Gold Tier)';
          case 'silver': return 'መሰረታዊ ዝተረጋገጸ (Silver Tier)';
          case 'bronze':
          default: return 'ዘይተረጋገጸ (Bronze Tier)';
        }
      case 'so':
        switch (tier) {
          case 'diamond': return 'Dheeman (Diamond Tier)';
          case 'platinum': return 'Platinam (Platinum Tier)';
          case 'gold': return 'Dahab (Gold Tier)';
          case 'silver': return 'Xaqiijiyay Asaasiga (Silver Tier)';
          case 'bronze':
          default: return 'Aan la xaqiijin (Bronze Tier)';
        }
      case 'en':
      default:
        switch (tier) {
          case 'diamond': return 'Diamond Tier';
          case 'platinum': return 'Platinum Tier';
          case 'gold': return 'Gold Tier';
          case 'silver': return 'Basic Verified (Silver Tier)';
          case 'bronze':
          default: return 'Unverified (Bronze Tier)';
        }
    }
  };`;

content = content.replace(badGetTierName, goodGetTierName);

// 4. Fix handleLike alerts and push
content = content.replace(
  'alert(locale === \'am\' ? \'á‰°á‹›áˆ á‹°á‹‹áˆ ! áŠ áˆ áŠ• áˆ˜áŠ áŒ‹áŒˆáˆ­ á‹­á‰½áˆ‹áˆ‰á ¢\' : "It\'s a Match! You can now start chatting.");',
  `alert(
          locale === 'am' ? 'ተዛምደዋል! አሁን መነጋገር ይችላሉ።' :
          locale === 'om' ? 'Wal-gittanittu! Amma haasaa jalqabuu dandeessu.' :
          locale === 'ar' ? 'لقد تطابقتما! يمكنكما الآن بدء الدردشة.' :
          locale === 'ti' ? 'ተዛሚድኩም ኣለኹም! ሕጂ ክትዛረቡ ትኽእሉ ኢኹም።' :
          locale === 'so' ? 'Waad ku-habboonaatay! Hadda waxaad bilaabi kartaa wada sheekaysiga.' :
          "It's a Match! You can now start chatting."
        );`
);

content = content.replace(
  "alert(locale === 'am' ? 'áˆ‹á‹­áŠ­ á‰°á‹°áˆ­áŒ“áˆ !' : 'Profile liked!');",
  `alert(
          locale === 'am' ? 'ላይክ ተደርጓል!' :
          locale === 'om' ? 'Jaallatameera!' :
          locale === 'ar' ? 'تم تسجيل الإعجاب بالملف الشخصي!' :
          locale === 'ti' ? 'ላይክ ተገይሩሎ!' :
          locale === 'so' ? 'Profile-ka waa la jaalleeyay!' :
          'Profile liked!'
        );`
);

content = content.replace(
  "title: locale === 'am' ? 'áŠ á‹²áˆµ áˆ‹á‹­áŠ­' : 'New Profile Like',",
  `title: 
              locale === 'am' ? 'አዲስ ላይክ' :
              locale === 'om' ? 'Jaalala Piroofaayilaa Haaraya' :
              locale === 'ar' ? 'إعجاب جديد بالملف الشخصي' :
              locale === 'ti' ? 'ሓዱሽ ላይክ' :
              locale === 'so' ? 'Like Profile Cusub' :
              'New Profile Like',`
);

content = content.replace(
  "body: locale === 'am'\n              ? `${profile.full_name} áˆ‹á‹­áŠ­ áŠ á‹µáˆ­áŒŽá‹Žá‰³áˆ !` : `${profile.full_name} liked your profile!`",
  `body:
              locale === 'am' ? \`\${profile.full_name} ላይክ አድርጎዎታል!\` :
              locale === 'om' ? \`\${profile.full_name} piroofaayila keessan jaallateera!\` :
              locale === 'ar' ? \`أعجب \${profile.full_name} بملفك الشخصي!\` :
              locale === 'ti' ? \`\${profile.full_name} ላይክ ገይሩልኩም ኣሎ!\` :
              locale === 'so' ? \`\${profile.full_name} wuxuu ka helay profile-kaaga!\` :
              \`\${profile.full_name} liked your profile!\``
);

// 5. Fix handleSendFriendRequest alerts and push
content = content.replace(
  "alert(locale === 'am' ? 'á‹¨áŒ‹á‹°áŠ›áŠ á‰  á‹°á‹µáˆ«' : 'Friend request sent!');",
  `alert(
        locale === 'am' ? 'የጓደኝነት ጥያቄ ተልኳል!' :
        locale === 'om' ? 'Gaaffiin michummaa ergameera!' :
        locale === 'ar' ? 'تم إرسال طلب الصداقة!' :
        locale === 'ti' ? 'ናይ ዕርክነት ሕቶ ተልኢኹ ኣሎ!' :
        locale === 'so' ? 'Codsiga saaxiibtinimo waa la diray!' :
        'Friend request sent!'
      );`
);

content = content.replace(
  "title: locale === 'am' ? 'áŠ á‹²áˆµ á‹¨áŒ‹á‹°áŠ›áŠ á‰  áŒ¥á‹«á‰„' : 'New Friend Request',",
  `title:
            locale === 'am' ? 'አዲስ የጓደኝነት ጥያቄ' :
            locale === 'om' ? 'Gaaffii Michummaa Haaraya' :
            locale === 'ar' ? 'طلب صداقة جديد' :
            locale === 'ti' ? 'ሓዱሽ ናይ ዕርክነት ሕቶ' :
            locale === 'so' ? 'Codsi Saaxiibtinimo Cusub' :
            'New Friend Request',`
);

content = content.replace(
  "body: locale === 'am'\n            ? `${profile.full_name} á‹¨áŒ‹á‹°áŠ›áŠ á‰  áŒ¥á‹«á‰„ áˆ áŠ®áˆ á‹Žá ¢` : `${profile.full_name} has sent you a friend request.`",
  `body:
            locale === 'am' ? \`\${profile.full_name} የጓደኝነት ጥያቄ ልኮልዎታል!\` :
            locale === 'om' ? \`\${profile.full_name} gaaffii michummaa isinii ergeera!\` :
            locale === 'ar' ? \`أرسل لك \${profile.full_name} طلب صداقة!\` :
            locale === 'ti' ? \`\${profile.full_name} ናይ ዕርክነት ሕቶ ልኢኹልኩም ኣሎ!\` :
            locale === 'so' ? \`\${profile.full_name} wuxuu kuu soo diray codsi saaxiibtinimo!\` :
            \`\${profile.full_name} has sent you a friend request.\``
);

// 6. Fix handleAcceptNotification alert
content = content.replace(
  "alert(locale === 'am' ? 'áŒ‹á‹°áŠ›áŠ á‰  á‰°áˆ¨áŒ‹áŒ áŒ«áˆ !' : 'Friend request accepted!');",
  `alert(
        locale === 'am' ? 'ጓደኝነት ተረጋግጧል!' :
        locale === 'om' ? 'Michummaan mirkanaa\\'eera!' :
        locale === 'ar' ? 'تم قبول طلب الصداقة!' :
        locale === 'ti' ? 'ዕርክነት ተረጋጊጹ ኣሎ!' :
        locale === 'so' ? 'Codsiga saaxiibtinimo waa la oggolaaday!' :
        'Friend request accepted!'
      );`
);

// 7. Fix logo title
content = content.replace(
  "locale === 'am' ? 'á‰¤á‰°áˆ°á‰¥' : locale === 'ar' ? 'Ø¹Ø§Ø¦Ù„Ø©' : 'BETESEB'",
  "locale === 'am' ? 'ቤተሰብ' : locale === 'ar' ? 'عائلة' : 'BETESEB'"
);

// 8. Fix sidebar navigation labels
content = content.replace(
  "label: locale === 'am' ? 'á‹¨áŒ‹á‹°áŠ›áŠ á‰  á‹°á‹µáˆ«' : 'Wedding Planner'",
  `label:
              locale === 'am' ? 'የሰርግ እቅድ' :
              locale === 'om' ? 'Karoora Gaa\\'elaa' :
              locale === 'ar' ? 'مخطط الزفاف' :
              locale === 'ti' ? 'መደብ መርዓ' :
              locale === 'so' ? 'Qorsheeyaha Arooska' :
              'Wedding Planner'`
);

content = content.replace(
  "label: locale === 'am' ? 'áŸ™á ‹á ݠ%3á œá ‹á ‹' : 'Gifts'",
  `label:
              locale === 'am' ? 'ስጦታዎች' :
              locale === 'om' ? 'Kennaawwan' :
              locale === 'ar' ? 'الهدايا' :
              locale === 'ti' ? 'ውህብቶታት' :
              locale === 'so' ? 'Hadyado' :
              'Gifts'`
);

// 9. Fix mobile navigation labels
content = content.replace(
  "label: locale === 'am' ? 'á‹¨áŒ‹á‹°áŠ›áŠ á‰  á‹°á‹µáˆ«' : 'Wedding Planner'",
  `label:
                      locale === 'am' ? 'የሰርግ እቅድ' :
                      locale === 'om' ? 'Karoora Gaa\\'elaa' :
                      locale === 'ar' ? 'مخطط الزفاف' :
                      locale === 'ti' ? 'መደብ መርዓ' :
                      locale === 'so' ? 'Qorsheeyaha Arooska' :
                      'Wedding Planner'`
);

content = content.replace(
  "label: locale === 'am' ? 'áŸ™á ‹á ݠ%3á œá ‹á ‹' : 'Gifts'",
  `label:
                      locale === 'am' ? 'ስጦታዎች' :
                      locale === 'om' ? 'Kennaawwan' :
                      locale === 'ar' ? 'الهدايا' :
                      locale === 'ti' ? 'ውህብቶታት' :
                      locale === 'so' ? 'Hadyado' :
                      'Gifts'`
);

// 10. Fix header toast translations
content = content.replace(
  "locale === 'am' ? 'የጓደኝነት ጥያቄ ልኳልዎ።' : 'sent you a friend request.'",
  "getFriendRequestText('', locale)"
);

content = content.replace(
  `              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-accent leading-snug">
                  <span className="text-primary">{activeRequestNotification.senderName}</span>{' '}
                  {locale === 'am' ? 'የጓደኝነት ጥያቄ ልኳልዎ።' : 'sent you a friend request.'}
                </p>`,
  `              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-accent leading-snug">
                  {getFriendRequestText(activeRequestNotification.senderName, locale)}
                </p>`
);

content = content.replace(
  "locale === 'am' ? 'ቀበል' : 'Accept'",
  `getAcceptLabel(locale)`
);

content = content.replace(
  "locale === 'am' ? 'አትቀበል' : 'Decline'",
  `getDeclineLabel(locale)`
);

// 11. Fix Match section title
content = content.replace(
  `            {/* Section heading */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A] flex items-center gap-2">
                <Heart size={20} className="text-primary fill-primary/20" />
                {locale === 'am' ? 'ተዛማጅ' : 'ተዛማጅ'}
              </h2>
              {profile && (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {matches.filter(m => !dislikedIds.has(m.id)).length}{' '}
                  {locale === 'am' ? 'ዕጩዎች' : 'candidates'}
                </span>
              )}
            </div>`,
  `            {/* Section heading */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A] flex items-center gap-2">
                <Heart size={20} className="text-primary fill-primary/20" />
                {t('matching.title')}
              </h2>
              {profile && (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {getCandidatesLabel(matches.filter(m => !dislikedIds.has(m.id)).length, locale)}
                </span>
              )}
            </div>`
);

// 12. Fix Premium block text in matching tab
content = content.replace(
  `              {/* Premium CTA card at absolute bottom of feed */}
              {!isPremium && (
                <div className="w-full max-w-md mx-auto bg-gradient-to-br from-primary via-orange-400 to-amber-400 rounded-[3rem] p-10 text-white text-center space-y-5 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto">
                    <Sparkles size={32} className="fill-white" />
                  </div>
                  <div className="space-y-2 relative">
                    <h3 className="text-2xl font-black italic tracking-tight">
                      {locale === 'am' ? 'ፕሪሚየም ይክፈቱ' : 'ፕሪሚየም ይክፈቱ'}
                    </h3>
                    <p className="text-white/80 text-xs font-bold max-w-xs mx-auto leading-relaxed">
                      {locale === 'am'
                        ? 'ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።'
                        : 'Unlock unlimited matches, full profile details, and priority support.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-white text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {t('premium.unlock')} →
                  </button>
                </div>
              )}`,
  `              {/* Premium CTA card at absolute bottom of feed */}
              {!isPremium && (
                <div className="w-full max-w-md mx-auto bg-gradient-to-br from-primary via-orange-400 to-amber-400 rounded-[3rem] p-10 text-white text-center space-y-5 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto">
                    <Sparkles size={32} className="fill-white" />
                  </div>
                  <div className="space-y-2 relative">
                    <h3 className="text-2xl font-black italic tracking-tight">
                      {t('premium.unlock')}
                    </h3>
                    <p className="text-white/80 text-xs font-bold max-w-xs mx-auto leading-relaxed">
                      {getPremiumSub(locale)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-white text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {t('premium.unlock')} →
                  </button>
                </div>
              )}`
);

// 13. Fix Admin Warning alert
content = content.replace(
  `                   <h3 className="font-black text-accent text-lg uppercase tracking-tight italic">
                     {locale === 'am' ? 'áŠ áˆµá‰¸áŠ³á‹­ á‹¨áŠ áˆµá‰°á‹³á‹³áˆª áˆ›áˆ³áˆ°á‰¢á‹«' : 'Urgent System Alert'}
                   </h3>`,
  `                   <h3 className="font-black text-accent text-lg uppercase tracking-tight italic">
                     {locale === 'am' ? 'አስቸኳይ የአስተዳዳሪ ማሳሰቢያ' :
                      locale === 'om' ? 'Gabaasa Hanga Biriin Bulchiinsaa' :
                      locale === 'ar' ? 'تنبيه نظام عاجل' :
                      locale === 'ti' ? 'ህጹጽ ናይ ምምሕዳር ሓበሬታ' :
                      locale === 'so' ? 'Digniin Degdeg ah oo Maamulka' :
                      'Urgent System Alert'}
                   </h3>`
);

content = content.replace(
  `                  className="btn-primary w-full py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  {locale === 'am' ? 'á‰°áˆ¨á‹µá‰»áˆˆáˆ  (Acknowledge)' : 'I Acknowledge'}
                </button>`,
  `                  className="btn-primary w-full py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  {locale === 'am' ? 'ተረድቻለሁ (Acknowledge)' :
                   locale === 'om' ? 'Hubadheera (Acknowledge)' :
                   locale === 'ar' ? 'فهمت (Acknowledge)' :
                   locale === 'ti' ? 'ተረዲኡኒ (Acknowledge)' :
                   locale === 'so' ? 'Waan fahmay (Acknowledge)' :
                   'I Acknowledge'}
                </button>`
);

// 14. Fix Coin Post Alert
content = content.replace(
  `      if (userCoins < COIN_PER_POST) {
        alert(locale === 'am' 
          ? \`áˆˆáˆ›áˆµáŒ á‰€áˆ  \${COIN_PER_POST} á‰¤á‰°áˆ°á‰¥ áŠ®á‹­áŠ• á‹«áˆµá ˆáˆ áŒ‹á‰¸á‹‹áˆ á ¢ áˆ°á‰¥áˆµáŠ­áˆªá •áˆ½áŠ• á‹ˆá‹­áˆ  áŠ®á‹­áŠ• á‹­Œá‹™á ¢\`
          : \`You need \${COIN_PER_POST} Beteseb Coins to post. Please subscribe or buy coins.\`);
        return;
      }`,
  `      if (userCoins < COIN_PER_POST) {
        alert(
          locale === 'am' ? \`ለማሳተም \${COIN_PER_POST} ቤተሰብ ኮይኖች ያስፈልጉዎታል። እባክዎ አካውንትዎን ያሳድጉ ወይም ኮይኖችን ይግዙ።\` :
          locale === 'om' ? \`Post gochuuf saantima Beteseb \${COIN_PER_POST} isin barbaachisa. Maaloo kaardii bitadhaa.\` :
          locale === 'ar' ? \`تحتاج إلى \${COIN_PER_POST} من عملات بيتيسيب للنشر. يرجى الاشتراك أو شراء عملات معدنية.\` :
          locale === 'ti' ? \`ክትሕትም \${COIN_PER_POST} ቤተሰብ ኮይናት የድልዩኻ። በጃኻ አካውንትካ ኣዕቢ ወይ ኮይናት ዓድግ።\` :
          locale === 'so' ? \`Waxaad u baahan tahay \${COIN_PER_POST} Beteseb Coins si aad u post-gureyso. Fadlan is-qor ama iibso coins.\` :
          \`You need \${COIN_PER_POST} Beteseb Coins to post. Please subscribe or buy coins.\`
        );
        return;
      }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully fixed all character encodings and added 6-language translations!");
