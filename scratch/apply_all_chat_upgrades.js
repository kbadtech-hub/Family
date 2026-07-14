const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'ChatView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF for consistent matching
content = content.replace(/\r\n/g, '\n');

// 1. Add lucide-react imports
const importTarget = `import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  CheckCheck,
  User,
  Heart,
  Lightbulb,
  Languages,
  Eye,
  EyeOff,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Users,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  UserX,
  Bell,
  Check,
  CheckCircle2,
  X as CloseIcon,
  Sparkles,
  Loader2,
  Gift,
  Lock,
  Coins
} from 'lucide-react';`;

const importReplacement = `import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  CheckCheck,
  User,
  Heart,
  Lightbulb,
  Languages,
  Eye,
  EyeOff,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Users,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  UserX,
  Bell,
  Check,
  CheckCircle2,
  X as CloseIcon,
  Sparkles,
  Loader2,
  Gift,
  Lock,
  Coins,
  ChevronLeft,
  Plus,
  ArrowLeft,
  Plane
} from 'lucide-react';`;

if (content.includes(importTarget)) {
  content = content.replace(importTarget, importReplacement);
  console.log("✅ Imports updated");
} else {
  console.log("❌ Imports not matched");
}

// 2. Add activeCallMatchRef State & Ref
const refTarget = `  const scrollRef = useRef<HTMLDivElement>(null);`;
const refReplacement = `  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCallMatchRef = useRef<any>(null);`;

if (content.includes(refTarget)) {
  content = content.replace(refTarget, refReplacement);
  console.log("✅ State & Refs added");
} else {
  console.log("❌ State target not matched");
}

// 3. Add incoming call listener and activeCallMatchRef syncing
const useEffectTarget = `  useEffect(() => {
    const init = async () => {`;

const useEffectReplacement = `  // Call reference syncing and global incoming call listener
  useEffect(() => {
    activeCallMatchRef.current = activeCallMatch;
  }, [activeCallMatch]);

  useEffect(() => {
    if (!currentUser) return;

    const callChannel = supabase.channel(\`user_calls_\${currentUser.id}\`);

    const playBeepBeep = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {}
    };

    callChannel
      .on('broadcast', { event: 'incoming_call' }, (payload) => {
        const { callerProfile, isVideo, roomId } = payload.payload;
        
        if (activeCallMatchRef.current) {
          playBeepBeep();
          const peerRoomId = roomId;
          const peerRoomChannel = supabase.channel(peerRoomId);
          peerRoomChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              peerRoomChannel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { sender: currentUser.id, busy: true }
              });
            }
          });
          return;
        }

        setIsCallVideo(isVideo);
        setActiveCallMatch(callerProfile);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
    };
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {`;

if (content.includes(useEffectTarget)) {
  content = content.replace(useEffectTarget, useEffectReplacement);
  console.log("✅ Incoming call useEffect added");
} else {
  console.log("❌ useEffect target not matched");
}

// 4. Update fetchMessages to mark messages as read
const fetchMessagesBlock = `    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(\`and(sender_id.eq.\${currentUser.id},receiver_id.eq.\${selectedMatch.id}),and(sender_id.eq.\${selectedMatch.id},receiver_id.eq.\${currentUser.id})\`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };`;

const fetchMessagesWithReadUpdate = `    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(\`and(sender_id.eq.\${currentUser.id},receiver_id.eq.\${selectedMatch.id}),and(sender_id.eq.\${selectedMatch.id},receiver_id.eq.\${currentUser.id})\`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);

      // Mark unread messages from the other user as read
      await supabase.from('messages')
        .update({ is_read: true })
        .eq('sender_id', selectedMatch.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    };`;

if (content.includes(fetchMessagesBlock)) {
  content = content.replace(fetchMessagesBlock, fetchMessagesWithReadUpdate);
  console.log("✅ fetchMessages read updates added");
} else {
  console.log("❌ fetchMessages not matched");
}

// 5. Realtime message handler read update
const realtimeIncomingMsg = `          if (msg.sender_id === selectedMatch.id) {
            setMessages((prev) => [...prev, msg]);`;

