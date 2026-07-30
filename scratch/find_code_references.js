const fs = require('fs');
const path = require('path');

function searchDir(dir, terms) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('out')) {
        searchDir(fullPath, terms);
      }
    } else if (/\.(tsx?|jsx?|json|html|css)$/i.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      terms.forEach(term => {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          console.log(`Found "${term}" in ${fullPath}`);
        }
      });
    }
  }
}

searchDir('c:/Users/KB/Desktop/Beteseb/Family/src', ['logo', 'favicon', 'icon-192', 'icon-512']);
searchDir('c:/Users/KB/Desktop/Beteseb/Family/public', ['logo', 'icon']);
