'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLocale } from 'next-intl';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, 
  ShieldCheck, Loader2, Users, Calendar, Clock, AlertTriangle 
} from 'lucide-react';
import { getIceServers } from '@/lib/turn';

function CounselingSessionContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const bookingId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Anti-Screenshot Protection
  const [isScreenBlurred, setIsScreenBlurred] = useState(false);

  // 1. Load Session User & Booking Details
  useEffect(() => {
    const initSession = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: bookingData } = await supabase
          .from('counselor_bookings')
          .select('*, profiles:user_id(full_name, email)')
          .eq('id', bookingId)
          .single();

        if (bookingData) {
          setBooking(bookingData);
        }
      }
      setLoading(false);
    };

    initSession();
  }, [bookingId]);

  // 2. Anti-Screenshot Keyboard Listener & Focus Protection
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      // PrintScreen key is 'PrintScreen'
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        setIsScreenBlurred(true);
        alert('SECURITY WARNING: Screenshots and screen recording are strictly prohibited in counselor rooms to preserve confidentiality!');
      }
    };

    const handleWindowBlur = () => {
      // Blur screen if user shifts window focus (prevents screen capture grab)
      setIsScreenBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsScreenBlurred(false);
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // 3. WebRTC Call Setup
  const startSessionCall = async () => {
    if (!currentUser || !booking) return;
    setCallState('connecting');

    const roomId = `counseling_session_${booking.id}`;
    const channel = supabase.channel(roomId);
    channelRef.current = channel;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: getIceServers()
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { sender: currentUser.id, candidate: event.candidate }
          });
        }
      };

      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (payload.sender === currentUser.id) return;

        if (payload.sdp) {
          if (payload.sdp.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { sender: currentUser.id, sdp: answer }
            });
            setCallState('connected');
          } else if (payload.sdp.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallState('connected');
          }
        } else if (payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // If candidate, send offer first
          if (currentUser.id === booking.user_id) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { sender: currentUser.id, sdp: offer }
            });
          }
        }
      });

    } catch (err: any) {
      alert('Failed to connect call devices: ' + err.message);
      setCallState('idle');
    }
  };

  // Timer
  useEffect(() => {
    let timer: any;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const endSessionCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    setCallState('ended');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-[3rem] border border-muted shadow-2xl space-y-4">
          <p className="text-red-500 font-bold text-lg">Counselor Session Not Found</p>
          <a href="/dashboard" className="btn-primary inline-block px-8 py-3 rounded-full text-xs">Return Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden transition-all duration-300 ${
      isScreenBlurred ? 'blur-2xl pointer-events-none select-none' : ''
    }`}>
      {/* Dynamic Security Watermarks */}
      <div className="absolute inset-0 z-50 pointer-events-none grid grid-cols-3 grid-rows-4 opacity-[0.03] text-[10px] font-black uppercase text-accent tracking-widest select-none select-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center rotate-[-25deg]">
            CONFIDENTIAL - {currentUser?.email} - {new Date().toLocaleDateString()}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="max-w-4xl w-full mx-auto bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-muted shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[9px] text-primary font-black uppercase tracking-widest block">Secure Counseling Room</span>
            <h2 className="text-lg font-bold text-accent">Session with {booking.expert_name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2"><Calendar size={16} /> {booking.scheduled_date}</div>
          <div className="flex items-center gap-2"><Clock size={16} /> {booking.scheduled_time}</div>
        </div>
      </header>

      {/* Video Call Interface */}
      <main className="flex-1 max-w-5xl w-full mx-auto my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center z-10">
        {/* Local Stream */}
        <div className="relative aspect-video bg-accent rounded-[2.5rem] border border-muted overflow-hidden shadow-xl flex items-center justify-center">
          <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} />
          {isVideoOff && (
            <div className="text-white text-center space-y-2">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto"><VideoOff size={28} /></div>
              <p className="text-xs uppercase font-bold tracking-widest">Your Video is Off</p>
            </div>
          )}
          <span className="absolute bottom-6 left-6 px-4 py-1.5 bg-black/50 text-white text-[10px] font-black rounded-full uppercase tracking-wider">You (Candidate)</span>
        </div>

        {/* Remote Stream */}
        <div className="relative aspect-video bg-accent rounded-[2.5rem] border border-muted overflow-hidden shadow-xl flex items-center justify-center">
          {callState === 'connected' && remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="text-white text-center space-y-4 p-6">
              {callState === 'connecting' ? (
                <>
                  <Loader2 size={36} className="animate-spin text-primary mx-auto" />
                  <p className="text-xs uppercase font-bold tracking-widest">Connecting Advisor Stream...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto"><Users size={28} /></div>
                  <p className="text-xs uppercase font-bold tracking-widest">{booking.expert_name}</p>
                  <p className="text-[10px] text-white/55 max-w-xs leading-relaxed">Join session call to start secure video consultation.</p>
                </>
              )}
            </div>
          )}
          <span className="absolute bottom-6 left-6 px-4 py-1.5 bg-black/50 text-white text-[10px] font-black rounded-full uppercase tracking-wider">{booking.expert_name} (Advisor)</span>
        </div>
      </main>

      {/* Control Buttons */}
      <footer className="max-w-xl w-full mx-auto bg-white/80 backdrop-blur-md p-6 rounded-full border border-muted shadow-2xl flex justify-center items-center gap-6 z-10">
        {callState === 'idle' ? (
          <button 
            onClick={startSessionCall}
            className="px-10 py-4 bg-primary text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            Start Counseling Call
          </button>
        ) : (
          <>
            <button 
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-red-500 text-white' : 'bg-muted/60 text-accent hover:bg-muted'
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button 
              onClick={endSessionCall}
              disabled={callState === 'ended'}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <PhoneOff size={16} /> End Session
            </button>

            <button 
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isVideoOff ? 'bg-red-500 text-white' : 'bg-muted/60 text-accent hover:bg-muted'
              }`}
            >
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

import FeatureGate from '@/components/dashboard/FeatureGate';

export default function CounselingSessionPage() {
  const locale = useLocale();
  return (
    <FeatureGate featureKey="counseling" featureTitle="Counseling Sessions (የጋብቻ ካውንስሊንግ)" locale={locale}>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Loader2 size={36} className="animate-spin text-primary" />
        </div>
      }>
        <CounselingSessionContent />
      </Suspense>
    </FeatureGate>
  );
}
