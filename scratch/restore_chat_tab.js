const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'app', '[locale]', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Check current state
const hasChatView = content.includes('<ChatView');
const hasChatTab = content.includes("activeTab === 'chat'");
console.log('Has ChatView:', hasChatView);
console.log('Has chat tab block:', hasChatTab);

// Find where 'community' tab starts  
const communityIdx = content.indexOf("{activeTab === 'community'");
if (communityIdx === -1) {
  console.log('ERROR: community tab not found');
  process.exit(1);
}

// Look backwards from communityIdx to find the closing }) of whatever is before it
// We'll insert the chat + workshops blocks right before the community block
const insertionPoint = communityIdx;

const chatAndWorkshopsBlock = `{activeTab === 'chat' && (
           <div className="w-full h-[calc(100dvh-64px)] md:mt-10 md:h-[calc(100vh-200px)]">
              <SubscriptionGate allowVerifiedView={false}>
                 <ChatView isPremium={isPremium} />
              </SubscriptionGate>
           </div>
        )}

        {activeTab === 'workshops' && (
           <div className="mt-10">
              <SubscriptionGate allowVerifiedView={true}>
                 <AcademyView isPremium={isPremium} userCoins={profile?.coins || 0} />
              </SubscriptionGate>
           </div>
        )}

        `;

if (!hasChatView) {
  // Insert chat block before community
  content = content.slice(0, insertionPoint) + chatAndWorkshopsBlock + content.slice(insertionPoint);
  console.log('Inserted chat + workshops blocks before community tab.');
} else {
  console.log('ChatView already present, no insertion needed.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