const realtimeIncomingMsgWithReadUpdate = `          if (msg.sender_id === selectedMatch.id) {
            setMessages((prev) => [...prev, msg]);
            // Auto-mark as read since we're already in this chat room
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id);`;

if (content.includes(realtimeIncomingMsg)) {
  content = content.replace(realtimeIncomingMsg, realtimeIncomingMsgWithReadUpdate);
  console.log("✅ Realtime message receiver auto-read update added");
} else {
  console.log("❌ realtimeIncomingMsg not matched");
}

// 6. Subscribe to message UPDATE changes
const subBlock = `    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch, currentUser]);`;

const subBlockWithUpdate = `    // Also subscribe to READ status updates
    const updateChannel = supabase
      .channel(\`realtime:messages:updates:\${currentUser.id}\`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: \`sender_id=eq.\${currentUser.id}\`,
      }, (payload) => {
        const updatedMsg = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [selectedMatch, currentUser]);`;

if (content.includes(subBlock)) {
  content = content.replace(subBlock, subBlockWithUpdate);
  console.log("✅ Realtime updates subscription added");
} else {
  console.log("❌ subBlock not matched");
}

// 7. Custom Chat Bubble Rendering (Missed calls, voice notes, checkmarks, etc.)
const msgContentBlock = `                    <div className={\`
                      px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm
                      \${msg.sender_id === currentUser?.id 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-white text-gray-600 rounded-tl-none border border-muted'
                      }
                    \`}>
                      {msg.translations?.[locale] || msg.content}
                      
                      {/* Translation Toggle */}
                      <button 
                        onClick={() => handleTranslate(msg.id, locale)}
                        className={\`absolute -bottom-6 \${msg.sender_id === currentUser?.id ? 'right-0' : 'left-0'} p-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all hover:text-primary\`}
                      >
                        <Languages size={10} /> {msg.translations?.[locale] ? t('original') : t('translate', { lang: locale })}
                      </button>
                    </div>
                    <div className={\`flex items-center gap-2 mt-2 px-2 text-[10px] \${msg.sender_id === currentUser?.id ? 'justify-end text-gray-400' : 'justify-start text-gray-400'}\`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_id === currentUser?.id && <CheckCheck size={14} className="text-primary" />}
                    </div>`;

const msgContentBlockNew = `                    {/* Missed Call System Messages */}
                    {(msg.content === '[MISSED_AUDIO_CALL]' || msg.content === '[MISSED_VIDEO_CALL]') ? (
                      <div className="px-5 py-3 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-3 text-xs font-bold text-orange-600">
                        {msg.content === '[MISSED_VIDEO_CALL]' ? '📹' : '📞'}
                        <span>
                          {msg.sender_id === currentUser?.id
                            ? (locale === 'am' ? 'ጥሪዎ ሳይቀበሉ ቀርቷል' : 'No Answer')
                            : (locale === 'am' ? 'ያልተቀበሉ ጥሪ' : 'Missed Call')}
                        </span>
                        <span className="ml-auto text-orange-300 font-normal">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ) : msg.content.startsWith('[VOICE_NOTE]') ? (
                      <div className={\`px-4 py-3 rounded-[2rem] shadow-sm \${msg.sender_id === currentUser?.id ? 'bg-accent text-white rounded-tr-none' : 'bg-white text-gray-600 rounded-tl-none border border-muted'}\`}>
                        <audio controls src={msg.content.replace('[VOICE_NOTE]', '').replace('[/VOICE_NOTE]', '')} className="h-8 w-44 max-w-full" />
                      </div>
                    ) : msg.content.startsWith('[IMAGE]') ? (
                      <div className="rounded-[2rem] overflow-hidden shadow-sm max-w-[220px]">
                        <img src={msg.content.replace('[IMAGE]', '').replace('[/IMAGE]', '')} alt="Shared image" className="w-full h-auto object-cover rounded-[2rem]" />
                      </div>
                    ) : (
                      <div className={\`
                        px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm
                        \${msg.sender_id === currentUser?.id 
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-white text-gray-600 rounded-tl-none border border-muted'
                        }
                      \`}>
                        {msg.translations?.[locale] || msg.content}
                        
                        {/* Translation Toggle */}
                        <button 
                          onClick={() => handleTranslate(msg.id, locale)}
                          className={\`absolute -bottom-6 \${msg.sender_id === currentUser?.id ? 'right-0' : 'left-0'} p-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all hover:text-primary\`}
                        >
                          <Languages size={10} /> {msg.translations?.[locale] ? t('original') : t('translate', { lang: locale })}
                        </button>
                      </div>
                    )}

                    {/* Delivery status */}
                    <div className={\`flex items-center gap-2 mt-2 px-2 text-[10px] \${msg.sender_id === currentUser?.id ? 'justify-end text-gray-400' : 'justify-start text-gray-400'}\`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_id === currentUser?.id && (
                        msg.is_read
                          ? <CheckCheck size={14} className="text-primary" /> // Read - brand orange
                          : <CheckCheck size={14} className="text-gray-300" /> // Delivered - gray
                      )}
                    </div>`;

