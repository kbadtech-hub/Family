const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // 1. Post Coins Warning:
  {
    bad: "áˆˆáˆ›áˆµáŒ á‰€áˆ  ${COIN_PER_POST} ቤተሰብ áŠ®á‹­áŠ• á‹«áˆµá ˆáˆ áŒ‹á‰¸á‹‹áˆ á ¢ áˆ°á‰¥áˆµáŠ­áˆªá •áˆ½áŠ• á‹ˆá‹­áˆ  áŠ®á‹­áŠ• á‹­áŒ á‹™á ¢",
    good: "ለማሳተም ${COIN_PER_POST} ቤተሰብ ኮይኖች ያስፈልጉዎታል። እባክዎ አካውንትዎን ያሳድጉ ወይም ኮይኖችን ይግዙ።"
  },
  // 2. Profile Liked Push body:
  {
    bad: "\u00e1\u02c6\u2039\u00e1\u2039\u00ad\u00e1\u0160\u00ad\u0020\u00e1\u0160\u00a0\u00e1\u2039\u00b5\u00e1\u02c6\u00ad\u00e1\u0152\u017d\u00e1\u2039\u017d\u00e1\u2030\u00b3\u00e1\u02c6\u008d\u0021",
    good: "ላይክ አድርጎዎታል!"
  },
  // 3. Friend Request Send Notification Title:
  {
    bad: "áŠ á‹²áˆµ á‹¨áŒ“á‹°áŠ áŠ á‰µ áŒ¥á‹«á‰„",
    good: "አዲስ የጓደኝነት ጥያቄ"
  },
  // 4. Friend Request Notification Send alert:
  {
    bad: "á‹¨áŒ“á‹°áŠ áŠ á‰µ áŒ¥á‹«á‰„ á‰°áˆ áŠ³áˆ !",
    good: "የጓደኝነት ጥያቄ ተልኳል!"
  },
  // 5. Friend Request Notification Send Push body:
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u0090\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e\u0020\u00e1\u02c6\u008d\u00e1\u0160\u00ae\u00e1\u02c6\u008d\u00e1\u2039\u017d\u00e1\u2030\u00b3\u00e1\u02c6\u008d\u0021",
    good: "የጓደኝነት ጥያቄ ልኮልዎታል።"
  },
  // 6. Friend Request Accept notification alert:
  {
    bad: "áŒ“á‹°áŠ áŠ á‰µ á‰°áˆ¨áŒ‹áŒ áŒ§áˆ !",
    good: "ጓደኝነት ተረጋግጧል!"
  },
  // 7. Wedding Planner Sidebar / Mobile Menu labels:
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u02c6\u00b0\u00e1\u02c6\u00ad\u00e1\u0152\u008d\u0020\u00e1\u0160\u00a5\u00e1\u2030\u2026\u00e1\u2039\u00b5",
    good: "የሰርግ እቅድ"
  },
  // 8. Realtime request notification label (Amharic translation):
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u0090\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e\u0020\u00e1\u02c6\u008d\u00e1\u0160\u00b3\u00e1\u02c6\u008d\u00e1\u2039\u017d\u00e1\u008d\u00a2",
    good: "የጓደኝነት ጥያቄ ልኮልዎታል።"
  },
  // 9. Premium Card Title:
  {
    bad: "\u00e1\u008d\u2022\u00e1\u02c6\u00aa\u00e1\u02c6\u0161\u00e1\u2039\u00a8\u00e1\u02c6\u009d\u0020\u00e1\u2039\u00ad\u00e1\u0160\u00ad\u00e1\u008d\u02c6\u00e1\u2030\u00b1",
    good: "ፕሪሚየም ይክፈቱ"
  },
  // 10. Premium Card Subtitle description:
  {
    bad: "\u00e1\u2039\u00ab\u00e1\u02c6\u008d\u00e1\u2030\u00b0\u00e1\u0152\u02c6\u00e1\u2039\u00b0\u00e1\u2030\u00a0\u0020\u00e1\u0152\u008d\u00e1\u0152\u00a5\u00e1\u02c6\u0161\u00e1\u2039\u00ab\u00e1\u2039\u017d\u00e1\u2030\u00bd\u00e1\u0160\u2022\u00e1\u008d\u00a3\u0020\u00e1\u02c6\u2122\u00e1\u02c6\u2030\u0020\u00e1\u2039\u00a8\u00e1\u008d\u2022\u00e1\u02c6\u00ae\u00e1\u008d\u2039\u00e1\u2039\u00ad\u00e1\u02c6\u008d\u0020\u00e1\u2039\u009d\u00e1\u02c6\u00ad\u00e1\u2039\u009d\u00e1\u02c6\u00ae\u00e1\u2030\u00bd\u00e1\u0160\u2022\u0020\u00e1\u0160\u00a5\u00e1\u0160\u201c\u0020\u00e1\u2030\u2026\u00e1\u2039\u00b5\u00e1\u02c6\u0161\u00e1\u2039\u00ab\u0020\u00e1\u2039\u00a8\u00e1\u02c6\u0161\u00e1\u02c6\u00b0\u00e1\u0152\u00a0\u00e1\u2039\u008d\u00e1\u0160\u2022\u0020\u00e1\u2039\u00b5\u00e1\u0152\u2039\u00e1\u008d\u008d\u0020\u00e1\u2039\u00ab\u00e1\u0152\u008d\u00e1\u0160\u2122\u00e1\u008d\u00a2",
    good: "ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።"
  },
  // 11. Admin Warning button text:
  {
    bad: "\u00e1\u2030\u00b0\u00e1\u02c6\u00a8\u00e1\u2039\u00b5\u00e1\u2030\u00bb\u00e1\u02c6\u02c6\u00e1\u02c6\u0081\u0020\u0028\\u0041\\u0063\\u006b\\u006e\\u006f\\u0077\\u006c\\u0065\\u0064\\u0067\\u0065\\u0029",
    good: "ተረድቻለሁ (Acknowledge)"
  }
];

let replacedCount = 0;
for (const replacement of replacements) {
  const badStr = replacement.bad;
  const regex = new RegExp(badStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const count = (content.match(regex) || []).length;
  if (count > 0) {
    content = content.replace(regex, replacement.good);
    console.log(`Replaced: "${badStr.substring(0, 30)}..." -> "${replacement.good.substring(0, 30)}..." (${count} times)`);
    replacedCount += count;
  }
}

// Save back
fs.writeFileSync(filePath, content, 'utf8');
console.log(`v2 Unicode repair finished. Total replacements: ${replacedCount}`);
