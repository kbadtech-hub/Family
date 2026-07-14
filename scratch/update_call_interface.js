const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'CallInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add new icons to imports: Phone, PhoneOff, Users, AlertTriangle, ShieldAlert
content = content.replace(
  "import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall, Heart, ShieldCheck, Loader2 } from 'lucide-react';",
  "import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall, Heart, ShieldCheck, Loader2, Phone, Users, AlertTriangle, ShieldAlert, X } from 'lucide-react';"
);

// 2. Add local refs and states inside CallInterface
const callStateHook = "const [callState, setCallState] = useState<'incoming' | 'ringing' | 'connecting' | 'connected' | 'ended'>(\n    isIncoming ? 'incoming' : 'ringing'\n  );";

const callStateHookReplacement = `const [callState, setCallState] = useState<'incoming' | 'ringing' | 'connecting' | 'connected' | 'ended'>(
    isIncoming ? 'incoming' : 'ringing'
  );
  const [showDeclineTemplates, setShowDeclineTemplates] = useState(false);
  const [aiViolationActive, setAiViolationActive] = useState(false);
  const [aiViolationMessage, setAiViolationMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const localVideoRefFull = useRef<HTMLVideoElement>(null);
  const ringAudioRef = useRef<AudioContext | null>(null);
  const callConnectedRef = useRef(false);`;

content = content.replace(callStateHook, callStateHookReplacement);

// Keep track of connection status in ref
content = content.replace(
  "setCallState('connected');",
  "setCallState('connected');\n            callConnectedRef.current = true;"
);

// 3. Set local stream on both video refs in setupCall
content = content.replace(
  `        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }`,
  `        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (localVideoRefFull.current) {
          localVideoRefFull.current.srcObject = stream;
        }`
);

// Set local stream on both video refs in handleAcceptCall
content = content.replace(
  `        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }`,
  `        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (localVideoRefFull.current) {
          localVideoRefFull.current.srcObject = stream;
        }`
);

// 4. Implement Web Audio Ringing and Vibrations useEffect
const ringtoneAudioContextSetup = `  // Web Audio Ringing Tones and Vibration simulation
  useEffect(() => {
    let ringInterval: any;
    let vibInterval: any;

    const startRingingSound = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ringAudioRef.current = ctx;
        
        const playTone = () => {
          if (!ringAudioRef.current || ringAudioRef.current.state === 'closed') return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.5);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        };
        
        playTone();
        ringInterval = setInterval(playTone, 2000);
      } catch (e) {
        console.error(e);
      }
    };

    const startIncomingRingtone = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ringAudioRef.current = ctx;
        
        const playIncomingTone = () => {
          if (!ringAudioRef.current || ringAudioRef.current.state === 'closed') return;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.frequency.setValueAtTime(480, ctx.currentTime);
          osc2.frequency.setValueAtTime(440, ctx.currentTime);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.4, ctx.currentTime + 1.2);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.5);
          osc2.stop(ctx.currentTime + 1.5);
        };
        
        playIncomingTone();
        ringInterval = setInterval(playIncomingTone, 3000);
        
        if (navigator.vibrate) {
          navigator.vibrate([1000, 1000, 1000]);
          vibInterval = setInterval(() => {
            navigator.vibrate([1000, 1000, 1000]);
          }, 3000);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (callState === 'ringing') {
      startRingingSound();
    } else if (callState === 'incoming') {
      startIncomingRingtone();
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (vibInterval) clearInterval(vibInterval);
      if (ringAudioRef.current) {
        ringAudioRef.current.close().catch(() => {});
      }
    };
  }, [callState]);`;

// Insert the ringtone useEffect before the first useEffect in the file (fetch Auth User)
content = content.replace(
  "  // 1. Fetch Auth User and Profile limits on Mount",
  ringtoneAudioContextSetup + "\n\n  // 1. Fetch Auth User and Profile limits on Mount"
);

// 5. Add decline-with-text and missed call logging helpers
const callHelpers = `  const logMissedCall = async () => {
    if (!currentUser || isIncoming || callConnectedRef.current) return;
    const content = isVideo ? '[MISSED_VIDEO_CALL]' : '[MISSED_AUDIO_CALL]';
    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: matchProfile.id,
      content: content,
      is_read: false
    });
  };

  const handleDeclineWithText = async (text: string) => {
    if (currentUser) {
      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: matchProfile.id,
        content: text,
        is_read: false
      });
    }
    handleRejectCall();
  };`;

// Insert call helpers right before handleRejectCall
content = content.replace("  const handleRejectCall = () => {", callHelpers + "\n\n  const handleRejectCall = () => {");

// Trigger logMissedCall when hanging up/cleanup
content = content.replace(
  "  const handleRejectCall = () => {",
  "  const handleRejectCall = () => {\n    logMissedCall();"
);
content = content.replace(
  "  const handleEndCall = () => {",
  "  const handleEndCall = () => {\n    logMissedCall();"
);

// 6. Support busy signal in signaling listener
content = content.replace(
  "const { sender, offer, answer, candidate } = payload.payload;",
  "const { sender, offer, answer, candidate, busy, reject, end } = payload.payload;"
);

content = content.replace(
  "if (offer) {",
  `if (busy) {
              setIsBusy(true);
              setCallState('ended');
              setTimeout(onEndCall, 3000);
              return;
            } else if (reject || end) {
              setCallState('ended');
              setTimeout(onEndCall, 1000);
              return;
            } else if (offer) {`
);

