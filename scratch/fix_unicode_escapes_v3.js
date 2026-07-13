const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replacements using exact Unicode character code sequences
const replacements = [
  // 1. Post Coins Warning
  {
    bad: "\u00e1\u02c6\u02c6\u00e1\u02c6\u203a\u00e1\u02c6\u00b5\u00e1\u0152\u00a0\u00e1\u2030\u20ac\u00e1\u02c6\u009d",
    good: "ለማሳተም"
  },
  {
    bad: "\u00e1\u0160\u00ae\u00e1\u2039\u00ad\u00e1\u0160\u2022\u0020\u00e1\u2039\u00ab\u00e1\u02c6\u00b5\u00e1\u008d\u02c6\u00e1\u02c6\u008d\u00e1\u0152\u2039\u00e1\u2030\u00b8\u00e1\u2039\u2039\u00e1\u02c6\u008d\u00e1\u008d\u00a2\u0020\u00e1\u02c6\u00b0\u00e1\u2030\u00a5\u00e1\u02c6\u00b5\u00e1\u0160\u00ad\u00e1\u02c6\u00aa\u00e1\u008d\u2022\u00e1\u02c6\u00bd\u00e1\u0160\u2022\u0020\u00e1\u2039\u02c6\u00e1\u2039\u00ad\u00e1\u02c6\u009d\u0020\u00e1\u0160\u00ae\u00e1\u2039\u00ad\u00e1\u0160\u2022\u0020\u00e1\u2039\u00ad\u00e1\u0152\u008d\u00e1\u2039\u2122\u00e1\u008d\u00a2",
    good: "ኮይኖች ያስፈልጉዎታል። እባክዎ አካውንትዎን ያሳድጉ ወይም ኮይኖችን ይግዙ።"
  },
  // 2. Friend request sent alert (line 873)
  {
    bad: "\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e\u0020\u00e1\u2030\u00b0\u00e1\u02c6\u008d\u00e1\u0160\u00b3\u00e1\u02c6\u008d\u0021",
    good: "የጓደኝነት ጥያቄ ተልኳል!"
  },
  // 3. Friend request send title (line 881)
  {
    bad: "\u00e1\u0160\u00a0\u00e1\u2039\u00b2\u00e1\u02c6\u00b5\u0020\u00e1\u2039\u00a8\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u0152\u00a5\u00e1\u2039\u00ab\u00e1\u2030\u201e",
    good: "አዲስ የጓደኝነት ጥያቄ"
  },
  // 4. Friend request accepted alert (line 922)
  {
    bad: "\u00e1\u0152\u201c\u00e1\u2039\u00b0\u00e1\u0160\u009d\u00e1\u0160\u009d\u00e1\u2030\u00b5\u0020\u00e1\u2030\u00b0\u00e1\u02c6\u00a8\u00e1\u0152\u2039\u00e1\u0152\u008d\u00e1\u0152\u00a7\u00e1\u02c6\u008d\u0021",
    good: "ጓደኝነት ተረጋግጧል!"
  },
  // 5. Admin warning button label (line 1377)
  {
    bad: "\u00e1\u2030\u00b0\u00e1\u02c6\u00a8\u00e1\u2039\u00b5\u00e1\u2030\u00bb\u00e1\u02c6\u02c6\u00e1\u02c6\u0081\u0020\u0028\u0041\u0063\u006b\u006e\u006f\u0077\u006c\u0065\u0064\u0067\u0065\u0029",
    good: "ተረድቻለሁ (Acknowledge)"
  }
];

let replacedCount = 0;
for (const replacement of replacements) {
  const badStr = replacement.bad;
  // Use simple String.prototype.replaceAll to avoid regex character escape bugs
  const before = content;
  content = content.split(badStr).join(replacement.good);
  const count = (before.length - content.length) / (badStr.length - replacement.good.length);
  if (count > 0) {
    console.log(`Replaced: "${badStr.substring(0, 20)}..." -> "${replacement.good}" (${count} times)`);
    replacedCount += count;
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`v3 Unicode repair finished. Total replacements: ${replacedCount}`);
