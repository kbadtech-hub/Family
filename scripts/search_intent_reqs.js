const fs = require('fs');
const path = require('path');

let out = [];

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') searchDir(fullPath);
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('partner_intent') || content.includes('RelationshipGoals') || content.includes('PARTNER_RELATIONSHIP_GOAL_OPTIONS') || content.includes('spouse_requirements')) {
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('partner_intent') || l.includes('RelationshipGoals') || l.includes('PARTNER_RELATIONSHIP_GOAL_OPTIONS') || l.includes('spouse_requirements')) {
            out.push(`${fullPath}:L${i+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('src');
fs.writeFileSync('scripts/intent_and_reqs_search.txt', out.join('\n'));
console.log('DONE');
