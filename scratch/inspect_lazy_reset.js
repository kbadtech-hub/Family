const fs = require('fs');

function inspectFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    console.log(`\n--- Inspecting ${filePath} ---`);
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('limit') || line.toLowerCase().includes('daily')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`${filePath} does not exist`);
  }
}

inspectFile('c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/ChatView.tsx');
inspectFile('c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/CallInterface.tsx');
