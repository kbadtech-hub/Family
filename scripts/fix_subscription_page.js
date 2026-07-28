const fs = require('fs');

// Fix SubscriptionPlansPage.tsx - replace all isAm ternaries with t() calls
let content = fs.readFileSync('src/components/dashboard/SubscriptionPlansPage.tsx', 'utf8');

// 1. Add useTranslations to import
content = content.replace(
  `import { useLocale } from 'next-intl';`,
  `import { useTranslations, useLocale } from 'next-intl';`
);

// 2. Add t hook after locale/isAm
content = content.replace(
  `  const locale = useLocale();\n  const isAm = locale === 'am';`,
  `  const locale = useLocale();\n  const t = useTranslations('Subscription');\n  const isAm = locale === 'am';`
);

// 3. ETB premiumPlans - replace isAm ternaries with t() keys
content = content.replace(
  `      { id: '1m', name: isAm ? '1 ወር' : '1 Month', price: 149.99, originalPrice: 149.99, period: isAm ? 'በወር' : 'monthly', discount: 0 },`,
  `      { id: '1m', name: t('plan1m'), price: 149.99, originalPrice: 149.99, period: t('periodMonthly'), discount: 0 },`
);
content = content.replace(
  `      { id: '3m', name: isAm ? '3 ወር (15% ቅናሽ)' : '3 Months (15% Off)', price: 379.99, originalPrice: 449.97, period: isAm ? 'በ3 ወር' : 'quarterly', discount: 15 },`,
  `      { id: '3m', name: t('plan3m'), price: 379.99, originalPrice: 449.97, period: t('periodQuarterly'), discount: 15 },`
);
content = content.replace(
  `      { id: '6m', name: isAm ? '6 ወር (28% ቅናሽ)' : '6 Months (28% Off)', price: 649.99, originalPrice: 899.94, period: isAm ? 'በ6 ወር' : 'semi-annually', discount: 28, popular: true },`,
  `      { id: '6m', name: t('plan6m'), price: 649.99, originalPrice: 899.94, period: t('periodSemiAnnual'), discount: 28, popular: true },`
);
content = content.replace(
  `      { id: '12m', name: isAm ? '1 ዓመት (44% ቅናሽ)' : '1 Year (44% Off)', price: 999.99, originalPrice: 1799.88, period: isAm ? 'በዓመት' : 'yearly', discount: 44 },`,
  `      { id: '12m', name: t('plan12m'), price: 999.99, originalPrice: 1799.88, period: t('periodYearly'), discount: 44 },`
);
content = content.replace(
  `      { id: 'lifetime', name: isAm ? 'የዕድሜ ልክ' : 'Lifetime Access', price: 1499.99, originalPrice: 1499.99, period: isAm ? 'ቋሚ' : 'lifetime', discount: 0 }`,
  `      { id: 'lifetime', name: t('planLifetime'), price: 1499.99, originalPrice: 1499.99, period: t('periodLifetime'), discount: 0 }`
);

