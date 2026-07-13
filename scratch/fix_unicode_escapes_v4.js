const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// List of whole-line pattern replacements using regular expressions
const regexReplacements = [
  // 1. Friend request sent alert
  {
    pattern: /alert\(locale === 'am' \? '[^']+' : 'Friend request sent!'\);/g,
    replacement: "alert(locale === 'am' ? 'የጓደኝነት ጥያቄ ተልኳል!' : 'Friend request sent!');"
  },
  // 2. Friend request title
  {
    pattern: /title: locale === 'am' \? '[^']+' : 'New Friend Request',/g,
    replacement: "title: locale === 'am' ? 'አዲስ የጓደኝነት ጥያቄ' : 'New Friend Request',"
  },
  // 3. Friend request accepted alert
  {
    pattern: /alert\(locale === 'am' \? '[^']+' : 'Friend request accepted!'\);/g,
    replacement: "alert(locale === 'am' ? 'ጓደኝነት ተረጋግጧል!' : 'Friend request accepted!');"
  },
  // 4. Realtime request notification label (Amharic translation)
  {
    pattern: /\{locale === 'am' \? '[^']+' : 'sent you a friend request\.'\}/g,
    replacement: "{locale === 'am' ? 'የጓደኝነት ጥያቄ ልኮልዎታል።' : 'sent you a friend request.'}"
  },
  // 5. Premium Card Title
  {
    pattern: /\{locale === 'am' \? 'á •áˆªáˆšá‹¨áˆ  á‹­áŠ­á ˆá‰±' : 'á •áˆªáˆšá‹¨áˆ  á‹­áŠ­á ˆá‰±'\}/g,
    replacement: "{locale === 'am' ? 'ፕሪሚየም ይክፈቱ' : 'UNLOCK PREMIUM'}"
  },
  // 6. Premium Card Subtitle description
  {
    pattern: /\? 'á‹«áˆ á‰°áŒˆá‹°á‰  áŒ áŒ¥áˆšá‹«á‹Žá‰½áŠ•á £ áˆ™áˆ‰ á‹¨á •áˆ®á ‹á‹­áˆ  á‹ áˆ­á‹ áˆ®á‰½áŠ• áŠ¥áŠ“ á‰…á‹µáˆšá‹« á‹¨áˆšáˆ°áŒ á‹ áŠ• á‹µáŒ‹á   á‹«áŒ áŠ™á ¢'/g,
    replacement: "? 'ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ。'"
  }
];

let replacedCount = 0;
for (const rep of regexReplacements) {
  const before = content;
  content = content.replace(rep.pattern, rep.replacement);
  if (before !== content) {
    console.log(`Successfully replaced pattern: ${rep.pattern}`);
    replacedCount++;
  } else {
    console.log(`Pattern not matched: ${rep.pattern}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`v4 whole-line repair finished. Total patterns matched: ${replacedCount}`);
