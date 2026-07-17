const fs = require('fs');
const content = fs.readFileSync('c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/CallInterface.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('aiViolation')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
