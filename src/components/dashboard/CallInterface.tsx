'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall, Heart, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 1. Fetch Auth User on Mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  // 2. Timer for connected call duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // 3. Initialize WebRTC and Signaling
  useEffect(() => {
    if (!currentUser) return;

    // Room ID is a unique sorted combination of user IDs
    const roomId = [currentUser.id, matchProfile.id].sort().join('_');
    const channel = supabase.channel(`call_room_${roomId}`);
    channelRef.current = channel;

    const setupCall = async () => {
      try {
        // Access Local Devices
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Peer Connection (using public Google STUN server)
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;

        // Add Local Tracks to Peer Connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Set Remote Track Listener
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };

        // Send local ICE candidates to peer
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { sender: currentUser.id, candidate: event.candidate }
            });
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setCallState('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            handleEndCall();
          }
        };

        // Subscribe to Signaling Channel
        channel
          .on('broadcast', { event: 'signal' }, async (payload: any) => {
            const { sender, offer, answer, candidate } = payload.payload;
            if (sender === currentUser.id) return; // Skip own signals

            if (offer) {
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const localAnswer = await pc.createAnswer();
              await pc.setLocalDescription(localAnswer);
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { sender: currentUser.id, answer: localAnswer }
              });
              setCallState('connecting');
            } else if (answer) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              setCallState('connecting');
            } else if (candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error("Error adding received ICE candidate:", e);
              }
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && !isIncoming) {
              // Initiate call (Caller sends offer)
              setCallState('ringing');
              const localOffer = await pc.createOffer();
              await pc.setLocalDescription(localOffer);
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { sender: currentUser.id, offer: localOffer }
              });
            }
          });

      } catch (err) {
        console.error("WebRTC Setup Error (Camera/Mic blocked or not found):", err);
        setCallState('ended');
        setTimeout(onEndCall, 1500);
      }
    };

    if (callState !== 'incoming') {
      setupCall();
    }

    return () => {
      // Cleanup on unmount
      cleanupMedia();
    };
  }, [currentUser]);

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const handleAcceptCall = async () => {
    setCallState('connecting');
    // Start WebRTC initialization for incoming call
    if (currentUser) {
      const roomId = [currentUser.id, matchProfile.id].sort().join('_');
      const channel = channelRef.current || supabase.channel(`call_room_${roomId}`);
      channelRef.current = channel;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = peerConnectionRef.current || new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

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

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setCallState('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            handleEndCall();
          }
        };

        // Notify caller that we are ready/connecting
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { sender: currentUser.id, connecting: true }
        });

      } catch (err) {
        console.error("WebRTC Accept Setup Error:", err);
        handleRejectCall();
      }
    }
  };

  const handleRejectCall = () => {
    if (channelRef.current && currentUser) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { sender: currentUser.id, reject: true }
      });
    }
    cleanupMedia();
    setCallState('ended');
    setTimeout(onEndCall, 1000);
  };

  const handleEndCall = () => {
    if (channelRef.current && currentUser) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { sender: currentUser.id, end: true }
      });
    }
    cleanupMedia();
    setCallState('ended');
    setTimeout(onEndCall, 1000);
  };

  const handleEndAndReport = async () => {
    handleEndCall();
    if (currentUser) {
      await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        reported_id: matchProfile.id,
        reason: 'abuse',
        details: 'Flagged during active secure video/audio call'
      });
      await supabase.from('blocks').insert({
        blocker_id: currentUser.id,
        blocked_id: matchProfile.id
      });
      alert('Call ended. User has been blocked and reported.');
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col items-center justify-between p-8 md:p-12 text-white">
      {/* Mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_40%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_35%)] opacity-10" />

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Heart size={20} className="fill-primary text-primary" />
          <span className="text-sm font-black uppercase tracking-widest text-white/50">Beteseb Secure Call</span>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 px-3.5 py-1.5 rounded-full text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <ShieldCheck size={12} /> P2P Encrypted
        </div>
      </div>

      {/* Video display area */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center space-y-8 z-10 relative">
        <div className="relative w-full aspect-[3/4] max-h-[50vh] rounded-[3.5rem] bg-[#1E293B] border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
          
          {/* Remote Video Stream */}
          {callState === 'connected' && remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover" 
            />
          ) : (
            <Image 
              src={matchProfile.image || matchProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'} 
              alt={matchProfile.name || matchProfile.full_name}
              fill
              className={`object-cover transition-opacity duration-700 ${callState === 'connected' && isVideoOff ? 'opacity-40' : 'opacity-100'}`}
              priority
            />
          )}

          {callState === 'connected' && isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <VideoOff size={48} className="text-white/40" />
            </div>
          )}

          {/* Local Video Stream (PIP Window) */}
          {localStream && (
            <div className="w-24 h-36 bg-[#334155] border-2 border-white/20 rounded-2xl shadow-xl absolute bottom-4 right-4 overflow-hidden flex items-center justify-center animate-in zoom-in-95 duration-500 z-20">
              {isVideoOff ? (
                <VideoOff size={20} className="text-white/30" />
              ) : (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
        </div>

        {/* Call Info text */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white leading-none">{matchProfile.name || matchProfile.full_name}</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
            {callState === 'incoming' && 'Incoming Call...'}
            {callState === 'ringing' && 'Ringing...'}
            {callState === 'connecting' && (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Connecting secure P2P node...
              </span>
            )}
            {callState === 'connected' && `Connected - ${formatDuration(callDuration)}`}
            {callState === 'ended' && 'Call ended'}
          </p>
        </div>
      </div>

      {/* Controls */}
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
            {/* Mute Mic */}
            <button 
              onClick={toggleMute}
              className={`p-5 rounded-2xl border transition-all ${isMuted ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/15 hover:bg-white/10 text-white'}`}
              aria-label={isMuted ? "Unmute mic" : "Mute mic"}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* End Call */}
            <button 
              onClick={handleEndCall}
              className="px-5 py-5 bg-slate-700 hover:bg-slate-800 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <PhoneOff size={16} /> End Call
            </button>

            {/* End & Report */}
            <button 
              onClick={handleEndAndReport}
              className="px-5 py-5 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              ⚠️ End & Report
            </button>

            {/* Toggle Video */}
            <button 
              onClick={toggleVideo}
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
