const fs = require('fs');

function inspectAuth(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    console.log(`\n--- Auth inspection in ${filePath} ---`);
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('google') || line.toLowerCase().includes('apple') || line.toLowerCase().includes('facebook')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`${filePath} does not exist`);
  }
}

inspectAuth('c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/login/page.tsx');
inspectAuth('c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/signup/page.tsx');
