const fs = require('fs');
const lines = fs.readFileSync('src/app/[locale]/secure-beteseb-admin/page.tsx', 'utf8').split('\n');
console.log(lines.slice(898, 912).join('\n'));
