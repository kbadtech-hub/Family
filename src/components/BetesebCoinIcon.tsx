import React from 'react';

export default function BetesebCoinIcon({ className = "w-4 h-4 inline-block align-middle" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))' }}
    >
      {/* Golden Coin Base */}
      <circle cx="50" cy="50" r="46" fill="url(#goldGradient)" stroke="#D4AF37" strokeWidth="4" />
      {/* Outer Rim Ring */}
      <circle cx="50" cy="50" r="38" stroke="#F0C243" strokeWidth="2" strokeDasharray="6 4" />
      {/* Inner Circle */}
      <circle cx="50" cy="50" r="30" fill="url(#innerGold)" stroke="#B8860B" strokeWidth="1" />
      {/* Miniature Beteseb Styled Heart (Logo) */}
      <path 
        d="M50 32C45 25 33 25 33 35C33 46 50 63 50 63C50 63 67 46 67 35C67 25 55 25 50 32Z" 
        fill="#FF6B6B" 
        stroke="#E63946" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      {/* Mini Sparkle or Highlight */}
      <circle cx="36" cy="36" r="4" fill="#FFFFFF" opacity="0.8" />
      
      {/* Gradients */}
      <defs>
        <radialGradient id="goldGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="70%" stopColor="#F1A80A" />
          <stop offset="100%" stopColor="#C98A00" />
        </radialGradient>
        <linearGradient id="innerGold" x1="0.2" y1="0.2" x2="0.8" y2="0.8">
          <stop offset="0%" stopColor="#F9D976" />
          <stop offset="100%" stopColor="#E9B646" />
        </linearGradient>
      </defs>
    </svg>
  );
}