// 7. On-Device AI Content Moderation frame analyser loop
const aiModerationLoop = `  // On-Device AI Content Moderation frame analyzer loop
  useEffect(() => {
    if (callState !== 'connected' || !isVideo || aiViolationActive) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const runModerationCheck = async () => {
      const videoEl = remoteVideoRef.current;
      if (!videoEl || !ctx || videoEl.readyState < 2) return;

      canvas.width = 120;
      canvas.height = 160;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      let skinPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        // Standard skin tone rules
        if (r > 95 && g > 40 && b > 20 && (max - min) > 15 && Math.abs(r - g) > 15 && r > g && r > b) {
          skinPixels++;
        }
      }
      
      const skinRatio = skinPixels / (canvas.width * canvas.height);
      
      // If skin ratio exceeds 50%, trigger attire/nudity violation
      if (skinRatio > 0.50) {
        setAiViolationActive(true);
        
        const amMsg = "እባክዎ ተገቢውን አለባበስ ይልበሱ። የመተግበሪያውን መመሪያዎች መጣስ መለያዎ እንዳይዘጋ ያደርጋል።";
        const enMsg = "Please dress appropriately. Violating Beteseb policies may result in account termination.";
        setAiViolationMessage(navigator.language.startsWith('am') ? amMsg : enMsg);
        
        // Disable local video tracks instantly to blackout stream
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => t.enabled = false);
        }
        setIsVideoOff(true);

        // Save report log to Supabase
        if (currentUser) {
          await supabase.from('reports').insert({
            reporter_id: matchProfile.id,
            reported_id: currentUser.id,
            reason: 'explicit content',
            details: \`AI Content Moderation flagged excessive skin exposure (\${(skinRatio*100).toFixed(1)}%) during video call.\`
          });
        }

        // Send hangup signal and terminate call after 4 seconds
        setTimeout(() => {
          handleEndCall();
        }, 4000);
      }
    };

    const interval = setInterval(runModerationCheck, 5000);
    return () => clearInterval(interval);
  }, [callState, isVideo, aiViolationActive, currentUser]);`;

content = content.replace(
  "  const toggleMute = () => {",
  aiModerationLoop + "\n\n  const toggleMute = () => {"
);

// 8. Update UI: local camera preview in full screen on calling state
content = content.replace(
  `          {/* Remote Video Stream */}
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
              className={\`object-cover transition-opacity duration-700 \${callState === 'connected' && isVideoOff ? 'opacity-40' : 'opacity-100'}\`}
              priority
            />
          )}`,
  `          {/* Video Stream / Previews */}
          {aiViolationActive ? (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center space-y-4 z-30">
              <ShieldAlert size={48} className="text-red-500 animate-pulse" />
              <p className="text-sm font-bold text-red-500">{aiViolationMessage}</p>
            </div>
          ) : callState === 'connected' && remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover" 
            />
          ) : (isVideo && localStream) ? (
            <video 
              ref={localVideoRefFull} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          ) : (
            <Image 
              src={matchProfile.image || matchProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'} 
              alt={matchProfile.name || matchProfile.full_name}
              fill
              className={\`object-cover transition-opacity duration-700 \${callState === 'connected' && isVideoOff ? 'opacity-40' : 'opacity-100'}\`}
              priority
            />
          )}`
);

// Update Call Info text for busy state
content = content.replace(
  `            {callState === 'connected' && \`Connected - \${formatDuration(callDuration)}\`}
            {callState === 'ended' && 'Call ended'}`,
  `            {callState === 'connected' && \`Connected - \${formatDuration(callDuration)}\`}
            {callState === 'ended' && (isBusy ? 'User is on another line (ስልክ መስመር ላይ ናቸው)' : 'Call ended')}`
);

// Render Decline-with-text template popups on Callee Incoming screen
content = content.replace(
  `          <div className="w-full flex justify-between gap-6 px-4">
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
          </div>`,
  `          <div className="w-full flex flex-col gap-3 px-4 relative">
            <div className="flex justify-between gap-4">
              <button 
                onClick={handleRejectCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/25"
              >
                <PhoneOff size={16} /> Decline
              </button>
              <button 
                onClick={handleAcceptCall}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/25"
              >
                <PhoneCall size={16} className="animate-bounce" /> Accept
              </button>
            </div>
            
            <button
              onClick={() => setShowDeclineTemplates(true)}
              className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle size={14} /> Send Decline Text / በፅሁፍ መልስ
            </button>

            {/* Decline Templates Drawer */}
            {showDeclineTemplates && (
              <div className="absolute inset-x-0 bottom-full mb-3 bg-[#1E293B] rounded-3xl p-5 border border-white/10 z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                <p className="text-[9px] font-black uppercase text-white/50 tracking-widest text-center mb-3">Decline templates / የፅሁፍ መልሶች</p>
                <div className="space-y-2">
                  {[
                    "አሁን አልተመቸኝም፣ ቆይቼ እደውላለሁ።",
                    "ስብሰባ ላይ ነኝ።",
                    "ቤት ስደርስ እደውላለሁ።",
                    "በፅሁፍ ብቻ ማውራት እንችላለን?"
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleDeclineWithText(tpl)}
                      className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all border border-white/5"
                    >
                      💬 {tpl}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowDeclineTemplates(false)}
                  className="w-full mt-3 py-2 text-[10px] font-black uppercase text-red-400 hover:text-red-300"
                >
                  Cancel / ሰርዝ
                </button>
              </div>
            )}
          </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated CallInterface.tsx with calling tones, video preview, decline templates, call waiting, and skin tone AI moderation!");