if (content.includes(msgContentBlock)) {
  content = content.replace(msgContentBlock, msgContentBlockNew);
  console.log("✅ Message content bubble custom rendering added");
} else {
  console.log("❌ msgContentBlock not matched");
}

// 8. Input Area (Highly targeted replacement of the inner input container)
const inputAreaOld = `              <div className="flex items-center gap-4 bg-muted/30 rounded-[2rem] p-2 pl-6 focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-muted">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('typePlaceholder')} 
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-accent py-3"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  aria-label="Send message"
                  className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20"
                >
                  <Send size={20} className="ml-1" />
                </button>
              </div>`;

const inputAreaNew = `              <div className="flex items-center gap-3">
                {/* Plus / Media Attachment button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(!showMediaPicker)}
                    className="w-11 h-11 rounded-full bg-muted/60 border border-gray-100 text-gray-400 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all"
                    aria-label="Attach media"
                  >
                    <Plus size={20} />
                  </button>
                  {showMediaPicker && (
                    <div className="absolute bottom-14 left-0 bg-white rounded-3xl border border-muted shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 z-50">
                      <label className="flex items-center gap-3 px-5 py-4 text-xs font-bold text-accent hover:bg-muted/30 cursor-pointer border-b border-muted">
                        📷 {locale === 'am' ? 'ፎቶ / ቪዲዮ' : 'Photo / Video'}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(false)}
                        className="w-full px-5 py-3 text-xs font-black uppercase text-red-400 hover:bg-red-50 transition-all"
                      >
                        {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-[2rem] px-5 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-muted">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('typePlaceholder')}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-accent py-2.5"
                  />
                </div>

                {/* Send or Mic button */}
                {newMessage.trim() ? (
                  <button
                    type="submit"
                    aria-label="Send message"
                    className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    <Plane size={18} className="rotate-45" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={isRecordingVoice ? 'Stop voice note' : 'Record voice note'}
                    onPointerDown={startVoiceRecording}
                    onPointerUp={stopVoiceRecording}
                    onPointerLeave={stopVoiceRecording}
                    className={\`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg relative \${isRecordingVoice ? 'bg-red-500 shadow-red-300 scale-110 animate-pulse' : 'bg-primary shadow-primary/20 hover:scale-105 active:scale-95'}\`}
                  >
                    {isRecordingVoice ? (
                      <span className="text-white text-[11px] font-black">{voiceCountdown}s</span>
                    ) : (
                      <Mic size={20} className="text-white" />
                    )}
                  </button>
                )}
              </div>`;

if (content.includes(inputAreaOld)) {
  content = content.replace(inputAreaOld, inputAreaNew);
  console.log("✅ Input area updated successfully!");
} else {
  console.log("❌ Input area target not matched");
}

// 9. Call Interface isIncoming parameter binding
const callIntOld = `        <CallInterface 
          matchProfile={activeCallMatch} 
          onEndCall={() => setActiveCallMatch(null)} 
          isVideo={isCallVideo}
          isPremium={isPremium}
        />`;

