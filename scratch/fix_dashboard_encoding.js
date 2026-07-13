const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// List of exact string replacements
const replacements = [
  // Languages dropdown labels
  { bad: "label: 'áŠ áˆ›áˆ­áŠ›'", good: "label: 'አማርኛ'" },
  { bad: "label: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©'", good: "label: 'العربية'" },
  { bad: "label: 'á‰µáŒ áˆ­áŠ›'", good: "label: 'ትግርኛ'" },

  // Emojis / Mojibake icons
  { bad: "ðŸ’Ž", good: "💎" },
  { bad: "ðŸŒŸ", good: "🌟" },
  { bad: "ðŸ¥‡", good: "🥇" },
  { bad: "ðŸ¥ˆ", good: "🥈" },
  { bad: "ðŸ¥‰", good: "🥉" },
  { bad: "ðŸ‘‘", good: "👑" },

  // getTierName translations
  { bad: "á‹³á‹­áˆ˜áŠ•á‹µ (Diamond Tier)", good: "ዳይመንድ (Diamond Tier)" },
  { bad: "á •áˆ‹á‰²áŠ’á‹¨áˆ  (Platinum Tier)", good: "ፕላቲኒየም (Platinum Tier)" },
  { bad: "á •áˆ‹á‰²áŠ’á‹¨ˆ  (Platinum Tier)", good: "ፕላቲኒየም (Platinum Tier)" },
  { bad: "áŒŽáˆ á‹°áŠ• (Gold Tier)", good: "ጎልደን (Gold Tier)" },
  { bad: "á‰¤á‹šáŠ­ áˆ›áˆ¨áŒ‹áŒˆáŒ« (Silver Tier)", good: "ቤዚክ ማረጋገጫ (Silver Tier)" },
  { bad: "á‹«áˆ á‰°áˆ¨áŒ‹áŒ  (Bronze Tier)", good: "ያልተረጋገጠ (Bronze Tier)" },

  // Alerts, dialogs and notifications
  { bad: "á‰°á‹›áˆ á‹°á‹‹áˆ ! áŠ áˆ áŠ• áˆ˜áŠ áŒ‹áŒˆáˆ­ á‹­á‰½áˆ‹áˆ‰á ¢", good: "ተዛምደዋል! አሁን መነጋገር ይችላሉ።" },
  { bad: "áˆ‹á‹­áŠ­ á‰°á‹°áˆ­áŒ“áˆ !", good: "ላይክ ተደርጓል!" },
  { bad: "áŠ á‹²áˆµ áˆ‹á‹­áŠ­", good: "አዲስ ላይክ" },
  { bad: "áˆ‹á‹­áŠ­ áŠ á‹µáˆ­áŒŽá‹Žá‰³áˆ !", good: "ላይክ አድርጎዎታል!" },
  { bad: "á‹¨áŒ“á‹°áŠ áŠ á‰µ áŒ¥á‹«á‰„ á‰°áˆ áŠ³áˆ !", good: "የጓደኝነት ጥያቄ ተልኳል!" },
  { bad: "áŠ á‹²áˆµ á‹¨áŒ“á‹°áŠ áŠ á‰µ áŒ¥á‹«á‰„", good: "አዲስ የጓደኝነት ጥያቄ" },
  { bad: "á‹¨áŒ“á‹°áŠ áŠ á‰µ áŒ¥á‹«á‰„ áˆ áŠ®áˆ á‹Žá‰³áˆ !", good: "የጓደኝነት ጥያቄ ልኮልዎታል።" },
  { bad: "áŒ“á‹°áŠ áŠ á‰µ á‰°áˆ¨áŒ‹áŒ áŒ§áˆ !", good: "ጓደኝነት ተረጋግጧል!" },
  { bad: "á‰¤á‰°áˆ°á‰¥", good: "ቤተሰብ" },
  { bad: "Ø¨ÙŠØªØ³Ø¨", good: "بيتسب" },

  // Sidebar labels
  { bad: "á‹¨áˆ°áˆ­áŒ  áŠ¥á‰…á‹µ", good: "የሰርግ እቅድ" },
  { bad: "áˆµáŒ¦á‰³á‹Žá‰½", good: "ስጦታዎች" },

  // Header notifications & options
  { bad: "á‹¨áŒ“á‹°áŠ áŠ á‰µ áŒ¥á‹«á‰„ áˆ áŠ³áˆ á‹Ž ¢", good: "የጓደኝነት ጥያቄ ልኮልዎታል።" },
  { bad: "á‰€á‰ áˆ", good: "ተቀበል" },
  { bad: "áŠ á‰µá‰€á‰ áˆ", good: "አትቀበል" },

  // Dashboard section titles & count
  { bad: "á‰°á‹›áˆ›áŒ…", good: "ተዛማጅ" },
  { bad: "á‹•áŒ©á‹Žá‰½", good: "ዕጩዎች" },

  // Premium paywall
  { bad: "á •áˆªáˆšá‹¨áˆ  á‹­áŠ­á ˆá‰±", good: "ፕሪሚየም ይክፈቱ" },
  { bad: "á‹«áˆ á‰°áŒˆá‹°á‰  áŒ áŒ¥áˆšá‹«á‹Žá‰½áŠ•á £ áˆ™áˆ‰ á‹¨á •áˆ®á ‹á‹­áˆ  á‹ áˆ­á‹ áˆ®á‰½áŠ• áŠ¥áŠ“ á‰…á‹µáˆšá‹« á‹¨áˆšáˆ°áŒ á‹ áŠ• á‹µáŒ‹á   á‹«áŒ áŠ™á ¢", good: "ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።" },

  // Admin Warnings
  { bad: "áŠ áˆµá‰¸áŠ³á‹­ á‹¨áŠ áˆµá‰°á‹³á‹³áˆª áˆ›áˆ³áˆ°á‰¢á‹«", good: "አስቸኳይ የአስተዳዳሪ ማሳሰቢያ" },
  { bad: "á‰°áˆ¨á‹µá‰»áˆˆáˆ  (Acknowledge)", good: "ተረድቻለሁ (Acknowledge)" },
  
  // Coin Post alert
  { bad: "áˆˆáˆ›áˆµáŒ á‰€áˆ ", good: "ለማሳተም " },
  { bad: "áŠ®á‹­áŠ• á‹«áˆµá ˆáˆ áŒ‹á‰¸á‹‹áˆ á ¢ áˆ°á‰¥áˆµáŠ­áˆªá •áˆ½áŠ• á‹ˆá‹­áˆ  áŠ®á‹­áŠ• á‹­áŒ á‹™á ¢", good: "ኮይኖች ያስፈልጉዎታል። እባክዎ አካውንትዎን ያሳድጉ ወይም ኮይኖችን ይግዙ።" }
];

let replacedCount = 0;
for (const replacement of replacements) {
  // Use global regex to replace all occurrences in the file
  const regex = new RegExp(replacement.bad.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const count = (content.match(regex) || []).length;
  if (count > 0) {
    content = content.replace(regex, replacement.good);
    console.log(`Replaced "${replacement.bad}" -> "${replacement.good}" (${count} times)`);
    replacedCount += count;
  }
}

// Write the fixed file back
fs.writeFileSync(filePath, content, 'utf8');
console.log(`Encoding repair finished. Total replacements: ${replacedCount}`);
