'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AppStoreBadgesProps {
  playStoreUrl?: string | null;
  appStoreUrl?: string | null;
  /** 'row' (default) for horizontal layout, 'column' for stacked */
  layout?: 'row' | 'column';
  /** 'dark' (default) for dark background, 'light' for white background */
  theme?: 'dark' | 'light';
  /** Extra wrapper class names */
  className?: string;
}

export default function AppStoreBadges({
  playStoreUrl,
  appStoreUrl,
  layout = 'row',
  theme = 'dark',
  className = '',
}: AppStoreBadgesProps) {
  const [showModal, setShowModal] = useState(false);

  const handleBadgeClick = (url?: string | null) => {
    if (url && url.trim() !== '') {
      window.open(url.trim(), '_blank', 'noopener,noreferrer');
    } else {
      setShowModal(true);
    }
  };

  const wrapperClass =
    layout === 'column'
      ? `flex flex-col gap-3 ${className}`
      : `flex flex-row flex-wrap gap-3 items-center ${className}`;

  return (
    <>
      <div className={wrapperClass}>
        {/* Google Play Badge */}
        <button
          id="btn-play-store-badge"
          onClick={() => handleBadgeClick(playStoreUrl)}
          aria-label="Get it on Google Play"
          className="transition-opacity hover:opacity-80 active:scale-95 focus:outline-none rounded-xl"
        >
          <GooglePlayBadge theme={theme} />
        </button>

        {/* Apple App Store Badge */}
        <button
          id="btn-app-store-badge"
          onClick={() => handleBadgeClick(appStoreUrl)}
          aria-label="Download on the App Store"
          className="transition-opacity hover:opacity-80 active:scale-95 focus:outline-none rounded-xl"
        >
          <AppStoreBadge theme={theme} />
        </button>
      </div>

      {/* Coming Soon Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full text-center space-y-6 animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-400" />
            </button>

            {/* Animated Emoji */}
            <div className="text-6xl animate-bounce">🚀</div>

            {/* Amharic + English */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                በጣም በቅርብ ቀን ይጠብቁ!
              </h3>
              <p className="text-base font-bold text-primary uppercase tracking-widest">
                Coming Soon
              </p>
              <p className="text-sm text-gray-400 font-medium">
                The mobile app is being prepared. Stay tuned for the official launch!
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-[#0F172A] text-white py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── SVG Badge Components ─────────────────────────────────────────── */

function GooglePlayBadge({ theme }: { theme: 'dark' | 'light' }) {
  const bg = theme === 'dark' ? '#000000' : '#FFFFFF';
  const text = theme === 'dark' ? '#FFFFFF' : '#000000';
  const border = theme === 'dark' ? 'none' : '1px solid #A6A6A6';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="148"
      height="44"
      viewBox="0 0 148 44"
      role="img"
      aria-label="Get it on Google Play"
      style={{ borderRadius: 8, border, display: 'block' }}
    >
      <rect width="148" height="44" rx="8" fill={bg} />
      {/* Google Play triangle icon (simplified coloured) */}
      <g transform="translate(10, 8)">
        <polygon points="0,0 0,28 14,14" fill="#EA4335" />
        <polygon points="14,14 0,28 14,22" fill="#FBBC04" />
        <polygon points="0,0 14,14 26,8" fill="#34A853" />
        <polygon points="14,14 26,8 26,20" fill="#4285F4" />
        <polygon points="14,14 26,20 14,22 0,28" fill="#FBBC04" />
      </g>
      {/* Text */}
      <text x="44" y="16" fontFamily="Arial, sans-serif" fontSize="9" fill={text} opacity="0.7">GET IT ON</text>
      <text x="44" y="31" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="bold" fill={text}>Google Play</text>
    </svg>
  );
}

function AppStoreBadge({ theme }: { theme: 'dark' | 'light' }) {
  const bg = theme === 'dark' ? '#000000' : '#FFFFFF';
  const text = theme === 'dark' ? '#FFFFFF' : '#000000';
  const border = theme === 'dark' ? 'none' : '1px solid #A6A6A6';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="148"
      height="44"
      viewBox="0 0 148 44"
      role="img"
      aria-label="Download on the App Store"
      style={{ borderRadius: 8, border, display: 'block' }}
    >
      <rect width="148" height="44" rx="8" fill={bg} />
      {/* Apple logo (simplified) */}
      <g transform="translate(12, 8)" fill={text}>
        <path d="M13.5 0C12 0 10.2 1 9.3 2.7 8.4 1 6.6 0 5.1 0 2.1 0 0 2.5 0 5.5c0 4.5 4.5 9 9.3 13 4.8-4 9.3-8.5 9.3-13C18.6 2.5 16.5 0 13.5 0z" />
      </g>
      {/* Text */}
      <text x="38" y="16" fontFamily="Arial, sans-serif" fontSize="9" fill={text} opacity="0.7">Download on the</text>
      <text x="38" y="31" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="bold" fill={text}>App Store</text>
    </svg>
  );
}
