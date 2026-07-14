const fs = require('fs');
const filePath = 'c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Verify the file is intact
console.log('File length:', content.length);
console.log('Has ChatView:', content.includes('<ChatView'));
console.log('Has workshops:', content.includes("activeTab === 'workshops'"));
console.log('Has community:', content.includes("activeTab === 'community'"));

// ============================================================
// FIX 1: Make <main> remove padding on chat tab (mobile only)
// ============================================================
const mainOld = `      <main className="flex-1 p-6 md:p-16 overflow-y-auto">`;
const mainNew = `      <main className={\`flex-1 overflow-y-auto \${activeTab === 'chat' ? 'p-0 md:p-16' : 'p-6 md:p-16'}\`}>`;

if (content.includes(mainOld)) {
  content = content.replace(mainOld, mainNew);
  console.log('✅ Fixed main padding conditional');
} else {
  console.log('⚠️  main element not matched — checking current form:');
  const mainMatch = content.match(/<main className="[^"]*"/);
  console.log('  Found:', mainMatch ? mainMatch[0] : 'NOT FOUND');
}

// ============================================================
// FIX 2: Chat tab wrapper — edge-to-edge on mobile
// ============================================================
const chatTabOld = `        {activeTab === 'chat' && (
           <div className="mt-10 h-[calc(100vh-200px)]">
              <SubscriptionGate allowVerifiedView={false}>
                 <ChatView isPremium={isPremium} />
              </SubscriptionGate>
           </div>
        )}`;

const chatTabNew = `        {activeTab === 'chat' && (
           <div className="w-full h-[calc(100dvh-64px)] md:mt-10 md:h-[calc(100vh-200px)]">
              <SubscriptionGate allowVerifiedView={false}>
                 <ChatView isPremium={isPremium} />
              </SubscriptionGate>
           </div>
        )}`;

if (content.includes(chatTabOld)) {
  content = content.replace(chatTabOld, chatTabNew);
  console.log('✅ Fixed chat tab wrapper to edge-to-edge');
} else {
  // Try with \r\n
  const chatTabOldCR = chatTabOld.replace(/\n/g, '\r\n');
  if (content.includes(chatTabOldCR)) {
    content = content.replace(chatTabOldCR, chatTabNew.replace(/\n/g, '\r\n'));
    console.log('✅ Fixed chat tab wrapper (CRLF)');
  } else {
    console.log('⚠️  Chat tab pattern not matched. Searching for closest...');
    const idx = content.indexOf("activeTab === 'chat' && (");
    console.log('  Chat tab found at index:', idx);
    if (idx !== -1) {
      const snippet = content.slice(idx, idx + 300);
      console.log('  Snippet:', JSON.stringify(snippet));
    }
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
