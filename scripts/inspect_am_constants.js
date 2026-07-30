const fs = require('fs');

const am = JSON.parse(fs.readFileSync('messages/am.json', 'utf8'));

console.log('--- am.json Constants keys ---');
console.log(Object.keys(am.Constants || {}));

console.log('--- am.json Constants.RelationshipGoals ---');
console.log(am.Constants?.RelationshipGoals);

console.log('--- am.json Constants.Requirements ---');
console.log(am.Constants?.Requirements);

console.log('--- am.json Constants.CriteriaCategories ---');
console.log(am.Constants?.CriteriaCategories);
