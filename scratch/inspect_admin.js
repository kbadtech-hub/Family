const fs = require('fs');
const content = fs.readFileSync('c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/secure-beteseb-admin/page.tsx', 'utf8');
const lines = content.split('\n');

const keywords = ['verification', 'payment', 'gift', 'user', 'moderation', 'ticket', 'counseling', 'reset'];
keywords.forEach(keyword => {
  console.log(`\n--- Matches for: ${keyword} ---`);
  let count = 0;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      count++;
      if (count < 8) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    }
  });
  console.log(`Total occurrences of "${keyword}": ${count}`);
});
