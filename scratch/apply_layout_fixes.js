const fs = require('fs');

// Helper: replace handling both LF and CRLF
function flexReplace(content, search, replacement) {
  // Try exact
  if (content.includes(search)) {
    return [content.replace(search, replacement), true];
  }
  // Try CRLF version
  const crlf = search.replace(/\n/g, '\r\n');
  if (content.includes(crlf)) {
    return [content.replace(crlf, replacement.replace(/\n/g, '\r\n')), true];
  }
  // Try LF version (convert content to LF)
  const lf = search.replace(/\r\n/g, '\n');
  if (content.replace(/\r\n/g, '\n').includes(lf)) {
    const newContent = content.replace(/\r\n/g, '\n').replace(lf, replacement.replace(/\r\n/g, '\n'));
    return [newContent, true];
  }
  return [content, false];
}

// =============================================
// FIX dashboard/page.tsx
// =============================================
{
  const filePath = 'c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/dashboard/page.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  let ok;

  // Fix 1: main padding — remove on mobile for chat tab
  [content, ok] = flexReplace(content,
    `      <main className="flex-1 p-6 md:p-16 overflow-y-auto">`,
    `      <main className={\`flex-1 overflow-y-auto \${activeTab === 'chat' ? 'p-0 md:p-16' : 'p-6 md:p-16'}\`}>`
  );
  console.log(ok ? '✅ dashboard main padding fixed' : '⚠️  dashboard main padding NOT matched');

  // Fix 2: chat tab wrapper — edge-to-edge  
  [content, ok] = flexReplace(content,
    `        {activeTab === 'chat' && (\n           <div className="mt-10 h-[calc(100vh-200px)]">\n              <SubscriptionGate allowVerifiedView={false}>\n                 <ChatView isPremium={isPremium} />\n              </SubscriptionGate>\n           </div>\n        )}`,
    `        {activeTab === 'chat' && (\n           <div className="w-full h-[calc(100dvh-64px)] md:mt-10 md:h-[calc(100vh-200px)]">\n              <SubscriptionGate allowVerifiedView={false}>\n                 <ChatView isPremium={isPremium} />\n              </SubscriptionGate>\n           </div>\n        )}`
  );
  console.log(ok ? '✅ chat tab wrapper fixed' : '⚠️  chat tab wrapper NOT matched');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('dashboard/page.tsx saved.');
}

// =============================================
// FIX ChatView.tsx
// =============================================
{
  const filePath = 'c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/ChatView.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  let ok;

  // Fix 1: outer container — w-full, h-screen on mobile, no shadow/border on mobile
  [content, ok] = flexReplace(content,
    `    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-200px)] bg-white rounded-[2.5rem] overflow-hidden border border-muted shadow-2xl">`,
    `    <div className="flex flex-col md:flex-row w-full h-[calc(100dvh-64px)] md:h-[calc(100vh-200px)] bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border md:border-muted md:shadow-2xl" style={{touchAction:'manipulation'}}>`
  );
  console.log(ok ? '✅ ChatView outer container fixed' : '⚠️  ChatView outer container — trying alternate...');

  if (!ok) {
    // Try the version already modified in a previous session
    [content, ok] = flexReplace(content,
      `    <div className="flex flex-col md:flex-row bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border border-muted shadow-2xl md:h-[calc(100vh-200px)]" style={{touchAction:'manipulation'}}>`,
      `    <div className="flex flex-col md:flex-row w-full bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border md:border-muted md:shadow-2xl h-[calc(100dvh-64px)] md:h-[calc(100vh-200px)]" style={{touchAction:'manipulation'}}>`
    );
    console.log(ok ? '✅ ChatView outer container fixed (v2)' : '⚠️  ChatView outer container NOT matched');
    if (!ok) {
      // Find whatever variant exists
      const match = content.match(/\<div className="[^"]*flex-col md:flex-row[^"]*"/);
      if (match) console.log('  Actual outer div:', match[0]);
    }
  }

  // Fix 2: sidebar height — use h-full instead of calculated height
  [content, ok] = flexReplace(content,
    `h-[calc(100dvh-140px)] md:h-full`,
    `h-full md:h-full`
  );
  console.log(ok ? '✅ Sidebar height fixed' : '⚠️  Sidebar height NOT matched');

  // Fix 3: aside — make visible on mobile when no match selected too
  // (already done via the selectedMatch conditional — just ensure it's present)
  const hasAsideConditional = content.includes("selectedMatch ? 'hidden md:flex'");
  console.log(hasAsideConditional ? '✅ Aside conditional visibility present' : '⚠️  Aside conditional missing');

  // Fix 4: Messages scroll area — reduce side padding on mobile
  [content, ok] = flexReplace(content,
    `className="flex-1 overflow-y-auto p-10 space-y-6 scroll-smooth"`,
    `className="flex-1 overflow-y-auto min-h-0 p-4 md:p-10 space-y-6 scroll-smooth"`
  );
  console.log(ok ? '✅ Messages scroll padding fixed' : '⚠️  Messages scroll padding NOT matched');

  // Fix 5: Main chat area div — add min-h-0 for flex overflow containment
  [content, ok] = flexReplace(content,
    `      {/* Main Chat Area */}\n      <div className={\`flex-1 flex flex-col bg-[#FDFBF9] \${selectedMatch ? 'flex' : 'hidden md:flex'}\`}>`,
    `      {/* Main Chat Area */}\n      <div className={\`flex-1 flex flex-col bg-[#FDFBF9] min-h-0 \${selectedMatch ? 'flex' : 'hidden md:flex'}\`}>`
  );
  console.log(ok ? '✅ Main chat area min-h-0 added' : '⚠️  Main chat area NOT matched — trying original form...');

  if (!ok) {
    // Try the original uncommitted version
    [content, ok] = flexReplace(content,
      `      {/* Main Chat Area */}\n      <div className="flex-1 flex flex-col bg-[#FDFBF9]">`,
      `      {/* Main Chat Area */}\n      <div className={\`flex-1 flex flex-col bg-[#FDFBF9] min-h-0 \${selectedMatch ? 'flex' : 'hidden md:flex'}\`}>`
    );
    console.log(ok ? '✅ Main chat area fixed (original form)' : '⚠️  Main chat area still not matched');
    if (!ok) {
      const idx = content.indexOf('Main Chat Area');
      if (idx !== -1) {
        console.log('  Actual area:', JSON.stringify(content.slice(idx, idx + 120)));
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('ChatView.tsx saved.');
}

console.log('\nAll layout fixes applied. Run `npm run build` to verify.');
