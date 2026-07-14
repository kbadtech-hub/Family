const fs = require('fs');
const filePath = 'c:/Users/KB/Desktop/Beteseb/Family/src/app/[locale]/dashboard/page.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Verify current state
console.log('Has ChatView:', content.includes('<ChatView'));
console.log('Has workshops:', content.includes("activeTab === 'workshops'"));
console.log('Has community:', content.includes("activeTab === 'community'"));
console.log('Has wedding:', content.includes("activeTab === 'wedding'"));

// We need to insert chat + workshops + community before wedding tab
// Find the wedding tab
const weddingMarker = "{activeTab === 'wedding'";
const weddingIdx = content.indexOf(weddingMarker);
console.log('Wedding block found at index:', weddingIdx);

if (weddingIdx === -1) {
  console.error('Wedding marker not found!');
  process.exit(1);
}

const chatBlock = `        {activeTab === 'chat' && (
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

        {activeTab === 'community' && (
          <div className="mt-10">
            <SubscriptionGate allowVerifiedView={true}>
              <CommunityView
                isVerified={verificationStatus === 'verified'}
                isPremium={isPremium}
                isAdmin={isAdmin}
                userCoins={profile?.coins || 0}
              />
            </SubscriptionGate>
          </div>
        )}

        `;

// Remove any leftover broken community/workshops blocks if present
if (!content.includes("activeTab === 'chat'")) {
  content = content.slice(0, weddingIdx) + chatBlock + content.slice(weddingIdx);
  console.log('Inserted chat, workshops, and community blocks.');
} else {
  console.log('Chat block already present, skipping.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File saved successfully.');
