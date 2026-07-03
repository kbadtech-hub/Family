'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { getUserSubscriptionInfo, SubscriptionInfo, canUseFeature, FeatureQuota } from '@/lib/subscription';
import { ShieldCheck, Sparkles, Lock, Loader2, Video, Mic, MessageCircle, Users, Globe } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  /**
   * The feature to gate. If the user lacks this feature, show the upgrade modal.
   * If omitted, gate is based on premium/verification status.
   */
  feature?: keyof FeatureQuota;
  /** If true, render children blurred with an overlay instead of blocking entirely */
  blurMode?: boolean;
  /** If true, verified users can view the children (but interaction will trigger upgrade popup) */
  allowVerifiedView?: boolean;
}

const FEATURE_LABELS: Record<keyof FeatureQuota, { icon: React.ReactNode; en: string; am: string }> = {
  audioDailySeconds: { icon: <Mic size={24} />, en: 'Audio Calling', am: 'የድምጽ ጥሪ' },
  videoEnabled: { icon: <Video size={24} />, en: 'Video Calling', am: 'የቪዲዮ ጥሪ' },
  dailyMessages: { icon: <MessageCircle size={24} />, en: 'Messaging', am: 'መልዕክት' },
  friendRequestsEnabled: { icon: <Users size={24} />, en: 'Friend Requests', am: 'የወዳጅነት ጥያቄ' },
  communityPostEnabled: { icon: <Globe size={24} />, en: 'Community Posts', am: 'የማህበረሰብ ፖስቶች' },
  profilePhotosBlurred: { icon: <ShieldCheck size={24} />, en: 'Profile Photos', am: 'የፕሮፋይል ፎቶ' },
};

export default function SubscriptionGate({ 
  children, 
  feature, 
  blurMode = false, 
  allowVerifiedView = false 
}: SubscriptionGateProps) {
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    async function checkSub() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const info = await getUserSubscriptionInfo(user.id);
        setSubInfo(info);
      }
      setLoading(false);
    }
    checkSub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If account is locked (banned/admin locked)
  if (subInfo?.tier === 'locked') {
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-red-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-accent">
          {locale === 'am' ? 'አካውንት ተቆልፏል' : 'Account Locked'}
        </h2>
        <p className="text-gray-500">
          {locale === 'am'
            ? 'አካውንትዎ ተቆልፏል። ለተጨማሪ መረጃ ድጋፍ ያነጋግሩ።'
            : 'Your account has been locked. Please contact support for assistance.'}
        </p>
        <button
          onClick={() => router.push('/dashboard?tab=payment')}
          className="btn-primary w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          {locale === 'am' ? 'ፕሪሚየም አባል ይሁኑ' : 'Upgrade to Premium'}
        </button>
      </div>
    );
  }

  const isPremium = subInfo?.tier === 'premium';
  const isVerified = subInfo?.isVerified || false;

  // If no feature gate set, perform tier-based (Premium/Verified) gating
  if (!feature) {
    if (isPremium) {
      return <>{children}</>;
    }

    if (isVerified && allowVerifiedView) {
      return (
        <div className="relative w-full h-full">
          <div>{children}</div>
          <div
            className="absolute inset-0 z-20 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPopup(true);
            }}
          />
          {showPopup && (
            <PremiumModal
              locale={locale}
              onClose={() => setShowPopup(false)}
              onUpgrade={() => router.push('/dashboard?tab=payment')}
              featureMeta={{
                icon: <Sparkles size={24} />,
                en: 'Premium Access',
                am: 'ፕሪሚየም አገልግሎት',
              }}
            />
          )}
        </div>
      );
    }

    // Hard block
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-primary/20 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
          <Sparkles size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-accent uppercase tracking-tight">
            {locale === 'am' ? 'ፕሪሚየም ብቻ' : 'Premium Only'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {locale === 'am'
              ? 'ይህን ገጽ ለማየት ፕሪሚየም አባል ይሁኑ።'
              : 'Upgrade to Premium to unlock this tab and access exclusive content.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard?tab=payment')}
          className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs"
        >
          {locale === 'am' ? 'ፕሪሚየም ይሁኑ' : 'Become Premium'}
        </button>
      </div>
    );
  }

  const hasAccess = canUseFeature(subInfo, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Feature is locked — show blur or hard block
  const featureMeta = FEATURE_LABELS[feature] || { icon: <Lock size={24} />, en: feature, am: feature };

  if (blurMode) {
    return (
      <div className="relative">
        <div
          className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center p-8 text-center space-y-4 cursor-pointer"
          onClick={() => setShowPopup(true)}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Sparkles size={24} />
          </div>
          <h3 className="font-black text-accent uppercase tracking-tighter italic">
            {locale === 'am' ? 'ፕሪሚየም ባህሪ' : 'Premium Feature'}
          </h3>
          <p className="text-xs text-gray-500 font-medium max-w-[200px]">
            {locale === 'am'
              ? `${featureMeta.am} ለፕሪሚየም አባላት ብቻ ነው።`
              : `${featureMeta.en} is available for Premium members only.`}
          </p>
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            {locale === 'am' ? 'አሁኑኑ ይክፈቱ' : 'Unlock Now'}
          </button>
        </div>
        <div className="blur-[3px] pointer-events-none">{children}</div>

        {showPopup && (
          <PremiumModal
            locale={locale}
            onClose={() => setShowPopup(false)}
            onUpgrade={() => router.push('/dashboard?tab=payment')}
            featureMeta={featureMeta}
          />
        )}
      </div>
    );
  }

  // Hard block mode
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-primary/20 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
        {featureMeta.icon}
      </div>
      <div>
        <h2 className="text-xl font-black text-accent uppercase tracking-tight">
          {locale === 'am' ? `${featureMeta.am} — ፕሪሚየም ብቻ` : `${featureMeta.en} — Premium Only`}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {locale === 'am'
            ? 'ይህን ባህሪ ለማስጀመር ፕሪሚየም አባል ይሁኑ።'
            : 'Upgrade to Premium to unlock this feature and connect with your ideal match.'}
        </p>
      </div>
      <button
        onClick={() => router.push('/dashboard?tab=payment')}
        className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs"
      >
        {locale === 'am' ? 'ፕሪሚየም ይሁኑ' : 'Become Premium'}
      </button>
    </div>
  );
}

function PremiumModal({ locale, onClose, onUpgrade, featureMeta }: {
  locale: string;
  onClose: () => void;
  onUpgrade: () => void;
  featureMeta: { icon: React.ReactNode; en: string; am: string };
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary">
          <ShieldCheck size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-accent italic uppercase tracking-tighter leading-none">
            {locale === 'am' ? 'ፕሪሚየም ባህሪ' : 'Premium Feature'}
          </h2>
          <p className="text-sm text-gray-500 mt-2 italic">
            {locale === 'am'
              ? `${featureMeta.am} ለፕሪሚየም አባላት ብቻ ነው። አሁን ያሳድጉ!`
              : `${featureMeta.en} is exclusive to Premium members. Upgrade now to unlock it!`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onUpgrade}
            className="btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-[10px]"
          >
            {locale === 'am' ? 'ፕሪሚየም ይሁኑ' : 'Become Premium'}
          </button>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
          >
            {locale === 'am' ? 'ተመለስ' : 'Maybe Later'}
          </button>
        </div>
      </div>
    </div>
  );
}
