const fs = require('fs');
const path = require('path');

function searchInDir(dir, filterKeywords) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchInDir(filePath, filterKeywords);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.java') || file.endsWith('.xml') || file.endsWith('.json'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      filterKeywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(`Match found for "${keyword}" in file: ${filePath}`);
        }
      });
    }
  });
}

console.log('--- Searching for Crown and Royal Frame references ---');
searchInDir('c:/Users/KB/Desktop/Beteseb/Family/src', ['crown', 'king', 'queen', 'royal']);

console.log('\n--- Searching for FLAG_SECURE references ---');
searchInDir('c:/Users/KB/Desktop/Beteseb/Family', ['flag_secure', 'secure']);