const callIntNew = `        <CallInterface 
          matchProfile={activeCallMatch} 
          onEndCall={() => setActiveCallMatch(null)} 
          isVideo={isCallVideo}
          isPremium={isPremium}
          isIncoming={activeCallMatch.id !== currentUser?.id}
        />`;

if (content.includes(callIntOld)) {
  content = content.replace(callIntOld, callIntNew);
  console.log("✅ CallInterface params updated");
} else {
  console.log("❌ CallInterface target not matched");
}

// 10. Consent modal call broadcast callback update
const consentOld = `              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setIsCallVideo(pendingCallVideo);
                  setActiveCallMatch(selectedMatch);
                }}`;

const consentNew = `              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setIsCallVideo(pendingCallVideo);
                  setActiveCallMatch(selectedMatch);
                  if (currentUser && selectedMatch) {
                    const roomId = [currentUser.id, selectedMatch.id].sort().join('_');
                    const targetChan = supabase.channel(\`user_calls_\${selectedMatch.id}\`);
                    targetChan.subscribe((status) => {
                      if (status === 'SUBSCRIBED') {
                        targetChan.send({
                          type: 'broadcast',
                          event: 'incoming_call',
                          payload: {
                            callerProfile: {
                              id: currentUser.id,
                              full_name: userProfile?.full_name || 'Beteseb Member',
                              avatar_url: userProfile?.avatar_url || '',
                              image: userProfile?.avatar_url || '',
                              is_verified: userProfile?.is_verified || false
                            },
                            isVideo: pendingCallVideo,
                            roomId: roomId
                          }
                        });
                      }
                    });
                  }
                }}`;

if (content.includes(consentOld)) {
  content = content.replace(consentOld, consentNew);
  console.log("✅ Consent modal call broadcast callback updated");
} else {
  console.log("❌ Consent modal callback target not matched");
}

// 11. WHATSAPP-STYLE HEADER IMPLEMENTATION (target the exact git clean structure)
const originalHeader = `            {/* Header */}
            <header className="p-6 bg-white border-b border-muted flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary border border-primary overflow-hidden">
                  <Image src={selectedMatch.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'} alt="" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-accent flex items-center gap-1">
                    {selectedMatch.full_name}
                    {selectedMatch.is_verified && <CheckCircle2 size={14} className="text-primary fill-primary/10" />}
                  </h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">{t('activeNow')}</p>
                </div>
              </div>`;

const whatsappHeader = `            {/* Header */}
            <header className="p-3 md:p-6 bg-white border-b border-muted flex items-center justify-between shadow-sm sticky top-0 z-30">
              <div className="flex items-center gap-2 md:gap-3">
                {/* WhatsApp-style Back Arrow (visible on mobile, triggers back navigation) */}
                <button 
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="md:hidden p-1 text-gray-500 hover:text-primary transition-colors focus:outline-none"
                  aria-label="Back"
                >
                  <ChevronLeft size={28} className="text-accent" strokeWidth={2.5} />
                </button>
                
                {/* Profile Pic + Name Area (clickable on mobile to trigger back navigation) */}
                <div 
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSelectedMatch(null);
                    }
                  }}
                  className="flex items-center gap-2 md:gap-3 cursor-pointer md:cursor-default"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary border border-primary overflow-hidden relative flex-shrink-0">
                    <Image 
                      src={selectedMatch.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'} 
                      alt={selectedMatch.full_name} 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-accent flex items-center gap-1 text-sm md:text-base truncate">
                      {selectedMatch.full_name}
                      {selectedMatch.is_verified && <CheckCircle2 size={14} className="text-primary fill-primary/10" />}
                    </h3>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">{t('activeNow')}</p>
                  </div>
                </div>
              </div>`;

if (content.includes(originalHeader)) {
  content = content.replace(originalHeader, whatsappHeader);
  console.log("✅ WhatsApp Header applied successfully!");
} else {
  console.log("❌ WhatsApp Header target not matched");
}

// Convert back to CRLF before writing to file for clean format compatibility
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("All chat upgrades written successfully!");
