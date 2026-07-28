const fs = require('fs');

// ── Fix CommunityView.tsx ─────────────────────────────────────────────
let community = fs.readFileSync('src/components/dashboard/CommunityView.tsx', 'utf8');

// The file already imports useTranslations, use namespace 'Community'
// Find the existing t declaration and check its namespace
const tMatch = community.match(/const t = useTranslations\('([^']+)'\)/);
console.log('CommunityView namespace:', tMatch ? tMatch[1] : 'NOT FOUND');

// If namespace isn't Community, we need a second translation hook
// Add tCom for Community namespace
community = community.replace(
  `const t = useTranslations('`,
  `const tCom = useTranslations('Community');\n  const t = useTranslations('`
);

// Replace hardcoded strings
community = community.replace(
  `<span>Following</span>`,
  `<span>{tCom('following')}</span>`
);
community = community.replace(
  `<span>Follow</span>`,
  `<span>{tCom('follow')}</span>`
);
community = community.replace(
  `<span>Delete Post</span>`,
  `<span>{tCom('deletePost')}</span>`
);
community = community.replace(
  `<span>Deep Link Share</span>`,
  `<span>{tCom('deepLinkShare')}</span>`
);

fs.writeFileSync('src/components/dashboard/CommunityView.tsx', community, 'utf8');
console.log('CommunityView.tsx fixed');

// ── Fix ProfileView.tsx ───────────────────────────────────────────────
let profile = fs.readFileSync('src/components/dashboard/ProfileView.tsx', 'utf8');

const tMatchP = profile.match(/const t = useTranslations\('([^']+)'\)/);
console.log('ProfileView namespace:', tMatchP ? tMatchP[1] : 'NOT FOUND');

// Add tDash for Dashboard namespace
profile = profile.replace(
  `const t = useTranslations('`,
  `const tDash = useTranslations('Dashboard');\n  const t = useTranslations('`
);
profile = profile.replace(
  `<span>Profile Completion</span>`,
  `<span>{tDash('profile.completion')}</span>`
);

fs.writeFileSync('src/components/dashboard/ProfileView.tsx', profile, 'utf8');
console.log('ProfileView.tsx fixed');

// ── Fix WorkshopsView.tsx ─────────────────────────────────────────────
let workshops = fs.readFileSync('src/components/dashboard/WorkshopsView.tsx', 'utf8');

// Add useTranslations import
workshops = workshops.replace(
  `import React, { useState, useEffect } from 'react';`,
  `import React, { useState, useEffect } from 'react';\nimport { useTranslations } from 'next-intl';`
);

// Add t hook inside the component function
workshops = workshops.replace(
  `export default function WorkshopsView() {`,
  `export default function WorkshopsView() {\n  const t = useTranslations('Workshops');`
);

// Replace hardcoded labels
workshops = workshops.replace(
  `<span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Topic</span>`,
  `<span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">{t('topicLabel')}</span>`
);
workshops = workshops.replace(
  `<span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Time Slot</span>`,
  `<span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">{t('timeSlotLabel')}</span>`
);
workshops = workshops.replace(
  `<option value="Pre-Marriage">Pre-Marriage Guidance</option>`,
  `<option value="Pre-Marriage">{t('topicPreMarriage')}</option>`
);
workshops = workshops.replace(
  `<option value="Finance">Family Finance Planning</option>`,
  `<option value="Finance">{t('topicFinance')}</option>`
);
workshops = workshops.replace(
  `<option value="Conflict Resolution">Conflict Resolution</option>`,
  `<option value="Conflict Resolution">{t('topicConflict')}</option>`
);
workshops = workshops.replace(
  `<option value="General">General Consultation</option>`,
  `<option value="General">{t('topicGeneral')}</option>`
);

fs.writeFileSync('src/components/dashboard/WorkshopsView.tsx', workshops, 'utf8');
console.log('WorkshopsView.tsx fixed');

// ── Fix BetesebVipCard.tsx ────────────────────────────────────────────
let vipCard = fs.readFileSync('src/components/dashboard/BetesebVipCard.tsx', 'utf8');

// Add useTranslations import
vipCard = vipCard.replace(
  `'use client';`,
  `'use client';\nimport { useTranslations } from 'next-intl';`
);

// Add t hook - find the component function
vipCard = vipCard.replace(
  /export default function BetesebVipCard\([^)]*\)\s*\{/,
  (match) => match + `\n  const t = useTranslations('About');`
);

// Diamond badge - use the About.badges.level4.title key
vipCard = vipCard.replace(
  `<span>Diamond</span>`,
  `<span>{t('badges.level4.title').split(' ')[0]}</span>`
);

fs.writeFileSync('src/components/dashboard/BetesebVipCard.tsx', vipCard, 'utf8');
console.log('BetesebVipCard.tsx fixed');

console.log('\nAll 4 components fixed!');
