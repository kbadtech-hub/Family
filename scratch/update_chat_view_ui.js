const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'ChatView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Plus and ArrowLeft to imports
content = content.replace(
  "  Coins\n} from 'lucide-react';",
  "  Coins,\n  Plus,\n  ArrowLeft,\n  Plane\n} from 'lucide-react';"
);

// 2. Add voice note state hooks (after existing isProcessing state)
const afterProcessingState = `  const [isProcessing, setIsProcessing] = useState(false);`;
const voiceNoteStates = `  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceCountdown, setVoiceCountdown] = useState(0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);`;

content = content.replace(afterProcessingState, voiceNoteStates);

// 3. Add voice note handlers (insert before the return statement of the component)
const voiceHandlers = `
  // Voice Note Recording
  const getVoiceLimit = () => {
    const limits = getTierLimits(userTier);
    return limits.maxVoiceNoteSeconds ?? 7;
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const maxSeconds = getVoiceLimit();
      setVoiceCountdown(maxSeconds);
      setIsRecordingVoice(true);
      voiceChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      voiceRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecordingVoice(false);
        setVoiceCountdown(0);

        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0 || !currentUser || !selectedMatch) return;

        const fileName = \`voice-\${currentUser.id}-\${Date.now()}.webm\`;
        const { error } = await supabase.storage.from('chats').upload(fileName, blob);
        if (error) { console.error("Voice upload error:", error); return; }

        const { data: { publicUrl } } = supabase.storage.from('chats').getPublicUrl(fileName);
        await supabase.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: selectedMatch.id,
          content: \`[VOICE_NOTE]\${publicUrl}[/VOICE_NOTE]\`,
          is_read: false
        });
      };

      recorder.start();

      let remaining = maxSeconds;
      voiceTimerRef.current = setInterval(() => {
        remaining -= 1;
        setVoiceCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(voiceTimerRef.current);
          recorder.stop();
        }
      }, 1000);
    } catch (err) {
      console.error("Voice recording error:", err);
    }
  };

  const stopVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      voiceRecorderRef.current.stop();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser || !selectedMatch) return;
    setShowMediaPicker(false);
    try {
      // Compress image using canvas
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise(res => img.onload = res);
      const canvas = document.createElement('canvas');
      const maxDim = 1080;
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.82));
      const fileName = \`chat-img-\${currentUser.id}-\${Date.now()}.jpg\`;
      const { error } = await supabase.storage.from('chats').upload(fileName, blob);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('chats').getPublicUrl(fileName);
      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedMatch.id,
        content: \`[IMAGE]\${publicUrl}[/IMAGE]\`,
        is_read: false
      });
    } catch (err: any) {
      console.error("Image upload error:", err);
    }
  };

`;

// Insert before the return statement
content = content.replace("  if (loading) return", voiceHandlers + "  if (loading) return");

// 4. Update is_read tracking - mark messages as read when chat room is opened
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

content = content.replace(fetchMessagesBlock, fetchMessagesWithReadUpdate);

// 5. Also update is_read on new incoming message via realtime subscription
const realtimeIncomingMsg = `          if (msg.sender_id === selectedMatch.id) {
            setMessages((prev) => [...prev, msg]);`;

const realtimeIncomingMsgWithReadUpdate = `          if (msg.sender_id === selectedMatch.id) {
            setMessages((prev) => [...prev, msg]);
            // Auto-mark as read since we're already in this chat room
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id);`;

content = content.replace(realtimeIncomingMsg, realtimeIncomingMsgWithReadUpdate);

// 6. Also subscribe to message UPDATEs to refresh read status in real-time
const realtimeSubscribe = `      .subscribe();`;
const realtimeSubscribeWithUpdate = `      .subscribe();

    // Also subscribe to READ status updates
    const updateChannel = supabase
      .channel('realtime:messages:updates')
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
      supabase.removeChannel(updateChannel);
    };`;

// We need to handle this carefully - find the specific subscribe near the message fetch area
// Let's locate the end of the subscription block precisely
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

content = content.replace(subBlock, subBlockWithUpdate);

// 7. Update message bubble rendering to include smart checkmarks and missed call blocks
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

content = content.replace(msgContentBlock, msgContentBlockNew);

// 8. Replace input + send button area with new UI (send vs mic toggle + plus button)
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

content = content.replace(inputAreaOld, inputAreaNew);

// 9. Mobile responsive: Add back button and two-screen layout control
// Update the outer container to not have fixed height on mobile
content = content.replace(
  `    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-200px)] bg-white rounded-[2.5rem] overflow-hidden border border-muted shadow-2xl">`,
  `    <div className="flex flex-col md:flex-row bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border border-muted shadow-2xl md:h-[calc(100vh-200px)]" style={{touchAction:'manipulation'}}>`
);

// Update aside (sidebar) to be hidden on mobile when a match is selected
content = content.replace(
  `      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-muted flex flex-col h-[40vh] md:h-full">`,
  `      <aside className={\`w-full md:w-80 border-b md:border-b-0 md:border-r border-muted flex flex-col md:h-full \${selectedMatch ? 'hidden md:flex' : 'flex h-[calc(100dvh-140px)] md:h-full'}\`}>`
);

// Add Back button to chat header on mobile
content = content.replace(
  `            {/* Header */}
             <header className="p-6 bg-white border-b border-muted flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary border border-primary overflow-hidden">`,
  `            {/* Header */}
             <header className="p-3 md:p-6 bg-white border-b border-muted flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Mobile back arrow */}
                <button className="md:hidden p-2 text-gray-400 hover:text-primary transition-colors" onClick={() => setSelectedMatch(null)} aria-label="Back">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-xl bg-secondary border border-primary overflow-hidden">`
);

// 10. Make action buttons in header NOT wrap (nowrap, smaller gap on mobile)
content = content.replace(
  `               <div className="flex items-center gap-4 text-gray-400">`,
  `               <div className="flex items-center gap-1 md:gap-4 text-gray-400 flex-nowrap">`
);

// Make Wali Room label hidden on mobile
content = content.replace(
  '                 <span>Wali Room</span>',
  '                 <span className="hidden md:inline">Wali Room</span>'
);

// Hide Coins button on mobile to save space
content = content.replace(
  `                 <button \n                   onClick={handleSendCoins}\n                   aria-label="Send coins" \n                   className="hover:text-primary transition-colors text-amber-500"`,
  `                 <button \n                   onClick={handleSendCoins}\n                   aria-label="Send coins" \n                   className="hidden md:block hover:text-primary transition-colors text-amber-500"`
);

// 11. Update main chat area to be full screen on mobile
content = content.replace(
  `      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#FDFBF9]">`,
  `      {/* Main Chat Area */}
      <div className={\`flex-1 flex flex-col bg-[#FDFBF9] \${selectedMatch ? 'flex' : 'hidden md:flex'}\`}>`
);

// 12. Remove padding from form on mobile
content = content.replace(
  `            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-muted space-y-4">`,
  `            <form onSubmit={handleSendMessage} className="p-3 md:p-6 bg-white border-t border-muted space-y-3 md:space-y-4">`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated ChatView.tsx with mic/send toggle, voice notes, plus button, edge-to-edge layout, back button, and smart checkmarks!");
