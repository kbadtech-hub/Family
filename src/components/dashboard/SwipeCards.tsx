'use client';

import { useUI } from '@/context/UIContext';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Heart, 
  X, 
  Sparkles, 
  MapPin, 
  Star, 
  ShieldCheck, 
  MoreVertical,
  Undo,
  Zap,
  EyeOff,
  Crown,
  Gem,
  Award,
  Users
} from 'lucide-react';
import { calculateCompatibility } from '@/lib/compatibility';
import { supabase } from '@/lib/supabase';
import { getUserTier, calculateCompletionRate } from '@/lib/tiers';
import { toEthiopianDate, StarSignLabels } from '@/lib/abushakir';
import { maskNameToInitials } from '@/lib/vip';

interface SwipeCardsProps {
  userProfile: any;
  candidates: any[];
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  onViewProfile?: (candidate: any) => void;
  isPremium?: boolean;
}

export default function SwipeCards({ userProfile, candidates, onLike, onPass, onViewProfile, isPremium = false }: SwipeCardsProps) {
  const { showConfirm, showPrompt, showToast, showAlert } = useUI();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showCardMenu, setShowCardMenu] = useState(false);

  // VIP Photo Reveals lookup state
  const [revealedVipIds, setRevealedVipIds] = useState<Set<string>>(new Set());
  
  // Rewind log rollback cache
  const [swipeHistory, setSwipeHistory] = useState<{ index: number, id: string, action: 'like' | 'pass' }[]>([]);

  // AI Icebreaker state
  const [icebreakerText, setIcebreakerText] = useState<string | null>(null);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [ethDateStr, setEthDateStr] = useState('');

  const activeCandidate = candidates[currentIndex];

  // Load photo reveals on mount
  useEffect(() => {
    if (!userProfile?.id) return;
    const fetchReveals = async () => {
      try {
        const { data } = await supabase
          .from('vip_photo_reveals')
          .select('vip_id')
          .eq('viewer_id', userProfile.id);
        if (data) {
          setRevealedVipIds(new Set(data.map(r => r.vip_id)));
        }
      } catch (e) {
        console.error("Failed to fetch VIP reveals:", e);
      }
    };
    fetchReveals();

    // Setup Ethiopian Date for Icebreaker
    try {
      const today = new Date();
      const ethDate = toEthiopianDate(today);
      const monthsAm = [
        'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 
        'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
      ];
      setEthDateStr(`${monthsAm[(ethDate.month - 1) % 13]} ${ethDate.day}, ${ethDate.year} ዓ.ም`);
    } catch (e) {
      setEthDateStr('Meskerem 1, 2018');
    }
  }, [userProfile?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeCandidate) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStart.x;
    const diffY = touch.clientY - touchStart.y;
    setSwipeOffset({ x: diffX, y: diffY });

    if (diffX > 50) setSwipeDirection('right');
    else if (diffX < -50) setSwipeDirection('left');
    else setSwipeDirection(null);
  };

  const handleTouchEnd = () => {
    if (swipeOffset.x > 120) {
      triggerSwipe('right');
    } else if (swipeOffset.x < -120) {
      triggerSwipe('left');
    } else {
      setSwipeOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }
  };

  const triggerSwipe = (dir: 'left' | 'right') => {
    if (!activeCandidate) return;
    
    // Save to rollback history log
    setSwipeHistory(prev => [...prev, { index: currentIndex, id: activeCandidate.id, action: dir === 'right' ? 'like' : 'pass' }]);
    
    // Animate exit
    setSwipeOffset({ x: dir === 'right' ? 500 : -500, y: 0 });
    
    setTimeout(() => {
      if (dir === 'right') {
        onLike(activeCandidate.id);
      } else {
        onPass(activeCandidate.id);
      }
      
      setSwipeOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 250);
  };

  const handleRewind = () => {
    if (swipeHistory.length === 0) return;
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastSwipe.index);
    // Note: rolls back currentIndex so the candidate is swipable again
  };

  if (!activeCandidate) {
    return (
      <div className="w-full max-w-md mx-auto aspect-[3/4.2] empty-state-cinematic p-8 text-center space-y-5 rounded-[20px]">
        <div className="w-18 h-18 rounded-2xl bg-beteseb-coral/10 border border-beteseb-coral/20 flex items-center justify-center text-beteseb-coral shadow-inner">
          <Heart size={34} className="fill-beteseb-coral/20 text-beteseb-coral" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-foreground font-display tracking-tight">
            No More Matches Right Now
          </h3>
          <p className="text-beteseb-mist text-xs leading-relaxed max-w-xs mx-auto">
            You have explored all available candidates. New compatible profiles are curated daily based on your preferences.
          </p>
        </div>
        {swipeHistory.length > 0 && (
          <button 
            onClick={handleRewind}
            className="btn-secondary text-xs mt-2"
          >
            <Undo size={14} /> Rewind Last Swipe
          </button>
        )}
      </div>
    );
  }

  const matchPercent = calculateCompatibility(userProfile, activeCandidate);
  const candCompletionRate = calculateCompletionRate(activeCandidate);
  const candTier = getUserTier(activeCandidate, !!activeCandidate.has_vouched);

  // VIP Configuration Checking
  const isCandidateVip = activeCandidate.is_vip_member && 
    (!activeCandidate.vip_expires_at || new Date(activeCandidate.vip_expires_at) > new Date());
  
  const isGhostModeActive = isCandidateVip && activeCandidate.is_ghost_mode_active;
  const isAuthorized = userProfile?.id === activeCandidate.id || revealedVipIds.has(activeCandidate.id);
  const shouldBlur = isGhostModeActive && !isAuthorized;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'vip': return { label: 'VIP', color: 'bg-amber-500/20 text-amber-200 border-amber-400/40', icon: Crown };
      case 'diamond': return { label: 'Diamond', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40', icon: Gem };
      case 'platinum': return { label: 'Platinum', color: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40', icon: Star };
      case 'gold': return { label: 'Gold', color: 'bg-amber-400/20 text-amber-200 border-amber-300/40', icon: Award };
      case 'silver': return { label: 'Silver', color: 'bg-slate-300/20 text-slate-200 border-slate-300/40', icon: ShieldCheck };
      case 'bronze':
      default: return { label: 'Unverified', color: 'bg-white/10 text-white/80 border-white/20', icon: ShieldCheck };
    }
  };
  const badge = getTierBadge(candTier);
  const BadgeIcon = badge.icon;

  const showAge = activeCandidate.show_age !== false;
  const showCity = activeCandidate.show_city !== false;
  const showAbushakir = userProfile?.enable_abushakir !== false && activeCandidate.enable_abushakir !== false;

  // Cultural AI Icebreaker opener using Abushakir calendar & star sign details
  const triggerIcebreaker = () => {
    const starSignLabel = activeCandidate.star_sign 
      ? (StarSignLabels as Record<string, string>)[activeCandidate.star_sign] || activeCandidate.star_sign 
      : 'Star Sign';

    const openers = showAbushakir ? [
      `ሰላም ${shouldBlur ? 'እጩ' : activeCandidate.full_name}! የከዋክብት ምልክትዎ ${starSignLabel} መሆኑን አይቻለሁ። በዛሬው የኢትዮጵያ ቀን (${ethDateStr}) መሰረት በጣም ተኳሃኝ ነን!`,
      `Akkam! I noticed your star sign is ${starSignLabel}. Today on the Abushakir calendar is ${ethDateStr}, a perfect day to start our connection!`,
      `Did you know that according to Abushakir star charts, your sign ${starSignLabel} represents wonderful loyalty? Let's connect on this beautiful day of ${ethDateStr}!`
    ] : [
      `ሰላም ${shouldBlur ? 'እጩ' : activeCandidate.full_name}! ስለ ራስዎ የበለጠ ለመማር ጓጉቻለሁ።`,
      `Akkam! I'd love to connect and learn more about you.`,
      `Hello! I noticed we share some great matching preferences. Let's connect!`
    ];
    setIcebreakerText(openers[Math.floor(Math.random() * openers.length)]);
    setShowIcebreaker(true);
  };

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col items-center select-none">
      {/* Cards Stack Container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px) rotate(${swipeOffset.x * 0.05}deg)`,
          transition: swipeOffset.x === 0 ? 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
        }}
        className={`w-full aspect-[3/4.2] rounded-[20px] overflow-hidden shadow-2xl relative border group cursor-grab active:cursor-grabbing card-poster ${
          isCandidateVip ? 'bg-beteseb-navy border-beteseb-gold/50' : 'bg-beteseb-navy border-white/10'
        }`}
      >
        {/* Background Image with Unsplash fallback */}
        <Image 
          src={activeCandidate.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'} 
          alt={activeCandidate.full_name || 'Candidate'}
          fill
          className={`object-cover pointer-events-none transition-all duration-700 ${shouldBlur ? 'blur-[25px] scale-110' : 'blur-0'}`}
          priority
        />

        {/* Cinematic Poster Navy Fade Overlay */}
        <div className="card-poster-overlay" />

        {shouldBlur && (
          <div className="absolute inset-0 bg-beteseb-navy/60 flex flex-col items-center justify-center p-6 text-center z-15 backdrop-blur-[2px] pointer-events-none">
            <div className="w-11 h-11 bg-beteseb-gold/20 border border-beteseb-gold/40 rounded-2xl flex items-center justify-center text-beteseb-gold mb-2 animate-pulse shadow-sm">
              <EyeOff size={20} />
            </div>
            <p className="text-[10px] font-black uppercase text-beteseb-gold tracking-[0.25em]">Ghost Mode Active</p>
          </div>
        )}

        {/* Gender-specific crown frame around avatars for VIP profiles */}
        {isCandidateVip && (
          <div className={`absolute inset-0 border-[4px] pointer-events-none rounded-[20px] z-20 ${
            activeCandidate.gender === 'Male' 
              ? 'border-beteseb-gold/80 ring-2 ring-beteseb-gold/30 ring-inset' 
              : 'border-pink-400/80 ring-2 ring-pink-300/30 ring-inset'
          }`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 bg-beteseb-navy/95 border border-beteseb-gold/60 rounded-full shadow-md z-30">
              <Crown size={12} className="text-beteseb-gold fill-beteseb-gold/30" />
              <span className="text-[8px] font-black text-beteseb-gold uppercase tracking-widest">
                {activeCandidate.gender === 'Male' ? "King's Crown" : "Queen's Crown"}
              </span>
            </div>
          </div>
        )}

        {/* Legacy Royal Frame Overlay for non-VIP Diamond users */}
        {!isCandidateVip && candCompletionRate === 100 && candTier === 'diamond' && (
          <div className={`absolute inset-0 border-[4px] pointer-events-none rounded-[20px] z-10 ${
            activeCandidate.gender === 'Male' 
              ? 'border-beteseb-gold/80 ring-2 ring-beteseb-gold/40 ring-inset' 
              : 'border-pink-400/80 ring-2 ring-pink-300/40 ring-inset'
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-beteseb-navy/90 border border-beteseb-gold/40 rounded-full flex items-center justify-center shadow-lg">
              <Crown size={13} className="text-beteseb-gold fill-beteseb-gold/30" />
            </div>
          </div>
        )}

        {/* Visual Swipe Indicators */}
        {swipeDirection === 'right' && (
          <div className="absolute top-10 left-8 border-3 border-beteseb-coral text-white font-black text-xl uppercase tracking-widest px-5 py-1.5 rounded-2xl rotate-[-12deg] z-25 backdrop-blur-md bg-beteseb-coral/30 shadow-lg animate-pulse">
            INTEREST
          </div>
        )}
        {swipeDirection === 'left' && (
          <div className="absolute top-10 right-8 border-3 border-beteseb-mist text-white font-black text-xl uppercase tracking-widest px-5 py-1.5 rounded-2xl rotate-[12deg] z-25 backdrop-blur-md bg-beteseb-navy/50 shadow-lg">
            PASS
          </div>
        )}

        {/* Glassmorphic Top Overlay */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-25">
          <div className="bg-beteseb-navy/60 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-lg">
            <Sparkles size={13} className="text-beteseb-coral fill-beteseb-coral/40" />
            <span>{matchPercent}% Compatibility</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* VIP Dual Badge stack: Diamond badge + Golden VIP Tag */}
            {isCandidateVip ? (
              <div className="flex items-center gap-1.5">
                <div className="backdrop-blur-xl border border-cyan-400/40 px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-cyan-200 tracking-wider bg-cyan-500/20 shadow-lg flex items-center gap-1">
                  <Gem size={11} className="text-cyan-300" /> Diamond
                </div>
                <div className="backdrop-blur-xl border border-beteseb-gold/60 px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-beteseb-gold tracking-widest bg-beteseb-gold/20 shadow-lg flex items-center gap-1 animate-pulse">
                  <Crown size={11} className="text-beteseb-gold fill-beteseb-gold/40" /> VIP
                </div>
              </div>
            ) : (
              <div className={`backdrop-blur-xl border px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${badge.color}`}>
                <BadgeIcon size={11} />
                <span>{badge.label}</span>
              </div>
            )}

            {/* Guardian-Linked Identity Badge */}
            {activeCandidate.is_guardian_linked && (
              <div className="bg-beteseb-gold/20 backdrop-blur-xl border border-beteseb-gold/40 px-2.5 py-1 rounded-full text-[9px] font-black text-amber-200 uppercase tracking-wider flex items-center gap-1 shadow-lg" title="Guardian-Linked Identity">
                <Users size={11} className="text-beteseb-gold" />
                <span>Wali</span>
              </div>
            )}
            
            {/* Quick Safety Menu */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCardMenu(!showCardMenu);
                }}
                className="bg-beteseb-navy/60 backdrop-blur-xl border border-white/20 p-2 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-beteseb-navy/80 transition-colors"
                aria-label="Safety menu"
              >
                <MoreVertical size={16} />
              </button>
              
              {showCardMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-card rounded-2xl shadow-2xl z-30 overflow-hidden border border-border">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const reason = await showPrompt("Report User - Enter reason (abuse, explicit content, scam, other):", "abuse");
                      if (!reason) return;
                      const details = await showPrompt("Enter report details:") || "";
                      const { error } = await supabase.from('reports').insert({
                        reporter_id: userProfile.id,
                        reported_id: activeCandidate.id,
                        reason: ['abuse', 'explicit content', 'scam', 'other'].includes(reason) ? reason : 'other',
                        details
                      });
                      if (!error) {
                        alert("Report submitted successfully.");
                        setShowCardMenu(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted text-[11px] font-bold text-beteseb-coral flex items-center gap-2"
                  >
                    <ShieldCheck size={14} /> Report User
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (await showConfirm("Block User - Are you sure? They will disappear from your feed.")) {
                        const { error } = await supabase.from('blocks').insert({
                          blocker_id: userProfile.id,
                          blocked_id: activeCandidate.id
                        });
                        if (!error) {
                          alert("User blocked.");
                          setShowCardMenu(false);
                          window.location.reload();
                        }
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted text-[11px] font-bold text-red-500 flex items-center gap-2 border-t border-border"
                  >
                    <X size={14} /> Block User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic bottom info panel */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end min-h-[42%] text-white space-y-3 z-20">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight leading-none text-white drop-shadow-sm">
                {shouldBlur ? maskNameToInitials(activeCandidate.full_name) : (activeCandidate.full_name || 'Anonymous')}
              </h2>
              {showAge && activeCandidate.birth_date && (
                <span className="text-lg md:text-xl font-bold text-beteseb-gold">
                  {new Date().getFullYear() - new Date(activeCandidate.birth_date).getFullYear()}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-0.5">
              {showAbushakir && activeCandidate.star_sign && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-semibold tracking-wider flex items-center gap-1.5 border border-white/10 text-white/90">
                  <Star size={11} className="fill-beteseb-gold text-beteseb-gold" /> {activeCandidate.star_sign}
                </span>
              )}
              {showCity && activeCandidate.location && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-semibold tracking-wider flex items-center gap-1.5 border border-white/10 text-white/90">
                  <MapPin size={11} className="text-beteseb-coral" /> {typeof activeCandidate.location === 'string' ? activeCandidate.location : activeCandidate.location?.city || 'Addis Ababa'}
                </span>
              )}
            </div>
          </div>

          <p className={`text-xs text-white/80 leading-relaxed font-normal line-clamp-2 ${(!isPremium && !isCandidateVip) ? 'blur-sm select-none pointer-events-none' : ''}`}>
            &quot;{shouldBlur ? 'This VIP profile is in Ghost Mode.' : (activeCandidate.bio || 'Ready for a beautiful family journey.')}&quot;
          </p>
          {!isPremium && !isCandidateVip && (
            <p className="text-[9px] font-semibold text-beteseb-coral uppercase tracking-wider text-center leading-none">Upgrade Premium to Read Bio</p>
          )}

          {/* Action buttons inside the card for VIP candidates */}
          {isCandidateVip && (
            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerIcebreaker();
                }}
                className="flex-1 bg-gradient-to-r from-beteseb-gold to-amber-500 hover:from-amber-500 hover:to-beteseb-gold text-beteseb-navy font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
              >
                <Sparkles size={12} className="fill-beteseb-navy text-beteseb-navy" /> AI Icebreaker
              </button>
              <div className="px-3 py-2 bg-beteseb-navy/70 border border-beteseb-gold/40 text-beteseb-gold text-[9px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1">
                <ShieldCheck size={11} /> Elite Shimagle
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marriage-First Action Controller Buttons below card */}
      <div className="w-full flex items-center justify-between gap-3 mt-6 px-2">
        {/* Pass Button */}
        <button 
          onClick={() => triggerSwipe('left')}
          aria-label="Pass candidate"
          className="w-14 h-14 rounded-full bg-card border border-beteseb-mist/30 text-beteseb-mist hover:text-red-500 hover:border-red-400/40 hover:bg-red-50/10 shadow-md flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0"
          title="Pass"
        >
          <X size={24} />
        </button>
        
        {/* View Profile Button (Secondary Action) */}
        <button 
          onClick={() => {
            if (onViewProfile) {
              onViewProfile(activeCandidate);
            } else {
              triggerSwipe('right');
            }
          }}
          className="btn-secondary flex-1 py-3.5 text-xs tracking-wider"
          title="View Full Profile"
        >
          <span>View Profile</span>
        </button>

        {/* Express Interest Button (Primary CTA) */}
        <button 
          onClick={() => triggerSwipe('right')}
          aria-label="Express Interest"
          className="btn-primary flex-1 py-3.5 text-xs tracking-wider shadow-lg shadow-beteseb-coral/25"
          title="Express Interest"
        >
          <Heart size={16} className="fill-white" />
          <span>Express Interest</span>
        </button>

        {/* Rewind Button (if available) */}
        {swipeHistory.length > 0 && (
          <button 
            onClick={handleRewind}
            aria-label="Rewind last swipe"
            className="w-14 h-14 rounded-full bg-card border border-beteseb-gold/40 text-beteseb-gold hover:bg-beteseb-gold/10 shadow-md flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0"
            title="Rewind Last Swipe"
          >
            <Undo size={18} />
          </button>
        )}
      </div>

      {/* Glassmorphic Icebreaker Opener Modal */}
      {showIcebreaker && icebreakerText && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 text-center space-y-4 max-w-xs shadow-2xl relative">
            <div className="w-12 h-12 bg-amber-400/20 rounded-full flex items-center justify-center text-amber-300 mx-auto">
              <Sparkles size={20} className="fill-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Cultural Opener</h3>
              <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">Star Sign Match Maker</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-left select-all">
              {icebreakerText}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(icebreakerText);
                  alert('Copied to clipboard!');
                }}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider py-3 rounded-xl transition-all"
              >
                Copy Text
              </button>
              <button 
                onClick={() => setShowIcebreaker(false)}
                className="flex-1 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider py-3 rounded-xl hover:bg-amber-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