// 4. ETB vipPlans - replace isAm ternaries
content = content.replace(
  `      { id: 'vip_1m', name: isAm ? '1 ወር VIP' : '1 Month VIP', price: 299.98, originalPrice: 299.98, period: isAm ? 'በወር' : 'monthly', discount: 0 },`,
  `      { id: 'vip_1m', name: t('plan1mVip'), price: 299.98, originalPrice: 299.98, period: t('periodMonthly'), discount: 0 },`
);
content = content.replace(
  `      { id: 'vip_3m', name: isAm ? '3 ወር VIP (15% ቅናሽ)' : '3 Months VIP (15% Off)', price: 759.98, originalPrice: 899.94, period: isAm ? 'በ3 ወር' : 'quarterly', discount: 15 },`,
  `      { id: 'vip_3m', name: t('plan3mVip'), price: 759.98, originalPrice: 899.94, period: t('periodQuarterly'), discount: 15 },`
);
content = content.replace(
  `      { id: 'vip_6m', name: isAm ? '6 ወር VIP (28% ቅናሽ)' : '6 Months VIP (28% Off)', price: 1299.98, originalPrice: 1799.88, period: isAm ? 'በ6 ወር' : 'semi-annually', discount: 28, popular: true },`,
  `      { id: 'vip_6m', name: t('plan6mVip'), price: 1299.98, originalPrice: 1799.88, period: t('periodSemiAnnual'), discount: 28, popular: true },`
);
content = content.replace(
  `      { id: 'vip_12m', name: isAm ? '1 ዓመት VIP (44% ቅናሽ)' : '1 Year VIP (44% Off)', price: 1999.98, originalPrice: 3599.76, period: isAm ? 'በዓመት' : 'yearly', discount: 44 },`,
  `      { id: 'vip_12m', name: t('plan12mVip'), price: 1999.98, originalPrice: 3599.76, period: t('periodYearly'), discount: 44 },`
);
content = content.replace(
  `      { id: 'vip_lifetime', name: isAm ? 'የዕድሜ ልክ VIP' : 'Lifetime VIP', price: 2999.98, originalPrice: 2999.98, period: isAm ? 'ቋሚ' : 'lifetime', discount: 0 }`,
  `      { id: 'vip_lifetime', name: t('planLifetimeVip'), price: 2999.98, originalPrice: 2999.98, period: t('periodLifetime'), discount: 0 }`
);

// 5. showAlert claim success
content = content.replace(
  `      showAlert(\n        isAm \n          ? \`የክፍያ ቅሬታዎ በትኬት ቁጥር \${ticketNumber} በተሳካ ሁኔታ ተመዝግቧል። አድሚኑ መርምሮ ወዲያውኑ አገልግሎቱን ያነቃቃል።\` \n          : \`Your payment claim has been submitted successfully under ticket \${ticketNumber}. Admins will verify it shortly.\`,\n        'success',\n        isAm ? 'ቅሬታው ቀርቧል' : 'Claim Submitted'\n      );`,
  `      showAlert(\n        t('claimSuccessMsg').replace('{ticket}', ticketNumber),\n        'success',\n        t('claimSuccess')\n      );`
);

// 6. showAlert payment failed
content = content.replace(
  `showAlert(displayMsg, 'error', isAm ? 'የክፍያ ችግር ተፈጥሯል' : 'Payment Initialization Failed');`,
  `showAlert(displayMsg, 'error', t('paymentFailed'));`
);

// 7. JSX Header
content = content.replace(
  `{isAm ? 'ቤተሰብ ዳይመንድ እና ቪአይፒ' : 'Beteseb Diamond & VIP Hub'}`,
  `{t('hub')}`
);

// 8. Welcome headings
content = content.replace(
  `          {activePlanType === 'vip' \n            ? (isAm ? 'እንኳን ወደ ቪአይፒ አገልግሎት በደህና መጡ' : 'Welcome to VIP Status')\n            : (isAm ? 'እንኳን ወደ ዳይመንድ አገልግሎት በደህና መጡ' : 'Welcome to Diamond Status')}`,
  `          {activePlanType === 'vip' ? t('welcomeVip') : t('welcomeDiamond')}`
);

// 9. Description
content = content.replace(
  `          {activePlanType === 'vip'\n            ? (isAm ? 'የእርስዎን ግላዊነት ሙሉ በሙሉ የሚቆጣጠሩበት፣ ከፍተኛ ጥበቃ የሚደረግለት እና ልዩ የሆኑ ፊቸሮችን የሚያገኙበት የቪአይፒ ክለብ።' : 'Exquisite privacy controls, complete incognito features, and golden crown status for elite matchmaking.')\n            : (isAm ? 'ያልተገደበ የጽሑፍ ውይይት፣ ሙሉ የመገለጫ መረጃዎች እና ምርጥ አማራጮችን በማግኘት የትዳር አጋርዎን በፍጥነት ያግኙ።' : 'Unlock unlimited matches, contact profiles directly, access expert classes, and find your lifetime partner today.')}`,
  `          {activePlanType === 'vip' ? t('descVip') : t('descDiamond')}`
);

