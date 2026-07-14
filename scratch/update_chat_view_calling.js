const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'ChatView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Declare activeCallMatchRef and incoming call global listener
const initUseEffect = `  useEffect(() => {
    const init = async () => {`;

const callingHooks = `  // Call reference syncing and global incoming call listener
  const activeCallMatchRef = useRef<any>(null);
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

content = content.replace(initUseEffect, callingHooks);

// 2. Update consent button click handler to broadcast the call to the callee
const consentClickTarget = `              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setIsCallVideo(pendingCallVideo);
                  setActiveCallMatch(selectedMatch);
                }}`;

const consentClickReplacement = `              <button
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

content = content.replace(consentClickTarget, consentClickReplacement);

// 3. Make sure CallInterface rendering has isIncoming set dynamically based on caller
const callInterfaceTarget = `        <CallInterface 
          matchProfile={activeCallMatch} 
          onEndCall={() => setActiveCallMatch(null)} 
          isVideo={isCallVideo}
          isPremium={isPremium}
        />`;

const callInterfaceReplacement = `        <CallInterface 
          matchProfile={activeCallMatch} 
          onEndCall={() => setActiveCallMatch(null)} 
          isVideo={isCallVideo}
          isPremium={isPremium}
          isIncoming={activeCallMatch.id !== currentUser?.id}
        />`;

content = content.replace(callInterfaceTarget, callInterfaceReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated ChatView.tsx with global incoming call broadcast and consent calling notification trigger!");
