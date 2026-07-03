'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, X, Sparkles, MapPin, Star, ShieldCheck } from 'lucide-react';
import { calculateCompatibility } from '@/lib/compatibility';

interface SwipeCardsProps {
  userProfile: any;
  candidates: any[];
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  isPremium?: boolean;
}

export default function SwipeCards({ userProfile, candidates, onLike, onPass, isPremium = false }: SwipeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const activeCandidate = candidates[currentIndex];

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
      </div>
    );
  }

  const matchPercent = calculateCompatibility(userProfile, activeCandidate);

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
        className="w-full aspect-[3/4.2] bg-accent rounded-[3.5rem] overflow-hidden shadow-2xl relative border border-white/10 group cursor-grab active:cursor-grabbing"
      >
        {/* Background Image with Unsplash fallback */}
        <Image 
          src={activeCandidate.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'} 
          alt={activeCandidate.full_name || 'Candidate'}
          fill
          className="object-cover pointer-events-none"
          priority
        />

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

        {/* Glassmorphic Top Overlay for Compatibility Score */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <div className="bg-primary/20 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-full text-white text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-lg">
            <Sparkles size={14} className="fill-white" />
            {matchPercent}% Compatibility
          </div>
          {activeCandidate.is_verified && (
            <div className="bg-white/20 backdrop-blur-xl border border-white/20 p-2.5 rounded-full text-white shadow-lg flex items-center justify-center">
              <ShieldCheck size={18} className="fill-primary" />
            </div>
          )}
        </div>

        {/* Dynamic bottom info panel */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-accent/90 via-accent/50 to-transparent flex flex-col justify-end min-h-[40%] text-white space-y-4">
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-black italic tracking-tighter leading-none">{activeCandidate.full_name || 'Anonymous'}</h2>
              {activeCandidate.birth_date && (
                <span className="text-xl font-bold opacity-80">
                  {new Date().getFullYear() - new Date(activeCandidate.birth_date).getFullYear()}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {activeCandidate.star_sign && (
                <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 border border-white/5">
                  <Star size={10} className="fill-primary" /> {activeCandidate.star_sign}
                </span>
              )}
              {activeCandidate.location && (
                <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 border border-white/5">
                  <MapPin size={10} /> {typeof activeCandidate.location === 'string' ? activeCandidate.location : activeCandidate.location?.city || 'Addis Ababa'}
                </span>
              )}
            </div>
          </div>

          <p className={`text-xs text-white/70 italic leading-relaxed font-medium line-clamp-2 ${!isPremium ? 'blur-sm select-none pointer-events-none' : ''}`}>
            &quot;{activeCandidate.bio || 'Ready for a beautiful family journey.'}&quot;
          </p>
          {!isPremium && (
            <p className="text-[8px] font-black text-primary uppercase tracking-widest italic text-center leading-none">Upgrade Premium to Read Bio</p>
          )}
        </div>
      </div>

      {/* Controller Buttons */}
      <div className="flex items-center justify-center gap-8 mt-8">
        <button 
          onClick={() => triggerSwipe('left')}
          aria-label="Pass candidate"
          className="w-16 h-16 rounded-full bg-white border border-gray-100 shadow-lg text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <X size={28} />
        </button>
        <button 
          onClick={() => triggerSwipe('right')}
          aria-label="Like candidate"
          className="w-20 h-20 rounded-full bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Heart size={34} className="fill-white" />
        </button>
      </div>
    </div>
  );
}
