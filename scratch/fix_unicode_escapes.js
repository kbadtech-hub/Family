const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements using exact Unicode escape sequences
const replacements = [
  // 1. Language selector Tigrinya label
  {
    bad: "\u00e1\u2030\u00b5\u00e1\u0152\u008d\u00e1\u02c6\u00ad\u00e1\u0160\u203a",
    good: "ትግርኛ"
  },
  // 2. getTierName Platinum Tier
  {
    bad: "\u00e1\u008d\u2022\u00e1\u02c6\u2039\u00e1\u2030\u00b2\u00e1\u0160\u2019\u00e1\u2039\u00a8\u00e1\u02c6\u009d (Platinum Tier)",
    good: "ፕላቲኒየም (Platinum Tier)"
  },
  // 3. getTierName Gold Tier
  {
    bad: "\u00e1\u0152\u017d\u00e1\u02c6\u008d\u00e1\u2039\u00b0\u00e1\u0160\u2022 (Gold Tier)",
    good: "ጎልደን (Gold Tier)"
  },
  // 4. getTierName Bronze Tier
  {
    bad: "\u00e1\u2039\u00ab\u00e1\u02c6\u008d\u00e1\u2030\u00b0\u00e1\u02c6\u00a8\u00e1\u0152\u2039\u00e1\u0152\u02c6\u00e1\u0152\u00a0 (Bronze Tier)",
    good: "ያልተረጋገጠ (Bronze Tier)"
  },
  // 5. handleLike match alert
  {
    bad: "\u00e1\u2030\u00b0\u00e1\u2039\u203a\u00e1\u02c6\u009d\u00e1\u2039\u00b0\u00e1\u2039\u2039\u00e1\u02c6\u008d\u0021\u0020\u00e1\u0160\u00a0\u00e1\u02c6\u0081\u00e1\u0160\u2022\u0020\u00e1\u02c6\u02dc\u00e1\u0160\u0090\u00e1\u0152\u2039\u00e1\u0152\u02c6\u00e1\u02c6\u00ad\u0020\u00e1\u2039\u00ad\u00e1\u2030\u00bd\u00e1\u02c6\u2039\u00e1\u02c6\u2030\u00e1\u008d\u00a2",
    good: "ተዛምደዋል! አሁን መነጋገር ይችላሉ።"
  },
  // 6. handleLike profile liked alert
  {
    bad: "\u00e1\u02c6\u2039\u00e1\u2039\u00ad\u00e1\u0160\u00ad\u0020\u00e1\u2030\u00b0\u00e1\u2039\u00b0\u00e1\u02c6\u00ad\u00e1\u0152\u201c\u00e1\u02c6\u008d\u0021",
    good: "ላይክ ተደርጓል!"
  },
  // 7. handleLike push body
  {
    bad: "\u00e1\u02c6\u2039\u00e1\u2039\u00ad\u00e1\u0160\u00ad\u0020\u00e1\u0160\u00a0\u00e1\u02c6\u0081\u00e1\u0160\u2022\u0020\u00e1\u2039\u00ad\u00e1\u2030\u00bd\u00e1\u02c6\u2039\u00e1\u2030\u00bd\u00e1\u008d\u00a2",
    good: "ላይክ አድርጎዎታል!"
  },
  // 8. handleSendFriendRequest sent alert
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e\u0020\u00e1\u2030\u00b0\u00e1\u02c6\u008d\u00e1\u0160\u00b3\u00e1\u02c6\u008d\u0021",
    good: "የጓደኝነት ጥያቄ ተልኳል!"
  },
  // 9. handleSendFriendRequest title
  {
    bad: "\u00e1\u0160\u00a0\u00e1\u2039\u00b2\u00e1\u02c6\u00b5\u0020\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e",
    good: "አዲስ የጓደኝነት ጥያቄ"
  },
  // 10. handleSendFriendRequest body
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e\u0020\u00e1\u02c6\u008d\u00e1\u0160\u00b3\u00e1\u02c6\u008d\u00e1\u2039\u017d\u00e1\u008d\u00a2",
    good: "የጓደኝነት ጥያቄ ልኮልዎታል።"
  },
  // 11. handleAcceptNotification accepted alert
  {
    bad: "\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u2030\u00b0\u00e1\u02c6\u00a8\u00e1\u0152\u2039\u00e1\u0152\u008d\u00e1\u0152\u00a7\u00e1\u02c6\u008d\u0021",
    good: "ጓደኝነት ተረጋግጧል!"
  },
  // 12. activeRequestNotification text
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e\u0020\u00e1\u0160\u00b3\u00e1\u02c6\u008d\u00e1\u2039\u017d\u00e1\u008d\u00a2",
    good: "የጓደኝነት ጥያቄ ልኮልዎታል።"
  },
  // 13. activeRequestNotification Decline button label
  {
    bad: "\u00e1\u0160\u00a0\u00e1\u2030\u00b5\u1270\u1240\u1260\u120d\u008d",
    good: "አትቀበል"
  },
  // 14. activeRequestNotification Accept button label
  {
    bad: "\u00e1\u2030\u00b5\u1270\u1240\u1260\u120d\u008d",
    good: "ተቀበል"
  },
  // 15. Dashboard matches feed header (double checks)
  {
    bad: "á‰°á‹›áˆ›áŒ…",
    good: "ተዛማጅ"
  },
  // 16. Dashboard candidates text
  {
    bad: "á‹•áŒ©á‹Žá‰½",
    good: "ዕጩዎች"
  },
  // 17. Premium Unlock card title
  {
    bad: "á •áˆªáˆšá‹¨áˆ  á‹­áŠ­á ˆá‰±",
    good: "ፕሪሚየም ይክፈቱ"
  },
  // 18. Premium Unlock card sub text
  {
    bad: "á‹«áˆ á‰°áŒˆá‹°á‰  áŒ áŒ¥áˆšá‹«á‹Žá‰½áŠ•á £ áˆ™áˆ‰ á‹¨á •áˆ®á ‹á‹­áˆ  á‹ áˆ­á‹ áˆ®á‰½áŠ• áŠ¥áŠ“ á‰…á‹µáˆšá‹« á‹¨áˆšáˆ°áŒ á‹ áŠ• á‹µáŒ‹á   á‹«áŒ áŠ™á ¢",
    good: "ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።"
  },
  // 19. Admin Warning title
  {
    bad: "áŠ áˆµá‰¸áŠ³á‹­ á‹¨áŠ áˆµá‰°á‹³á‹³áˆª áˆ›áˆ³áˆ°á‰¢á‹«",
    good: "አስቸኳይ የአስተዳዳሪ ማሳሰቢያ"
  },
  // 20. Admin Warning acknowledge button
  {
    bad: "\u00e1\u2030\u00b0\u00e1\u02c6\u00a8\u00e1\u2039\u00b5\u00e1\u2030\u00bb\u00e1\u02c6\u02c6\u00e1\u02c6\u0081\u0020\u0028\\u0041\\u0063\\u006b\\u006e\\u006f\\u0077\\u006c\\u0065\\u0064\\u0067\\u0065\\u0029",
    good: "ተረድቻለሁ (Acknowledge)"
  },
  {
    bad: "á‰°áˆ¨á‹µá‰»áˆˆáˆ  (Acknowledge)",
    good: "ተረድቻለሁ (Acknowledge)"
  },
  // 21. Coin Post confirmation
  {
    bad: "áˆˆáˆ›áˆµáŒ á‰€áˆ  ${COIN_PER_POST} á‰¤á‰°áˆ°á‰¥ áŠ®á‹­áŠ• á‹«áˆµá ˆáˆ áŒ‹á‰¸á‹‹áˆ á ¢ áˆ°á‰¥áˆµáŠ­áˆªá •áˆ½áŠ• á‹ˆá‹­áˆ  áŠ®á‹­áŠ• á‹­áŒ á‹™á ¢",
    good: "ለማሳተም 20 ቤተሰብ ኮይኖች ያስፈልጉዎታል። እባክዎ አካውንትዎን ያሳድጉ ወይም ኮይኖችን ይግዙ።"
  },
  // 22. Sidebar / mobile menu labels
  {
    bad: "á‹¨áˆ°áˆ­áŒ  áŠ¥á‰…á‹µ",
    good: "የሰርግ እቅድ"
  },
  {
    bad: "áˆµáŒ¦á‰³á‹Žá‰½",
    good: "ስጦታዎች"
  }
];

let replacedCount = 0;
for (const replacement of replacements) {
  const badStr = replacement.bad;
  const regex = new RegExp(badStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const count = (content.match(regex) || []).length;
  if (count > 0) {
    content = content.replace(regex, replacement.good);
    console.log(`Replaced Unicode: "${badStr}" -> "${replacement.good}" (${count} times)`);
    replacedCount += count;
  }
}

// 23. Double check for the header next to 1 CANDIDATES
content = content.replace(
  /\{locale === 'am' \? 'á‰°á‹›áˆ›áŒ…' : 'á‰°á‹›áˆ›áŒ…'\}/g,
  "{t('matching.title')}"
);

// 24. Clean up any occurrences of Â in buttons
content = content.replace(/UNLOCK PREMIUM Â†’/g, "UNLOCK PREMIUM →");
content = content.replace(/UNLOCK PREMIUM Â\u2020\u2019/g, "UNLOCK PREMIUM →");

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Unicode repair finished. Total replacements: ${replacedCount}`);
