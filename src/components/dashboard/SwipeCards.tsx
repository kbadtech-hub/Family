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
  EyeOff
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
  isPremium?: boolean;
}

export default function SwipeCards({ userProfile, candidates, onLike, onPass, isPremium = false }: SwipeCardsProps) {
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
      <div className="w-full max-w-md mx-auto aspect-[3/4] bg-white rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
          <Heart className="text-primary fill-primary/20" size={36} />
        </div>
        <h3 className="text-2xl font-black text-accent italic">No More Matches</h3>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider max-w-xs leading-relaxed">
          You have swiped through all available candidates. Check back later for new compatibility recommendations!
        </p>
        {swipeHistory.length > 0 && (
          <button 
            onClick={handleRewind}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md"
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
      case 'vip': return { label: 'VIP', color: 'bg-amber-50/20 text-amber-200 border-amber-500/30', emoji: '👑' };
      case 'diamond': return { label: 'Diamond', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30', emoji: '💎' };
      case 'platinum': return { label: 'Platinum', color: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30', emoji: '🌟' };
      case 'gold': return { label: 'Gold', color: 'bg-amber-500/20 text-amber-200 border-amber-500/30', emoji: '🥇' };
      case 'silver': return { label: 'Silver', color: 'bg-slate-400/20 text-slate-200 border-slate-400/30', emoji: '🥈' };
      case 'bronze':
      default: return { label: 'Unverified', color: 'bg-orange-850/20 text-orange-200 border-orange-850/30', emoji: '🥉' };
    }
  };
  const badge = getTierBadge(candTier);

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
          transition: swipeOffset.x === 0 ? 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
        }}
        className={`w-full aspect-[3/4.2] rounded-[3.5rem] overflow-hidden shadow-2xl relative border group cursor-grab active:cursor-grabbing ${
          isCandidateVip ? 'bg-slate-950 border-amber-400/50' : 'bg-accent border-white/10'
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

        {shouldBlur && (
          <div className="absolute inset-0 bg-slate-950/45 flex flex-col items-center justify-center p-6 text-center z-15 backdrop-blur-[2px] pointer-events-none">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-300 mb-2 animate-pulse">
              <EyeOff size={18} />
            </div>
            <p className="text-[9px] font-black uppercase text-amber-300 tracking-[0.25em]">Ghost Mode Active</p>
          </div>
        )}

        {/* Gender-specific crown frame around avatars for VIP profiles */}
        {isCandidateVip && (
          <div className={`absolute inset-0 border-[6px] pointer-events-none rounded-[3.5rem] z-20 ${
            activeCandidate.gender === 'Male' 
              ? 'border-amber-400/90 ring-4 ring-amber-300/40 ring-inset' 
              : 'border-pink-400/90 ring-4 ring-pink-300/40 ring-inset'
          }`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 bg-slate-950/95 border border-amber-400/60 rounded-full shadow-md z-30">
              <span>👑</span>
              <span className="text-[7.5px] font-black text-amber-300 uppercase tracking-widest">
                {activeCandidate.gender === 'Male' ? "King's Crown" : "Queen's Crown"}
              </span>
            </div>
          </div>
        )}

        {/* Legacy Royal Frame Overlay (Phase 4.5) for non-VIP Diamond users */}
        {!isCandidateVip && candCompletionRate === 100 && candTier === 'diamond' && (
          <div className={`absolute inset-0 border-8 pointer-events-none rounded-[3.5rem] z-10 ${
            activeCandidate.gender === 'Male' 
              ? 'border-amber-400/90 ring-4 ring-amber-300/50 ring-inset' 
              : 'border-pink-400/90 ring-4 ring-pink-300/50 ring-inset'
          }`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg animate-bounce">
              👑
            </div>
          </div>
        )}

        {/* Visual Swipe Indicators */}
        {swipeDirection === 'right' && (
          <div className="absolute top-12 left-12 border-4 border-green-500 text-green-500 font-black text-2xl uppercase tracking-widest px-6 py-2 rounded-2xl rotate-[-12deg] z-20 backdrop-blur-md bg-green-500/10">
            LIKE
          </div>
        )}
        {swipeDirection === 'left' && (
          <div className="absolute top-12 right-12 border-4 border-red-500 text-red-500 font-black text-2xl uppercase tracking-widest px-6 py-2 rounded-2xl rotate-[12deg] z-20 backdrop-blur-md bg-red-500/10">
            NOPE
          </div>
        )}

        {/* Glassmorphic Top Overlay */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-25">
          <div className="bg-primary/20 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-full text-white text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-lg">
            <Sparkles size={14} className="fill-white" />
            {matchPercent}% Compatibility
          </div>
          
          <div className="flex items-center gap-2">
            {/* VIP Dual Badge stack: Diamond badge + Golden VIP Tag */}
            {isCandidateVip ? (
              <div className="flex items-center gap-1">
                <div className="backdrop-blur-xl border border-cyan-500/30 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-cyan-200 tracking-wider bg-cyan-500/10 shadow-lg">
                  💎 Diamond
                </div>
                <div className="backdrop-blur-xl border border-amber-300/50 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-amber-300 tracking-widest bg-gradient-to-r from-amber-500/20 to-yellow-400/20 shadow-lg animate-pulse">
                  ⚡ VIP
                </div>
              </div>
            ) : (
              <div className={`backdrop-blur-xl border px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${badge.color}`}>
                <span>{badge.emoji}</span>
                <span>{badge.label}</span>
              </div>
            )}

            {/* Guardian-Linked Identity Badge */}
            {activeCandidate.is_guardian_linked && (
              <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 px-3 py-1.5 rounded-full text-[9px] font-black text-amber-200 uppercase tracking-wider flex items-center gap-1 shadow-lg" title="Guardian-Linked Identity">
                <span>👨‍👩‍👦</span>
                <span>Wali</span>
              </div>
            )}
            
            {/* Quick Menu */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCardMenu(!showCardMenu);
                }}
                className="bg-black/40 backdrop-blur-xl border border-white/25 p-2.5 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-black/60 transition-colors"
                aria-label="Safety menu"
              >
                <MoreVertical size={18} />
              </button>
              
              {showCardMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-border">
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
                    className="w-full text-left px-4 py-2.5 hover:bg-muted text-[10px] font-bold text-amber-700 flex items-center gap-1.5"
                  >
                    ⚠️ Report User
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
                    className="w-full text-left px-4 py-2.5 hover:bg-muted text-[10px] font-bold text-red-600 flex items-center gap-1.5 border-t border-muted"
                  >
                    🚫 Block User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic bottom info panel */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end min-h-[40%] text-white space-y-4 z-20">
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-black italic tracking-tighter leading-none">
                {shouldBlur ? maskNameToInitials(activeCandidate.full_name) : (activeCandidate.full_name || 'Anonymous')}
              </h2>
              {showAge && activeCandidate.birth_date && (
                <span className="text-xl font-bold opacity-80 text-amber-300">
                  {new Date().getFullYear() - new Date(activeCandidate.birth_date).getFullYear()}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {showAbushakir && activeCandidate.star_sign && (
                <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 border border-white/5 text-slate-350">
                  <Star size={10} className="fill-amber-400 text-amber-400" /> {activeCandidate.star_sign}
                </span>
              )}
              {showCity && activeCandidate.location && (
                <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 border border-white/5 text-slate-355">
                  <MapPin size={10} className="text-amber-400" /> {typeof activeCandidate.location === 'string' ? activeCandidate.location : activeCandidate.location?.city || 'Addis Ababa'}
                </span>
              )}
            </div>
          </div>

          <p className={`text-xs text-slate-300 italic leading-relaxed font-medium line-clamp-2 ${(!isPremium && !isCandidateVip) ? 'blur-sm select-none pointer-events-none' : ''}`}>
            &quot;{shouldBlur ? 'This VIP profile is in Ghost Mode.' : (activeCandidate.bio || 'Ready for a beautiful family journey.')}&quot;
          </p>
          {!isPremium && !isCandidateVip && (
            <p className="text-[8px] font-black text-primary uppercase tracking-widest italic text-center leading-none">Upgrade Premium to Read Bio</p>
          )}

          {/* Action buttons inside the card for VIP candidates */}
          {isCandidateVip && (
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerIcebreaker();
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Sparkles size={12} className="fill-slate-950" /> AI Icebreaker
              </button>
              <div className="px-3 py-2 bg-white/5 border border-white/10 text-amber-300 text-[8px] font-black uppercase tracking-wider rounded-xl">
                🛡️ Elite Shimagle Queue
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controller Buttons below card */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button 
          onClick={() => triggerSwipe('left')}
          aria-label="Pass candidate"
          className="w-16 h-16 rounded-full bg-white border border-gray-150 shadow-lg text-red-500 flex items-center justify-center hover:scale-115 active:scale-90 transition-all"
        >
          <X size={28} />
        </button>
        
        {swipeHistory.length > 0 && (
          <button 
            onClick={handleRewind}
            aria-label="Rewind last swipe"
            className="w-12 h-12 rounded-full bg-slate-900 border border-amber-400/40 text-amber-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md"
          >
            <Undo size={18} />
          </button>
        )}

        <button 
          onClick={() => triggerSwipe('right')}
          aria-label="Like candidate"
          className="w-20 h-20 rounded-full bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-115 active:scale-90 transition-all"
        >
          <Heart size={34} className="fill-white" />
        </button>
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

