'use client';

import React from 'react';
import { Shield, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

export type TrustTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export function getTrustTier(profile: any, hasVouch: boolean = false): TrustTier {
  if (!profile) return 'Bronze';
  const isPremium = profile.is_premium || profile.payment_status === 'approved';
  const isVerified = profile.is_verified || profile.verification_status === 'verified';
  
  if (isVerified && (profile.is_vouched || hasVouch) && isPremium) return 'Diamond';
  if (isVerified && (profile.is_vouched || hasVouch)) return 'Platinum';
  if (isVerified) return 'Gold';
  if (profile.username || profile.email_verified) return 'Silver';
  return 'Bronze';
}

export function getProfileCompletion(profile: any, hasGuardian: boolean = false, hasVouch: boolean = false): number {
  if (!profile) return 60;
  let score = 60; // Base signup score
  if (profile.avatar_url && !profile.avatar_url.includes('unsplash')) score += 10;
  if (profile.bio && profile.bio.length >= 100) score += 10;
  if (profile.is_verified || profile.verification_status === 'verified') score += 10;
  if (hasGuardian || profile.guardian_id) score += 10;
  return Math.min(100, score);
}

interface TrustBadgeProps {
  tier: TrustTier;
  locale?: string;
}

export function TrustBadge({ tier, locale }: TrustBadgeProps) {
  const getBadgeDetails = () => {
    switch (tier) {
      case 'Diamond':
        return {
          label: locale === 'am' ? 'ዳይመንድ' : 'Diamond (High-Trust Seal)',
          bg: 'bg-black text-white border border-slate-700',
          icon: <Award className="w-3.5 h-3.5 text-white" />
        };
      case 'Platinum':
        return {
          label: locale === 'am' ? 'ፕላቲኒየም' : 'Platinum',
          bg: 'bg-slate-900 text-slate-100 border border-slate-600',
          icon: <Shield className="w-3.5 h-3.5 text-slate-200" />
        };
      case 'Gold':
        return {
          label: locale === 'am' ? 'ጎልደን' : 'Gold Verified',
          bg: 'bg-slate-800 text-slate-200 border border-slate-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
        };
      case 'Silver':
        return {
          label: locale === 'am' ? 'ሲልቨር' : 'Silver Verified',
          bg: 'bg-slate-100 text-slate-800 border border-slate-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
        };
      case 'Bronze':
      default:
        return {
          label: locale === 'am' ? 'ብሮንዝ' : 'Bronze (Unverified)',
          bg: 'bg-slate-50 text-slate-400 border border-slate-200',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const details = getBadgeDetails();

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${details.bg}`}>
      {details.icon}
      <span>{details.label}</span>
    </div>
  );
}

interface AvatarFrameProps {
  gender: string;
  completion: number;
  tier: TrustTier;
  children: React.ReactNode;
}

export function AvatarFrame({ gender, completion, tier, children }: AvatarFrameProps) {
  const isHighestTier = completion === 100 && (tier === 'Gold' || tier === 'Platinum' || tier === 'Diamond');

  if (!isHighestTier) {
    return <div className="relative">{children}</div>;
  }

  // Display crown frames for 100% completed highest tiers
  return (
    <div className="relative p-1.5">
      {/* Crown Banner border */}
      <div className="absolute inset-0 rounded-[2.5rem] border-2 border-black animate-pulse" />
      {children}
      
      {/* Crown Icon Overlay */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md border border-slate-700">
        <span>👑</span>
        <span>{gender === 'Female' ? 'Queen' : 'King'}</span>
      </div>
    </div>
  );
}
