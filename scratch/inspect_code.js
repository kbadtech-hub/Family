const fs = require('fs');
const path = require('path');

const targetFile = 'c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/dashboard/page.tsx';

if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  
  console.log('Total lines:', lines.length);
  
  // Search for keywords
  const keywords = ['PaymentTab', 'PaymentPortal', 'Chapa', 'Stripe', 'coin_balance', 'daily_limits', 'limit'];
  
  keywords.forEach(keyword => {
    console.log(`\n--- Matches for: ${keyword} ---`);
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  });
} else {
  console.log('File does not exist');
}
