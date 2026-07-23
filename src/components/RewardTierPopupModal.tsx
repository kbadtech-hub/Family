'use client';

import React, { useState, useEffect } from 'react';
import { TIER_REWARDS, TierRewardConfig } from '@/lib/rewards';
import { 
  Sparkles, 
  Coins, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  Crown, 
  Award,
  Smartphone
} from 'lucide-react';
import Image from 'next/image';

interface PopupItem {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'vip';
  coins_awarded: number;
  awarded_at?: string;
}

interface RewardTierPopupModalProps {
  userId: string;
  unseenPopups: PopupItem[];
  googlePlayUrl?: string;
  appleStoreUrl?: string;
  onNavigateToOnboarding?: () => void;
  onNavigateToVerification?: () => void;
  onNavigateToSubscriptions?: () => void;
  onCloseAll?: () => void;
}

export default function RewardTierPopupModal({
  userId,
  unseenPopups,
  googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.beteseb.app',
  appleStoreUrl = 'https://apps.apple.com/app/beteseb/id123456789',
  onNavigateToOnboarding,
  onNavigateToVerification,
  onNavigateToSubscriptions,
  onCloseAll
}: RewardTierPopupModalProps) {
  const [queue, setQueue] = useState<PopupItem[]>([]);
  const [currentPopup, setCurrentPopup] = useState<PopupItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unseenPopups && unseenPopups.length > 0) {
      setQueue(unseenPopups);
      setCurrentPopup(unseenPopups[0]);
    }
  }, [unseenPopups]);

  if (!currentPopup) return null;

  const config: TierRewardConfig = TIER_REWARDS[currentPopup.tier] || TIER_REWARDS.bronze;

  const handleDismissCurrent = async (customAction?: string) => {
    setLoading(true);
    try {
      await fetch('/api/rewards/dismiss-popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: currentPopup.tier })
      });
    } catch (e) {
      console.error('Failed to dismiss popup:', e);
    } finally {
      setLoading(false);
    }

    // Trigger action navigation if needed
    if (customAction === 'onboarding' && onNavigateToOnboarding) {
      onNavigateToOnboarding();
    } else if (customAction === 'verify' && onNavigateToVerification) {
      onNavigateToVerification();
    } else if (customAction === 'diamond' && onNavigateToSubscriptions) {
      onNavigateToSubscriptions();
    }

    // Advance queue
    const remaining = queue.slice(1);
    setQueue(remaining);
    if (remaining.length > 0) {
      setCurrentPopup(remaining[0]);
    } else {
      setCurrentPopup(null);
      if (onCloseAll) onCloseAll();
    }
  };

  const getTierColorClass = (t: string) => {
    switch (t) {
      case 'vip':
        return 'from-purple-600 via-indigo-600 to-pink-600 border-purple-400/40 text-purple-300';
      case 'diamond':
        return 'from-cyan-500 via-blue-600 to-indigo-600 border-cyan-300/40 text-cyan-300';
      case 'platinum':
        return 'from-slate-400 via-zinc-500 to-slate-700 border-slate-300/40 text-slate-200';
      case 'gold':
        return 'from-amber-400 via-yellow-500 to-orange-500 border-amber-300/40 text-amber-300';
      case 'silver':
        return 'from-slate-300 via-gray-400 to-slate-500 border-slate-200/40 text-slate-300';
      case 'bronze':
      default:
        return 'from-amber-600 via-orange-700 to-amber-800 border-amber-500/40 text-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-center overflow-hidden">
        {/* Decorative Background Rays & Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => handleDismissCurrent()}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tier Header Badge */}
        <div className="flex justify-center mb-4">
          <div className={`px-4 py-1.5 rounded-full border bg-gradient-to-r ${getTierColorClass(currentPopup.tier)} shadow-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2`}>
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{config.nameAm}</span>
          </div>
        </div>

        {/* Big Coin Illustration */}
        <div className="relative flex justify-center items-center my-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-xl shadow-amber-500/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center border-2 border-amber-400/50">
              <Coins className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 animate-bounce" />
              <span className="text-xl sm:text-2xl font-black text-amber-300">+{currentPopup.coins_awarded}</span>
            </div>
          </div>
        </div>

        {/* Title & Message */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
          እንኳን ደስ አለዎት! 🎁
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          {config.descriptionAm}
        </p>

        {/* Total Cumulative Balance Pill */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 mb-6 flex items-center justify-between text-left">
          <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>አጠቃላይ የተጠራቀመ የኮይን ባላንስ:</span>
          </div>
          <span className="text-amber-400 font-bold text-base sm:text-lg">
            {config.cumulativeCoins} ኮይን
          </span>
        </div>

        {/* Actions / CTA Buttons */}
        {config.ctaAction === 'download' || currentPopup.tier === 'gold' || currentPopup.tier === 'platinum' ? (
          <div className="space-y-3">
            <div className="text-xs text-amber-300/80 font-medium flex items-center justify-center gap-1.5 mb-1">
              <Smartphone className="w-4 h-4" />
              <span>የቤተሰብ ሞባይል አፕሊኬሽን አሁኑኑ ያውርዱ፦</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Google Play Store Link */}
              <a
                href={googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  fetch('/api/rewards/claim-platinum', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                  }).catch(() => {});
                  handleDismissCurrent();
                }}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
              >
                {/* Play Store SVG */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L18.81,13.97C20.4,13.05 20.4,11.5 18.81,10.58L16.81,9.43L14.83,11.41L16.81,15.12M15.41,8.03L14.26,9.17L4.7,2.15C4.94,2.05 5.21,2 5.5,2C6.3,2 7.1,2.4 8.5,3.2L15.41,8.03M4.7,21.85L14.26,14.83L15.41,15.97L8.5,20.8C7.1,21.6 6.3,22 5.5,22C5.21,22 4.94,21.95 4.7,21.85Z" />
                </svg>
                <span>Google Play</span>
              </a>

              {/* Apple App Store Link */}
              <a
                href={appleStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  fetch('/api/rewards/claim-platinum', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                  }).catch(() => {});
                  handleDismissCurrent();
                }}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl font-bold text-xs sm:text-sm border border-slate-600 shadow-lg transition-all hover:scale-[1.02]"
              >
                {/* Apple Store SVG */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,21.97C7.79,22 6.87,20.68 6.03,19.47C4.31,17 3,12.77 4.78,9.68C5.66,8.15 7.23,7.19 8.95,7.16C10.24,7.13 11.46,8.03 12.24,8.03C13.02,8.03 14.5,6.94 16.08,7.12C16.74,7.15 18.6,7.39 19.78,9.11C19.68,9.17 17.65,10.35 17.67,12.87C17.7,15.89 20.31,16.89 20.34,16.9C20.31,16.97 19.92,18.32 18.71,19.5M15.97,5.17C16.66,4.33 17.13,3.16 17,2C15.97,2.04 14.73,2.69 13.97,3.57C13.31,4.33 12.8,5.53 12.97,6.67C14.12,6.76 15.29,6.01 15.97,5.17Z" />
                </svg>
                <span>App Store</span>
              </a>
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleDismissCurrent(config.ctaAction)}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>{config.ctaTextAm}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
