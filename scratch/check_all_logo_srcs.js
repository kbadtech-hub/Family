const fs = require('fs');
const path = require('path');

function inspectFiles(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!item.includes('node_modules') && !item.includes('.next')) {
        inspectFiles(full);
      }
    } else if (/\.(tsx?|jsx?)$/.test(item)) {
      const text = fs.readFileSync(full, 'utf8');
      const matches = text.match(/src=["']([^"']*(?:logo|icon|splash)[^"']*)["']/gi);
      if (matches) {
        console.log(`${full}:`, matches);
      }
    }
  }
}

inspectFiles('c:/Users/KB/Desktop/Beteseb/Family/src');
