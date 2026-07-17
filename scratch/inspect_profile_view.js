const fs = require('fs');
const content = fs.readFileSync('c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/ProfileView.tsx', 'utf8');
const lines = content.split('\n');

const keywords = ['biometric', 'lock', 'pin', 'settings', 'passcode'];
keywords.forEach(keyword => {
  console.log(`\n--- Matches for: ${keyword} ---`);
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
});
