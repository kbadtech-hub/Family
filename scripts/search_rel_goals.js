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
      if (content.includes('RelationshipGoals') || content.includes('partner_intent') || content.includes('partnerRelationshipGoal')) {
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('RelationshipGoals') || l.includes('partner_intent') || l.includes('partnerRelationshipGoal')) {
            out.push(`${fullPath}:L${i+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('src');
fs.writeFileSync('scripts/rel_goals_search.txt', out.join('\n'));
console.log('DONE');