// 10. Tab labels
content = content.replace(
  `{isAm ? 'የዳይመንድ አባልነት' : 'Diamond Plans'}`,
  `{t('diamondPlans')}`
);
content = content.replace(
  `{isAm ? 'ቪአይፒ አባልነት' : 'VIP Plans'}`,
  `{t('vipPlans')}`
);

// 11. Key features heading
content = content.replace(
  `{isAm ? 'የሚያገኟቸው ዋና ጥቅሞች' : 'Key Features & Benefits'}`,
  `{t('keyFeatures')}`
);

// 12. Feature items (premium)
content = content.replace(
  `{isAm ? 'ያልተገደበ የትዳር አጋር ማግኘት' : 'Unlimited Matching Feed'}`,
  `{t('feat1Title')}`
);
content = content.replace(
  `{isAm ? 'የየቀኑን ገደብ በማለፍ ሁሉንም መገለጫዎች ይጎብኙ።' : 'Bypass the trust tier daily card limits and explore profiles without restrictions.'}`,
  `{t('feat1Desc')}`
);
content = content.replace(
  `{isAm ? 'የቀጥታ ውይይት' : 'Direct Private Chat'}`,
  `{t('feat2Title')}`
);
content = content.replace(
  `{isAm ? 'ለሚፈልጉት ሰው ወዲያውኑ የጽሑፍ ውይይት ይጀምሩ።' : 'Start chatting with matches instantly without wait limits.'}`,
  `{t('feat2Desc')}`
);
content = content.replace(
  `{isAm ? 'የሰዎች ሙሉ ዝርዝር መረጃ' : 'View Full Details & Bios'}`,
  `{t('feat3Title')}`
);
content = content.replace(
  `{isAm ? 'የሰዎችን ባዮ፣ ምርጫዎች እና ዝርዝር መረጃዎች ይክፈቱ።' : 'Reveal blurred profile traits, descriptions, and user bios.'}`,
  `{t('feat3Desc')}`
);
content = content.replace(
  `{isAm ? 'ቅድሚያ የሚሰጠው የድጋፍ አገልግሎት' : 'Priority Customer Care'}`,
  `{t('feat4Title')}`
);
content = content.replace(
  `{isAm ? 'ማንኛውም ችግር ሲያጋጥምዎት ቅድሚያ ድጋፍ ያገኛሉ።' : 'Your support requests and verification status updates are prioritized.'}`,
  `{t('feat4Desc')}`
);
// VIP features
content = content.replace(
  `{isAm ? 'የወርቅ አክሊል ባጅ (Crown Badge)' : 'Golden Crown Status'}`,
  `{t('feat5Title')}`
);
content = content.replace(
  `{isAm ? 'በሁሉም ቦታዎች ላይ የወርቅ አክሊል ባጅ መገለጫዎ ላይ ይደረጋል።' : 'Stand out with an elegant Crown Badge on your avatar and details page.'}`,
  `{t('feat5Desc')}`
);
content = content.replace(
  `{isAm ? 'የመደበቂያ ሁነታ (Ghost Mode)' : 'Ghost Mode & Privacy'}`,
  `{t('feat6Title')}`
);
content = content.replace(
  `{isAm ? 'ፎቶዎን መደበቅ እና ስምዎን ማደብዘዝ ይችላሉ።' : 'Completely blur your avatar image (radius=25) and hide your full name.'}`,
  `{t('feat6Desc')}`
);
content = content.replace(
  `{isAm ? 'የመስመር ላይ መገኘትን መደበቅ' : 'Incognito Online Controls'}`,
  `{t('feat7Title')}`
);
content = content.replace(
  `{isAm ? 'online መሆንዎን፣ የተነበበ ምልክትን መደበቅ ይችላሉ።' : 'Hide your online active indicators, typing state, and read receipts.'}`,
  `{t('feat7Desc')}`
);
content = content.replace(
  `{isAm ? 'ሁሉንም የዳይመንድ አገልግሎት ያካትታል' : 'All Diamond Benefits Included'}`,
  `{t('feat8Title')}`
);
content = content.replace(
  `{isAm ? 'ያልተገደበ መገለጫ፣ የቀጥታ ቻት እና ሌሎችንም ያካትታል።' : 'Enjoy complete Diamond access in addition to your exclusive VIP features.'}`,
  `{t('feat8Desc')}`
);

