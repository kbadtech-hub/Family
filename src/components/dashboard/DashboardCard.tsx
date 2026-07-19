'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, X, UserPlus, Gift, MoreVertical, Sparkles, MapPin, Star } from 'lucide-react';
import { calculateCompatibility } from '@/lib/compatibility';
import { getUserTier } from '@/lib/tiers';

interface DashboardCardProps {
  currentUser: any;
  candidate: any;
  locale: string;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onSendFriendRequest: (id: string) => void;
  onSendGift: (candidate: any) => void;
  onCardClick: (id: string) => void;
  friendshipStatus: string | null;
}

export default function DashboardCard({
  currentUser,
  candidate,
  locale,
  onLike,
  onDislike,
  onSendFriendRequest,
  onSendGift,
  onCardClick,
  friendshipStatus
}: DashboardCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const matchPercent = calculateCompatibility(currentUser, candidate);
  const candTier = getUserTier(candidate, !!candidate.has_vouched);

  // Collect photos (avatar_url + gallery_urls)
  const photos = [
    candidate.avatar_url,
    ...(candidate.gallery_urls || [])
  ].filter(Boolean);

  // Automatic photo rotation every 7 seconds
  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [photos.length]);

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'diamond':
        return { label: 'Diamond Label', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30', emoji: '💎' };
      case 'platinum':
        return { label: 'Platinum Label', color: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30', emoji: '🌟' };
      case 'gold':
        return { label: 'Golden Label', color: 'bg-amber-500/20 text-amber-200 border-amber-500/30', emoji: '🥇' };
      case 'silver':
        return { label: 'Silver Label', color: 'bg-slate-400/20 text-slate-200 border-slate-400/30', emoji: '🥈' };
      case 'bronze':
      default:
        return { label: 'Bronze Label', color: 'bg-orange-850/20 text-orange-200 border-orange-850/30', emoji: '🥉' };
    }
  };

  const badge = getTierLabel(candTier);
  const isAm = locale === 'am';

  // Calculate age from birth_date
  let age: number | null = null;
  if (candidate.birth_date) {
    age = new Date().getFullYear() - new Date(candidate.birth_date).getFullYear();
  }

  // Respect target user's visibility toggles
  const showAge = candidate.show_age !== false;
  const showCity = candidate.show_city !== false;
  const allowFriendRequests = candidate.allow_friend_requests !== false;

  const activePhoto = photos[currentPhotoIndex] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';

  return (
    <div 
      onClick={() => onCardClick(candidate.id)}
      className="w-full max-w-md mx-auto bg-accent rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/10 group cursor-pointer aspect-[3/4.2] transition-transform duration-500 hover:scale-[1.01]"
    >
      {/* Background Image with smooth transitions */}
      <div className="absolute inset-0 bg-accent">
        <Image 
          src={activePhoto} 
          alt={candidate.full_name || 'Candidate'}
          fill
          className="object-cover pointer-events-none select-none transition-all duration-1000"
          priority
        />
      </div>

      {/* Royal Frame Overlay */}
      {candidate.completion_rate === 100 && candTier === 'diamond' && (
        <div className={`absolute inset-0 border-8 pointer-events-none rounded-[3rem] z-10 ${
          candidate.gender === 'Male' 
            ? 'border-amber-400/90 ring-4 ring-amber-300/50 ring-inset' 
            : 'border-pink-400/90 ring-4 ring-pink-300/50 ring-inset'
        }`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg animate-bounce">
            👑
          </div>
        </div>
      )}

      {/* Top-right: 3-dot menu only — badges moved to metadata row below */}
      <div className="absolute top-6 right-6 z-10">
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="bg-black/45 backdrop-blur-xl border border-white/25 p-2.5 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Safety menu"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-border">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onSendGift(candidate);
                }}
                className="w-full text-left px-4 py-3 hover:bg-muted text-xs font-bold text-primary flex items-center gap-2"
              >
                <Gift size={14} />
                <span>{isAm ? 'ስጦታ ለመላክ' : 'Send Gift'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-accent/95 via-accent/60 to-transparent flex flex-col justify-end min-h-[40%] text-white space-y-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black italic tracking-tighter leading-none">{candidate.full_name || 'Anonymous'}</h2>
            {showAge && age !== null && (
              <span className="text-lg font-bold opacity-80">
                {age}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {candidate.star_sign && (
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-bold tracking-widest uppercase flex items-center gap-1 border border-white/5">
                <Star size={8} className="fill-primary" /> {candidate.star_sign}
              </span>
            )}
            {showCity && (
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-bold tracking-widest uppercase flex items-center gap-1 border border-white/5">
                <MapPin size={8} /> {typeof candidate.location === 'string' ? candidate.location : candidate.location?.city || 'Addis Ababa'}
              </span>
            )}
            {/* ── Match % badge — moved from top overlay ── */}
            <span className="px-3 py-1 bg-primary/30 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1 border border-primary/20 text-white">
              <Sparkles size={8} className="fill-white" />
              {matchPercent}% {isAm ? 'ተዛማጅ' : 'Match'}
            </span>
            {/* ── Tier badge — moved from top overlay ── */}
            <span className={`px-3 py-1 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1 border ${badge.color}`}>
              <span className="text-[9px]">{badge.emoji}</span>
              <span>{badge.label}</span>
            </span>
          </div>
        </div>

        {/* Lock paywall teaser text */}
        <p className="text-[10px] text-primary/80 font-black uppercase tracking-widest italic text-center pt-2 border-t border-white/5">
          {isAm ? 'መገለጫውን ለመክፈት ይጫኑ' : 'Click card to view details'}
        </p>

        {/* Card Controls inside card footer */}
        <div className="flex items-center justify-center gap-4 pt-2" onClick={(e) => e.stopPropagation()}>
          {/* Dislike / Pass */}
          <button 
            onClick={() => onDislike(candidate.id)}
            aria-label="Pass candidate"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-md"
          >
            <X size={20} className="text-red-400" />
          </button>

          {/* Like */}
          <button 
            onClick={() => onLike(candidate.id)}
            aria-label="Like candidate"
            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Heart size={24} className="fill-white" />
          </button>

          {/* Friend Request (only if allowed) */}
          {allowFriendRequests && (
            <button 
              onClick={() => onSendFriendRequest(candidate.id)}
              disabled={friendshipStatus === 'pending' || friendshipStatus === 'accepted'}
              aria-label="Send Friend Request"
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
            >
              <UserPlus size={20} className="text-primary" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
