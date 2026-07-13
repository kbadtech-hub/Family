const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace matches header
content = content.replace(
  /\{locale === 'am' \? 'ተዛማጅ' : 'ተዛማጅ'\}/g,
  "{t('matching.title')}"
);

// 2. Replace candidates label count block
const oldCandidatesBlock = `{matches.filter(m => !dislikedIds.has(m.id)).length}{' '}\r\n                  {locale === 'am' ? 'ዕጩዎች' : 'candidates'}`;
const oldCandidatesBlockLF = `{matches.filter(m => !dislikedIds.has(m.id)).length}{' '}\n                  {locale === 'am' ? 'ዕጩዎች' : 'candidates'}`;

if (content.includes(oldCandidatesBlock)) {
  content = content.replace(oldCandidatesBlock, `{getCandidatesLabel(matches.filter(m => !dislikedIds.has(m.id)).length, locale)}`);
  console.log("Replaced candidates block (CRLF)");
} else if (content.includes(oldCandidatesBlockLF)) {
  content = content.replace(oldCandidatesBlockLF, `{getCandidatesLabel(matches.filter(m => !dislikedIds.has(m.id)).length, locale)}`);
  console.log("Replaced candidates block (LF)");
} else {
  // Regex fallback
  content = content.replace(
    /\{matches\.filter\(m => !dislikedIds\.has\(m\.id\)\)\.length\}\{' '\}\s*\{locale === 'am' \? 'ዕጩዎች' : 'candidates'\}/g,
    "{getCandidatesLabel(matches.filter(m => !dislikedIds.has(m.id)).length, locale)}"
  );
  console.log("Replaced candidates block (Regex)");
}

// 3. Replace Premium card h3 title
content = content.replace(
  /\{locale === 'am' \? 'ፕሪሚየም ይክፈቱ' : 'ፕሪሚየም ይክፈቱ'\}/g,
  "{t('premium.unlock')}"
);

// 4. Replace Premium card description paragraph
const oldDescBlock = `<p className="text-white\/80 text-xs font-bold max-w-xs mx-auto leading-relaxed">\\s*\\{locale === 'am'\\s*\\?\\s*'ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።'\\s*:\\s*'Unlock unlimited matches, full profile details, and priority support.'\\s*\\}\\s*<\/p>`;
content = content.replace(
  new RegExp(oldDescBlock, 'g'),
  `<p className="text-white/80 text-xs font-bold max-w-xs mx-auto leading-relaxed">\n                      {getPremiumSub(locale)}\n                    </p>`
);

// 5. Replace arrow Mojibake
content = content.replace(/\{t\('premium\.unlock'\)\} â†’/g, "{t('premium.unlock')} →");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Final cleanups applied successfully.");
