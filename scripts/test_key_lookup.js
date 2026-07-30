const fs = require('fs');

const am = JSON.parse(fs.readFileSync('messages/am.json', 'utf8'));

function getTranslation(pathStr, obj) {
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return null;
    }
  }
  return curr;
}

console.log('Lookup RelationshipGoals.Life Partner / Marriage:', getTranslation('Constants.RelationshipGoals.Life Partner / Marriage', am));
console.log('Direct lookup am.Constants.RelationshipGoals["Life Partner / Marriage"]:', am.Constants.RelationshipGoals["Life Partner / Marriage"]);
