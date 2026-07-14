const fs = require('fs');
const filePath = 'c:/Users/KB/Desktop/Beteseb/Family/src/components/dashboard/ChatView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// FIX 1: Outer container — force w-full, remove shadow on mobile, ensure h-screen on mobile
const outerOld = `    <div className="flex flex-col md:flex-row bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border border-muted shadow-2xl md:h-[calc(100vh-200px)]" style={{touchAction:'manipulation'}}>`;
const outerNew = `    <div className="flex flex-col md:flex-row w-full bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border md:border-muted md:shadow-2xl h-[calc(100dvh-64px)] md:h-[calc(100vh-200px)]" style={{touchAction:'manipulation'}}>`;

if (content.includes(outerOld)) {
  content = content.replace(outerOld, outerNew);
  console.log('✅ Fixed outer container: w-full, edge-to-edge h, no shadow on mobile');
} else {
  console.log('⚠️  Outer container pattern not matched');
  const match = content.match(/\<div className="flex flex-col md:flex-row[^"]*"/);
  if (match) console.log('  Actual:', match[0]);
}

// FIX 2: Sidebar aside — fix height calc to account for smaller header (64px mobile nav)
const asideOld = `      <aside className={\`w-full md:w-80 border-b md:border-b-0 md:border-r border-muted flex flex-col md:h-full \${selectedMatch ? 'hidden md:flex' : 'flex h-[calc(100dvh-140px)] md:h-full'}\`}>`;
const asideNew = `      <aside className={\`w-full md:w-80 border-b md:border-b-0 md:border-r border-muted flex flex-col md:h-full \${selectedMatch ? 'hidden md:flex' : 'flex h-full md:h-full'}\`}>`;

if (content.includes(asideOld)) {
  content = content.replace(asideOld, asideNew);
  console.log('✅ Fixed sidebar height to h-full');
} else {
  console.log('⚠️  Sidebar aside pattern not matched');
}

// FIX 3: Main chat area — ensure it fills parent height
const mainChatOld = `      {/* Main Chat Area */}
      <div className={\`flex-1 flex flex-col bg-[#FDFBF9] \${selectedMatch ? 'flex' : 'hidden md:flex'}\`}>`;
const mainChatNew = `      {/* Main Chat Area */}
      <div className={\`flex-1 flex flex-col bg-[#FDFBF9] min-h-0 \${selectedMatch ? 'flex' : 'hidden md:flex'}\`}>`;

if (content.includes(mainChatOld)) {
  content = content.replace(mainChatOld, mainChatNew);
  console.log('✅ Added min-h-0 to main chat area');
} else {
  console.log('⚠️  Main chat area pattern not matched');
}

// FIX 4: Messages scroll area — ensure it properly fills remaining height
const messagesOld = `            <div \n              ref={scrollRef}\n              className="flex-1 overflow-y-auto p-10 space-y-6 scroll-smooth"\n            >`;
const messagesNew = `            <div \n              ref={scrollRef}\n              className="flex-1 overflow-y-auto min-h-0 p-4 md:p-10 space-y-6 scroll-smooth"\n            >`;

if (content.includes(messagesOld)) {
  content = content.replace(messagesOld, messagesNew);
  console.log('✅ Fixed messages area padding on mobile and added min-h-0');
} else {
  console.log('⚠️  Messages scroll area not matched — trying alternate...');
  const altOld = `            <div \r\n              ref={scrollRef}\r\n              className="flex-1 overflow-y-auto p-10 space-y-6 scroll-smooth"\r\n            >`;
  const altNew = `            <div \r\n              ref={scrollRef}\r\n              className="flex-1 overflow-y-auto min-h-0 p-4 md:p-10 space-y-6 scroll-smooth"\r\n            >`;
  if (content.includes(altOld)) {
    content = content.replace(altOld, altNew);
    console.log('✅ Fixed messages area (CRLF)');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
