const fs = require('fs');
const content = fs.readFileSync('c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/CallInterface.tsx', 'utf8');
const lines = content.split('\n');

const keywords = ['webrtc', 'stream', 'violation', 'openvidu', 'agora', 'api', 'supabase', 'call_violations'];
keywords.forEach(keyword => {
  console.log(`\n--- Matches for: ${keyword} ---`);
  let count = 0;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      count++;
      if (count < 10) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    }
  });
  console.log(`Total occurrences of "${keyword}": ${count}`);
});
