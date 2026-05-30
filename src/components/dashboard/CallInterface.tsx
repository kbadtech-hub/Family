'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, PhoneCall, Heart, ShieldCheck, Loader2 } from 'lucide-react';

interface CallInterfaceProps {
  matchProfile: any;
  onEndCall: () => void;
  isIncoming?: boolean;
}

export default function CallInterface({ matchProfile, onEndCall, isIncoming = false }: CallInterfaceProps) {
  const [callState, setCallState] = useState<'incoming' | 'ringing' | 'connecting' | 'connected' | 'ended'>(
    isIncoming ? 'incoming' : 'ringing'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (callState === 'ringing') {
      const timer = setTimeout(() => setCallState('connecting'), 3000);
      return () => clearTimeout(timer);
    }
    if (callState === 'connecting') {
      const timer = setTimeout(() => setCallState('connected'), 2000);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  const handleAcceptCall = () => {
    setCallState('connecting');
  };

  const handleRejectCall = () => {
    setCallState('ended');
    setTimeout(onEndCall, 1000);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col items-center justify-between p-8 md:p-12 text-white">
      {/* Sleek background mesh gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_40%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_35%)] opacity-10" />

      {/* Header section */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Heart size={20} className="fill-primary text-primary" />
          <span className="text-sm font-black uppercase tracking-widest text-white/50">Beteseb Secure Call</span>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 px-3.5 py-1.5 rounded-full text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <ShieldCheck size={12} /> Peer-to-Peer
        </div>
      </div>

      {/* Main video/profile section */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center space-y-8 z-10">
        <div className="relative">
          {/* Main Remote User Image/Video */}
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] bg-[#1E293B] border-4 border-white/10 shadow-2xl relative overflow-hidden flex items-center justify-center">
            <Image 
              src={matchProfile.image || matchProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'} 
              alt={matchProfile.name || matchProfile.full_name}
              fill
              className={`object-cover transition-opacity duration-700 ${callState === 'connected' && isVideoOff ? 'opacity-40' : 'opacity-100'}`}
            />
            {callState === 'connected' && isVideoOff && (
              <VideoOff size={36} className="text-white/40 z-10" />
            )}
          </div>
          
          {/* Small Local User PIP Camera (Connected State Only) */}
          {callState === 'connected' && (
            <div className="w-20 h-28 bg-[#334155] border-2 border-white/20 rounded-2xl shadow-xl absolute -bottom-4 -right-4 overflow-hidden flex items-center justify-center animate-in zoom-in-95 duration-500">
              {isVideoOff ? (
                <VideoOff size={16} className="text-white/30" />
              ) : (
                <Image 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200" 
                  alt="You" 
                  fill 
                  className="object-cover" 
                />
              )}
            </div>
          )}
        </div>

        {/* Text information */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white leading-none">{matchProfile.name || matchProfile.full_name}</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
            {callState === 'incoming' && 'Incoming Audio/Video Call...'}
            {callState === 'ringing' && 'Ringing...'}
            {callState === 'connecting' && (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Connecting secure node...
              </span>
            )}
            {callState === 'connected' && `Connected - ${formatDuration(callDuration)}`}
            {callState === 'ended' && 'Call ended'}
          </p>
        </div>
      </div>

      {/* Footer controls section */}
      <div className="w-full max-w-md z-10 bg-white/5 border border-white/10 rounded-[3rem] p-6 backdrop-blur-xl flex justify-between items-center animate-in slide-in-from-bottom-8 duration-500">
        {callState === 'incoming' ? (
          <div className="w-full flex justify-between gap-6 px-4">
            <button 
              onClick={handleRejectCall}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
              <PhoneOff size={18} /> Reject
            </button>
            <button 
              onClick={handleAcceptCall}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/20"
            >
              <PhoneCall size={18} className="animate-bounce" /> Answer
            </button>
          </div>
        ) : (
          <>
            {/* Mute Control */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-5 rounded-2xl border transition-all ${isMuted ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/15 hover:bg-white/10 text-white'}`}
              aria-label={isMuted ? "Unmute mic" : "Mute mic"}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* End Call Control */}
            <button 
              onClick={() => {
                setCallState('ended');
                setTimeout(onEndCall, 1000);
              }}
              className="px-8 py-5 bg-red-500 hover:bg-red-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <PhoneOff size={18} /> End Call
            </button>

            {/* Video Control */}
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-5 rounded-2xl border transition-all ${isVideoOff ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/15 hover:bg-white/10 text-white'}`}
              aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
            >
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
