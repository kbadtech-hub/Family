const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'app', '[locale]', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add ShieldAlert import
if (!content.includes('ShieldAlert')) {
  content = content.replace('User\n}', 'User,\n  ShieldAlert\n}');
}

// 2. Define state and handleTabClick
const stateHook = 'const [showPaywallTarget, setShowPaywallTarget] = useState<any>(null);';
if (content.includes(stateHook) && !content.includes('showVerificationBlockModal')) {
  const newStates = `const [showPaywallTarget, setShowPaywallTarget] = useState<any>(null);
  const [showVerificationBlockModal, setShowVerificationBlockModal] = useState(false);

  const handleTabClick = (tabId: string) => {
    const coreTabs = ['chat', 'community', 'workshops', 'wedding', 'gifts'];
    if (coreTabs.includes(tabId) && verificationStatus !== 'verified') {
      setShowVerificationBlockModal(true);
      return;
    }
    setActiveTab(tabId);
  };`;
  content = content.replace(stateHook, newStates);
}

// 3. Replace setActiveTab calls with handleTabClick
content = content.replace(/setActiveTab\('chat'\)/g, "handleTabClick('chat')");
content = content.replace(/setActiveTab\(item\.id\)/g, "handleTabClick(item.id)");

// 4. Render modal after LockOverlay
const lockOverlayBlock = `{showPaywallTarget && profile && (
          <LockOverlay
            targetUserId={showPaywallTarget.id}
            targetUserName={showPaywallTarget.full_name || 'this user'}
            currentCoins={profile.coins || 0}
            costCoins={10}
            locale={locale}
            onClose={() => setShowPaywallTarget(null)}
            onUnlockSuccess={() => handleUnlockSuccess(showPaywallTarget.id)}
            onUpgrade={() => { setShowPaywallTarget(null); setShowPayment(true); }}
          />
        )}`;

const modalBlock = `
        {showVerificationBlockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[300] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] max-w-md w-full p-8 md:p-10 border border-primary/20 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <ShieldAlert size={32} className="text-primary fill-primary/10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
                  {locale === 'am' ? 'የመለያ ማረጋገጫ ያስፈልጋል' : 'Verification Required'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {locale === 'am' 
                    ? 'ይህን አገልግሎት ለመጠቀም እባክዎ መጀመሪያ ማንነትዎን ያረጋግጡ። የሀገር ውስጥ መታወቂያ፣ ብሄራዊ መታወቂያ ወይም ፓስፖርት በመጫን መለያዎን በደቂቃዎች ውስጥ ማረጋገጥ ይችላሉ።' 
                    : 'To access this feature, please complete your profile verification. You can easily verify your identity by uploading a government ID or Passport.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowVerificationBlockModal(false);
                    router.push('/onboarding?step=4');
                  }}
                  className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/25"
                >
                  {locale === 'am' ? 'አሁኑኑ አረጋግጥ / Verify Now' : 'Verify Now'}
                </button>
                <button
                  onClick={() => setShowVerificationBlockModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 transition-all text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  {locale === 'am' ? 'ዝጋ / Close' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
`;

if (content.includes('LockOverlay') && !content.includes('showVerificationBlockModal')) {
  // Let's insert it after the LockOverlay block.
  content = content.replace(lockOverlayBlock, lockOverlayBlock + modalBlock);
} else if (!content.includes('showVerificationBlockModal')) {
  console.error("LockOverlay block not found to anchor the verification modal!");
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated dashboard/page.tsx with tab locking and verification block modal!");