// 13. Checkout summary area
content = content.replace(
  `{isAm ? 'የተመረጠው አገልግሎት' : 'Selected Category'}`,
  `{t('selectedCategory')}`
);
content = content.replace(
  `{isAm ? 'ጠቅላላ ክፍያ' : 'Total Amount Due'}`,
  `{t('totalAmount')}`
);
content = content.replace(
  `{currentPlans.find(p => p.id === selectedDuration)?.discount}% {isAm ? 'ቅናሽ ተደርጓል' : 'Discount Applied'}`,
  `{currentPlans.find(p => p.id === selectedDuration)?.discount}% {t('discountApplied')}`
);
content = content.replace(
  `{isAm ? 'ክፍያን ፈጽም' : 'Complete Upgrade'}`,
  `{t('completeUpgrade')}`
);
content = content.replace(
  `{isAm ? 'አስተማማኝ ክፍያ • ወዲያውኑ ገባሪ ይሆናል' : 'Secure gateway • Activated instantly'}`,
  `{t('secureGateway')}`
);

// 14. Best Offer badge
content = content.replace(
  `<Star size={10} fill="white" /> {isAm ? 'ተመራጭ' : 'Best Offer'}`,
  `<Star size={10} fill="white" /> {t('bestOffer')}`
);

// 15. Claim button & modal
content = content.replace(
  `{isAm ? 'ክፍያ ፈጽመው አልሰራልዎትም? ቅሬታ ያቅርቡ (Claim Payment Issue)' : 'Paid but service not activated? Submit a claim'}`,
  `{t('submitClaimBtn')}`
);
content = content.replace(
  `{isAm ? 'የክፍያ ቅሬታ ማቅረቢያ' : 'Submit Payment Claim'}`,
  `{t('claimTitle')}`
);
content = content.replace(
  `{isAm ? 'የትራንዛክሽን ቁጥር (Transaction ID / Reference)' : 'Transaction ID / Reference'}`,
  `{t('claimTxLabel')}`
);
content = content.replace(
  `{isAm ? 'የክፍያ ዓይነት' : 'Payment Type'}`,
  `{t('claimTypeLabel')}`
);
content = content.replace(
  `<option value="subscription_vip">VIP Upgrade</option>`,
  `<option value="subscription_vip">{t('typeVip')}</option>`
);
content = content.replace(
  `<option value="subscription_premium">Diamond Upgrade</option>`,
  `<option value="subscription_premium">{t('typeDiamond')}</option>`
);
content = content.replace(
  `<option value="coins">Coins Package (100-10000 Coins)</option>`,
  `<option value="coins">{t('typeCoins')}</option>`
);
content = content.replace(
  `{isAm ? 'ማብራሪያ' : 'Explanation'}`,
  `{t('claimExplainLabel')}`
);
content = content.replace(
  `placeholder={isAm ? 'የተፈጠረውን ችግር እዚህ ያብራሩ...' : 'Describe what happened (amount paid, method, etc.)...'}`,
  `placeholder={t('claimExplainPlaceholder')}`
);
content = content.replace(
  `{isAm ? 'ቅሬታውን አቅርብ' : 'Submit Claim'}`,
  `{t('claimSubmit')}`
);

// Count remaining isAm patterns
const remaining = (content.match(/isAm \?/g) || []).length;
console.log(`Remaining isAm ? patterns: ${remaining}`);
if (remaining > 0) {
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('isAm ?')) console.log(`  Line ${i+1}: ${line.trim()}`);
  });
}

fs.writeFileSync('src/components/dashboard/SubscriptionPlansPage.tsx', content, 'utf8');
console.log('SubscriptionPlansPage.tsx updated successfully!');
