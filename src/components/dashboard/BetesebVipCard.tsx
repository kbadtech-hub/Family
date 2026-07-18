'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  MapPin, 
  Star, 
  ShieldAlert, 
  Crown, 
  Undo, 
  Zap, 
  MessageCircle,
  HelpCircle,
  EyeOff
} from 'lucide-react';
import { toEthiopianDate, StarSignLabels } from '@/lib/abushakir';

interface BetesebVipCardProps {
  viewerProfile: any;
  candidate: any;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  onUndoLastSwipe?: () => void;
  hasLastSwipe?: boolean;
}

export default function BetesebVipCard({
  viewerProfile,
  candidate,
  onLike,
  onPass,
  onUndoLastSwipe,
  hasLastSwipe = false
}: BetesebVipCardProps) {
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const [showIcebreakerModal, setShowIcebreakerModal] = useState(false);
  const [ethDateStr, setEthDateStr] = useState('');

  // 1. Generate Ethiopian Date string using Abushakir framework on mount
  useEffect(() => {
    try {
      const today = new Date();
      const ethDate = toEthiopianDate(today);
      const monthsAm = [
        'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 
        'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
      ];
      const monthName = monthsAm[(ethDate.month - 1) % 13] || 'Meskerem';
      setEthDateStr(`${monthName} ${ethDate.day}, ${ethDate.year} ዓ.ም`);
    } catch (e) {
      setEthDateStr('Meskerem 1, 2018');
    }
  }, []);

  const isVip = candidate.is_vip_member;
  const isMale = candidate.gender === 'Male';
  const isGhost = candidate.is_photo_blurred; // Ghost Mode indicator from backend

  // 2. AI Icebreaker Generator: uses star signs and Abushakir calendar to generate cultural openers
  const generateIcebreaker = () => {
    const starSignLabel = candidate.star_sign 
      ? (StarSignLabels as Record<string, string>)[candidate.star_sign] || candidate.star_sign 
      : 'Star Sign';

    const openers = [
      `ሰላም ${candidate.full_name}! የዛሬውን የኢትዮጵያ ቀን (${ethDateStr}) አስመልክቶ የከዋክብት ምልክትዎ ${starSignLabel} መሆኑን አይቻለሁ። በባህላችን ይህ ጥሩ ተኳሃኝነትን ያሳያል። ውይይት እንጀምር?`,
      `Akkam, ${candidate.full_name}! According to the Abushakir calendar today is ${ethDateStr}. With your star sign being ${starSignLabel}, our vibes seem highly compatible!`,
      `ሰላም፥ ${candidate.full_name}! በቤተሰብ መተግበሪያ እጩዎች ውስጥ የእርስዎ መገለጫ ልዩ ትኩረት የሚስብ ነው። እንኳን ለዛሬው ቀን (${ethDateStr}) በሰላም አደረሰዎት እያልኩ መልካም ምኞቴን እገልጻለሁ።`,
      `Hey ${candidate.full_name}, did you know that under the Abushakir star chart, your sign ${starSignLabel} represents wonderful loyalty? Let's break the ice on this fine day of ${ethDateStr}!`
    ];

    const randomOpener = openers[Math.floor(Math.random() * openers.length)];
    setIcebreaker(randomOpener);
    setShowIcebreakerModal(true);
  };

  return (
    <div className="w-full max-w-md mx-auto aspect-[3/4.2] bg-slate-950 rounded-[3.5rem] overflow-hidden shadow-2xl relative border-2 border-amber-400/50 group">
      
      {/* 3. VIP Golden Sparkle Border / Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none z-10" />

      {/* 4. Avatar Image with Ghost Mode Blur Filter */}
      <div className="absolute inset-0 w-full h-full">
        <Image 
          src={candidate.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'} 
          alt={candidate.full_name || 'Candidate'}
          fill
          className={`object-cover pointer-events-none transition-all duration-700 ${
            isGhost ? 'blur-[25px] scale-110' : 'blur-0'
          }`}
          priority
        />
        {isGhost && (
          <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center z-10 backdrop-blur-[2px]">
            <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-300 mb-3 animate-pulse">
              <EyeOff size={22} />
            </div>
            <p className="text-[10px] font-black uppercase text-amber-300 tracking-[0.25em]">Ghost Mode Active</p>
            <p className="text-[9px] text-slate-300 font-medium max-w-xs mt-1">Photo is blurred for non-authorized users.</p>
          </div>
        )}
      </div>

      {/* 5. GENDER-SPECIFIC FRAMES (King's Crown for males, Queen's Crown for females) */}
      <div className={`absolute inset-0 border-[6px] pointer-events-none rounded-[3.5rem] z-20 ${
        isMale 
          ? 'border-amber-400/90 ring-4 ring-amber-300/40 ring-inset' 
          : 'border-pink-400/90 ring-4 ring-pink-300/40 ring-inset'
      }`}>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 drop-shadow-md">
          <div className="px-2 py-0.5 bg-slate-950/90 border border-amber-400/60 rounded-full flex items-center gap-1 shadow-md">
            <Crown size={12} className="text-amber-400 fill-amber-400/30 animate-pulse" />
            <span className="text-[7.5px] font-black text-amber-300 uppercase tracking-widest">
              {isMale ? "King's Crown" : "Queen's Crown"}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Asymmetric Top Info Panel (Dual Badges & Quick Controls) */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30">
        <div className="flex flex-col gap-1.5">
          {/* Dual Badge Stack: Diamond Icon + Golden VIP Tag */}
          <div className="flex items-center gap-1.5">
            <div className="bg-cyan-500/25 backdrop-blur-xl border border-cyan-500/30 px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <span>💎</span>
              <span>Diamond</span>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-300/60 px-3 py-1 rounded-full text-slate-950 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg animate-pulse">
              <Zap size={10} className="fill-slate-950" />
              <span>VIP</span>
            </div>
          </div>
        </div>

        {/* Undo Swiping log controller */}
        {hasLastSwipe && onUndoLastSwipe && (
          <button 
            onClick={onUndoLastSwipe}
            className="bg-slate-950/80 backdrop-blur-xl border border-amber-400/40 p-2.5 rounded-full text-amber-300 shadow-lg flex items-center justify-center hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all"
            title="Rewind Last Swipe"
          >
            <Undo size={16} />
          </button>
        )}
      </div>

      {/* 7. Bottom Info & Action Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-col justify-end min-h-[42%] text-white space-y-4 z-20">
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-amber-200">
              {candidate.full_name || 'Anonymous'}
            </h2>
            {candidate.birth_date && (
              <span className="text-xl font-bold text-amber-300">
                {new Date().getFullYear() - new Date(candidate.birth_date).getFullYear()}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {candidate.star_sign && (
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8.5px] font-black tracking-widest uppercase flex items-center gap-1 text-slate-300">
                <Star size={9} className="fill-amber-400 text-amber-400" /> 
                {candidate.star_sign}
              </span>
            )}
            {candidate.location && (
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8.5px] font-black tracking-widest uppercase flex items-center gap-1 text-slate-300">
                <MapPin size={9} className="text-amber-400" /> 
                {typeof candidate.location === 'string' ? candidate.location : candidate.location?.city || 'Addis Ababa'}
              </span>
            )}
          </div>
        </div>

        {/* Bio or VIP Masked Bio */}
        <p className="text-xs text-slate-300 italic leading-relaxed font-medium line-clamp-2">
          &quot;{candidate.bio || 'Seeking a premium family connection.'}&quot;
        </p>

        {/* Action Tray */}
        <div className="flex items-center gap-3 pt-1">
          {/* AI Icebreaker Trigger */}
          <button 
            onClick={generateIcebreaker}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 hover:scale-[1.03] transition-all"
          >
            <Sparkles size={12} className="fill-slate-950" />
            AI Icebreaker
          </button>

          {/* Quick Matchmaker Queue Status indicator */}
          <div className="bg-white/5 border border-white/10 text-amber-300 text-[8px] font-black uppercase tracking-wider px-3.5 py-3 rounded-xl flex items-center gap-1">
            <span>🛡️ Elite Queue</span>
          </div>
        </div>
      </div>

      {/* 8. Glassmorphic Icebreaker Modal */}
      {showIcebreakerModal && icebreaker && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 text-center space-y-4 max-w-xs shadow-2xl relative">
            <div className="w-12 h-12 bg-amber-400/20 rounded-full flex items-center justify-center text-amber-300 mx-auto">
              <Sparkles size={20} className="fill-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Cultural Opener</h3>
              <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">{candidate.full_name}&apos;s Star Sign Match</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-left select-all">
              {icebreaker}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(icebreaker);
                  alert('Copied to clipboard!');
                }}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider py-3 rounded-xl transition-all"
              >
                Copy Text
              </button>
              <button 
                onClick={() => setShowIcebreakerModal(false)}
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
