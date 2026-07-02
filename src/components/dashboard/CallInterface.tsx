'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall, Heart, ShieldCheck, Loader2, Timer, MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CallInterfaceProps {
  matchProfile: any;
  onEndCall: () => void;
  isIncoming?: boolean;
  currentUserProfile?: any;
}

export default function CallInterface({ matchProfile, onEndCall, isIncoming = false, currentUserProfile }: CallInterfaceProps) {
  const [callState, setCallState] = useState<'incoming' | 'ringing' | 'connecting' | 'connected' | 'ended'>(
    isIncoming ? 'incoming' : 'ringing'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const MAX_CALL_DURATION = 30 * 60; // 30 minutes in seconds (premium)
  const FREE_AUDIO_LIMIT = 120; // 2 minutes (120 seconds) for free users
  const WARNING_TIME = 5 * 60; // 5 minutes warning for premium
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [callEndedDueToTimeout, setCallEndedDueToTimeout] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [freeTimeExhausted, setFreeTimeExhausted] = useState(false);
  const callStartTimeRef = useRef<number | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // In-Call Chat Overlay States
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Auth User on Mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  // Load subscription status for free/premium quota enforcement
  useEffect(() => {
    import('@/lib/subscription').then(({ getUserSubscriptionInfo }) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          getUserSubscriptionInfo(user.id).then((info: any) => {
            setIsPremiumUser(info?.tier === 'premium');
          });
        }
      });
    });
  }, []);

  // 2. Dispatch call invite to the match's signaling channel if we are the Caller
  useEffect(() => {
    if (!currentUser || isIncoming) return;

    const roomId = [currentUser.id, matchProfile.id].sort().join('_');
    const callerProfile = currentUserProfile || {
      id: currentUser.id,
      full_name: currentUser.email?.split('@')[0] || 'Beteseb User',
      avatar_url: ''
    };

    const matchSignalingChannel = supabase.channel(`user_signaling_${matchProfile.id}`);
    matchSignalingChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        matchSignalingChannel.send({
          type: 'broadcast',
          event: 'call_invite',
          payload: {
            callerProfile,
            roomId
          }
        });
        // Remove channel after sending invite successfully
        setTimeout(() => {
          supabase.removeChannel(matchSignalingChannel);
        }, 1000);
      }
    });
  }, [currentUser, isIncoming, matchProfile, currentUserProfile]);

  // 3. Timer for connected call duration with quota enforcement
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (callState === 'connected') {
      callStartTimeRef.current = Date.now();
      timer = setInterval(() => {
        setCallDuration(prev => {
          const next = prev + 1;

          // Free user: enforce 120s audio limit
          if (!isPremiumUser && next >= FREE_AUDIO_LIMIT) {
            const today = new Date().toISOString().split('T')[0];
            const key = `audio_used_${today}`;
            const existing = parseInt(localStorage.getItem(key) || '0', 10);
            localStorage.setItem(key, (existing + next).toString());
            setFreeTimeExhausted(true);
            setCallState('ended');
            setTimeout(() => onEndCall(), 3000);
          }

          // Premium user: show 5-minute warning
          if (next >= MAX_CALL_DURATION - WARNING_TIME) setShowTimeoutWarning(true);

          // Premium user: enforce 30-min max
          if (next >= MAX_CALL_DURATION) {
            setCallEndedDueToTimeout(true);
            setCallState('ended');
            setTimeout(() => {
              cleanupMedia();
              onEndCall();
            }, 3000);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState, isPremiumUser]);

  // 4. Initialize WebRTC and Signaling
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

        // Initialize Peer Connection with STUN + optional TURN
        const iceServers: RTCIceServer[] = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];

        // Add TURN server if configured (for production firewall traversal)
        const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
        const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
        const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
        if (turnUrl && turnUsername && turnCredential) {
          iceServers.push({
            urls: turnUrl,
            username: turnUsername,
            credential: turnCredential,
          });
        }

        const pc = new RTCPeerConnection({ iceServers });
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
            const { sender, offer, answer, candidate, reject, end } = payload.payload;
            if (sender === currentUser.id) return; // Skip own signals

            if (reject || end) {
              handleEndCall();
            } else if (offer) {
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

  // 5. In-Call Chat Messages fetch & Realtime postgres Changes listener
  useEffect(() => {
    if (!currentUser) return;

    if (showChat) {
      // Fetch historical chat logs
      supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${matchProfile.id}),and(sender_id.eq.${matchProfile.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) setChatMessages(data);
        });
    }

    // Subscribe to Postgres Insert events for new messages
    const chatChannel = supabase
      .channel('call_chat_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const msg = payload.new;
          if (msg.sender_id === matchProfile.id) {
            setChatMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [currentUser, matchProfile, showChat]);

  // Scroll chat scroll area to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, showChat]);

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

        // Build ICE server list with optional TURN (same config as caller)
        const acceptIceServers: RTCIceServer[] = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];
        const aTurnUrl = process.env.NEXT_PUBLIC_TURN_URL;
        const aTurnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
        const aTurnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
        if (aTurnUrl && aTurnUsername && aTurnCredential) {
          acceptIceServers.push({
            urls: aTurnUrl,
            username: aTurnUsername,
            credential: aTurnCredential,
          });
        }

        const pc = peerConnectionRef.current || new RTCPeerConnection({ iceServers: acceptIceServers });
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

        // Notify caller we are answer/connecting
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

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !currentUser) return;

    const messageContent = newChatMessage.trim();

    // 1. Phone & Email sharing detection
    const phoneRegex = /(?:\+?251|\b0)[\s-]*[97](?:[\s-]*\d){8}\b/;
    const digitSequenceRegex = /(?:\d[\s-]*){8,}/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

    if (phoneRegex.test(messageContent) || digitSequenceRegex.test(messageContent) || emailRegex.test(messageContent)) {
       alert("የደህንነት ደንብ፦ በጽሁፍ ስልክ ቁጥር ወይም ኢሜይል መለዋወጥ በቋሚነት የተከለከለ ነው።\n\nSecurity Rule: Exchanging phone numbers or emails in chat is prohibited.");
       return;
    }

    setSendingMessage(true);

    // 2. AI moderation check
    try {
      const response = await fetch(`/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      });
      const safety = await response.json();
      
      if (!safety.approved) {
        alert(`Blocked: ${safety.reason}`);
        setSendingMessage(false);
        return;
      }
    } catch (err) {
      console.error("AI Moderation failed in call chat, bypassing to fallback", err);
    }

    // 3. Save message to DB
    const msgData = {
      sender_id: currentUser.id,
      receiver_id: matchProfile.id,
      content: messageContent,
    };

    const { data, error } = await supabase.from('messages').insert(msgData).select().single();

    if (!error && data) {
      setChatMessages((prev) => [...prev, data]);
      setNewChatMessage('');
    }
    setSendingMessage(false);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col md:flex-row items-stretch text-white">
      
      {/* LEFT/MAIN CALL CONTAINER */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-8 relative overflow-hidden">
        {/* Mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_40%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_35%)] opacity-10" />

        {/* Header */}
        <div className="w-full max-w-md flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Heart size={20} className="fill-[#E2725B] text-[#E2725B]" />
            <span className="text-sm font-black uppercase tracking-widest text-white/50">Beteseb Secure Call</span>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 px-3.5 py-1.5 rounded-full text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
            <ShieldCheck size={12} /> P2P Encrypted
          </div>
        </div>

        {/* Video Display Area */}
        <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center space-y-6 z-10 relative">
          <div className="relative w-full aspect-[3/4] max-h-[48vh] rounded-[3.5rem] bg-[#1E293B] border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
            
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
              <div className="w-20 h-28 bg-[#334155] border border-white/20 rounded-2xl shadow-xl absolute bottom-4 right-4 overflow-hidden flex items-center justify-center animate-in zoom-in-95 duration-500 z-20">
                {isVideoOff ? (
                  <VideoOff size={16} className="text-white/30" />
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
          <div className="text-center space-y-1">
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white leading-none">
              {matchProfile.name || matchProfile.full_name}
            </h2>
            <p className="text-[9px] font-black text-[#E2725B] uppercase tracking-[0.2em] italic">
              {callState === 'incoming' && 'Incoming Call...'}
              {callState === 'ringing' && 'Ringing...'}
              {callState === 'connecting' && (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={12} className="animate-spin" /> Connecting secure P2P node...
                </span>
              )}
              {callState === 'connected' && (
                <span className="flex items-center justify-center gap-2">
                  Connected - {formatDuration(callDuration)}
                  {MAX_CALL_DURATION - callDuration <= WARNING_TIME && (
                    <span className="text-orange-400 animate-pulse text-xs ml-1 font-bold">
                      ({Math.floor((MAX_CALL_DURATION - callDuration) / 60)}m left)
                    </span>
                  )}
                </span>
              )}
              {callState === 'ended' && 'Call ended'}
            </p>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full max-w-md z-10 bg-white/5 border border-white/10 rounded-[3rem] p-4 flex justify-between items-center gap-3 animate-in slide-in-from-bottom-8 duration-500">
          {callState === 'incoming' ? (
            <div className="w-full flex justify-between gap-4 px-2">
              <button 
                onClick={handleRejectCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20"
              >
                <PhoneOff size={16} /> Reject
              </button>
              <button 
                onClick={handleAcceptCall}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/20"
              >
                <PhoneCall size={16} className="animate-bounce" /> Answer
              </button>
            </div>
          ) : (
            <>
              {/* Mute Mic */}
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-2xl border transition-all ${isMuted ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/15 hover:bg-white/10 text-white'}`}
                aria-label={isMuted ? "Unmute mic" : "Mute mic"}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* End Call */}
              <button 
                onClick={handleEndCall}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <PhoneOff size={16} /> End Call
              </button>

              {/* Toggle Video */}
              <button 
                onClick={toggleVideo}
                className={`p-4 rounded-2xl border transition-all ${isVideoOff ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/15 hover:bg-white/10 text-white'}`}
                aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
              >
                {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              {/* Toggle Chat in Call */}
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-2xl border transition-all ${showChat ? 'bg-[#E2725B]/20 border-[#E2725B] text-[#E2725B]' : 'bg-white/5 border-white/15 hover:bg-white/10 text-white'}`}
                aria-label="Toggle chat"
              >
                <MessageCircle size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* RIGHT SIDE CHAT DRAWER PANEL */}
      {showChat && (
        <div className="w-full md:w-[360px] bg-[#1E293B] border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[45vh] md:h-full z-20 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-bold text-xs tracking-widest uppercase">Direct Chat</span>
            </div>
            <button 
              onClick={() => setShowChat(false)} 
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Messages list */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                  No messages yet.<br/>Type below to begin chatting.
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-[1.25rem] px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender_id === currentUser?.id 
                      ? 'bg-[#E2725B] text-white rounded-tr-none' 
                      : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                  }`}>
                    {msg.content}
                    <div className="text-[8px] text-white/50 text-right mt-1 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Input form */}
          <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/10 flex gap-2">
            <input 
              type="text"
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#E2725B] text-white transition-colors placeholder:text-white/30"
            />
            <button 
              type="submit" 
              disabled={!newChatMessage.trim() || sendingMessage}
              className="bg-[#E2725B] hover:bg-[#E2725B]/90 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-[#E2725B]/20"
            >
              {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}

      {/* 30-Minute Timeout Warning Overlay */}
      {showTimeoutWarning && callState === 'connected' && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md text-white rounded-2xl px-6 py-4 text-center shadow-2xl border border-orange-500/30 max-w-xs">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Timer size={16} className="text-orange-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-orange-400">
              Time Limit Warning
            </span>
          </div>
          <p className="text-xs font-medium mb-3">
            Your call will end automatically in {Math.floor((MAX_CALL_DURATION - callDuration) / 60)} minutes.
          </p>
          <button
            onClick={() => setShowTimeoutWarning(false)}
            className="text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Free quota exhausted overlay */}
      {freeTimeExhausted && (
        <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-10 text-center space-y-4 max-w-xs text-[#0F172A]">
            <Timer size={40} className="text-orange-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-black italic">⏰ Free Limit Reached</h3>
            <p className="text-xs text-gray-500">Your free 2-minute call session has ended.</p>
            <p className="text-[10px] font-black text-[#E2725B] uppercase tracking-widest">Upgrade to Premium for unlimited calls</p>
          </div>
        </div>
      )}

      {/* Call Ended due to 30-min timeout (premium) */}
      {callEndedDueToTimeout && !freeTimeExhausted && (
        <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-10 text-center space-y-4 max-w-xs text-[#0F172A]">
            <Timer size={40} className="text-[#E2725B] mx-auto animate-bounce" />
            <h3 className="text-xl font-black italic">Time Limit Reached</h3>
            <p className="text-xs text-gray-500">Your 30-minute call session has ended.</p>
            <p className="text-[10px] font-black text-[#E2725B] uppercase tracking-widest">Upgrade to Premium for unlimited calls</p>
          </div>
        </div>
      )}
    </div>
  );
}
