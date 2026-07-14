'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { 
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
} from 'lucide-react';
import Image from 'next/image';
import { User as SupabaseUser } from '@supabase/supabase-js';
import CallInterface from '@/components/dashboard/CallInterface';
import GiftModal from '@/components/dashboard/GiftModal';
import { getUserTier, getTierLimits } from '@/lib/tiers';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  translations?: Record<string, string>;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  star_sign: string;
  is_verified: boolean;
  enable_last_seen?: boolean;
  enable_read_receipts?: boolean;
  last_online?: string;
}

export default function ChatView({ isPremium = false }: { isPremium?: boolean }) {
  const t = useTranslations('Chat');
  const locale = useLocale();
  const [matches, setMatches] = useState<Profile[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [isGeneratingIceBreaker, setIsGeneratingIceBreaker] = useState(false);
  const [activeCallMatch, setActiveCallMatch] = useState<Profile | null>(null);
  const [isCallVideo, setIsCallVideo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'abuse' | 'explicit content' | 'scam' | 'other'>('abuse');
  const [reportDetails, setReportDetails] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceCountdown, setVoiceCountdown] = useState(0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  // Explicit call direction state:
  // true  = we RECEIVED this call (show Incoming Accept/Decline UI)
  // false = we INITIATED this call (show Outgoing "Calling..." UI)
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCallMatchRef = useRef<any>(null);
  const tf = useTranslations('Friendship');

  // Gamification & Tier Restrictions States (Phase 4.5)
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasVouchedRecords, setHasVouchedRecords] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalText, setUpgradeModalText] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [pendingMessageSend, setPendingMessageSend] = useState<(() => Promise<void>) | null>(null);

  // Call Consent Overlay States
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingCallVideo, setPendingCallVideo] = useState(false);

  // Privacy Telemetry & Safe Space States (Phase 4.5)
  const [telemetry, setTelemetry] = useState<any>(null);
  const [showPulseCheck, setShowPulseCheck] = useState(false);
  const [safeSpaceActive, setSafeSpaceActive] = useState(false);

  // Wali Room State
  const [showWaliModal, setShowWaliModal] = useState(false);
  const [activeWaliRoomId, setActiveWaliRoomId] = useState<string | null>(null);
  const [waliMessages, setWaliMessages] = useState<any[]>([]);
  const [newWaliMessage, setNewWaliMessage] = useState('');
  const [isWaliLoading, setIsWaliLoading] = useState(false);
  const [isWaliCallActive, setIsWaliCallActive] = useState(false);
  const [waliMicOn, setWaliMicOn] = useState(true);
  const [waliVideoOn, setWaliVideoOn] = useState(true);

  const userTier = getUserTier(userProfile, hasVouchedRecords);
  const limits = getTierLimits(userTier);

  useEffect(() => {
    if (!activeWaliRoomId || !showWaliModal) return;

    // Load initial messages
    const loadWaliMessages = async () => {
      const { data } = await supabase
        .from('wali_messages')
        .select('*')
        .eq('room_id', activeWaliRoomId)
        .order('created_at', { ascending: true });
      if (data) setWaliMessages(data);
    };
    loadWaliMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`wali-messages-${activeWaliRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wali_messages',
        filter: `room_id=eq.${activeWaliRoomId}`
      }, (payload) => {
        setWaliMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWaliRoomId, showWaliModal]);

  // Call reference syncing and global incoming call listener
  useEffect(() => {
    activeCallMatchRef.current = activeCallMatch;
  }, [activeCallMatch]);

  useEffect(() => {
    if (!currentUser) return;

    const callChannel = supabase.channel(`user_calls_${currentUser.id}`);

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

        // We are the RECIPIENT — show incoming call UI
        setIsIncomingCall(true);
        setIsCallVideo(isVideo);
        setActiveCallMatch(callerProfile);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
    };
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Fetch Blocked User IDs
        const { data: blockedData } = await supabase
          .from('blocks')
          .select('blocker_id, blocked_id')
          .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
        
        const blockedIds = (blockedData || []).map(b => b.blocker_id === user.id ? b.blocked_id : b.blocker_id);

        // Fetch Matches/Friends
        const { data: friends } = await supabase
          .from('friendships')
          .select(`
            *,
            sender:sender_id(id, full_name, avatar_url, star_sign, is_verified),
            receiver:receiver_id(id, full_name, avatar_url, star_sign, is_verified)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        const friendList = (friends || [])
          .filter(f => f.status === 'accepted')
          .map(f => f.sender_id === user.id ? f.receiver : f.sender)
          .filter((f: any) => f && !blockedIds.includes(f.id));
        
        // Fetch current user's full profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (userProfile) setUserProfile(userProfile);

        // Fetch vouch count
        const { count: vouchCount } = await supabase
          .from('vouch_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('vouch_status', 'approved');
        setHasVouchedRecords(vouchCount !== null && vouchCount > 0);

        // Fetch coin balance
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('coin_balance')
          .eq('id', user.id)
          .maybeSingle();
        if (wallet) setCoinBalance(Number(wallet.coin_balance));

        // Also show some potential matches if no friends (with strict gender filtering)
        let profilesQuery = supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);
        
        if (blockedIds.length > 0) {
          profilesQuery = profilesQuery.not('id', 'in', `(${blockedIds.join(',')})`);
        }
        
        if (userProfile?.gender === 'Male') {
          profilesQuery = profilesQuery.eq('gender', 'Female');
        } else if (userProfile?.gender === 'Female') {
          profilesQuery = profilesQuery.eq('gender', 'Male');
        }
        
        const { data: profiles } = await profilesQuery.limit(20);
        
        // Merge - prioritizing accepted friends
        const merged = [...friendList, ...(profiles || []).filter(p => !friendList.find(f => f.id === p.id))];
        setMatches(merged);

        // Check if there is an active chat transition key
        if (typeof window !== 'undefined') {
          const transitionId = localStorage.getItem('beteseb_active_chat_user_id');
          if (transitionId) {
            const found = merged.find(p => p.id === transitionId);
            if (found) {
              setSelectedMatch(found);
              localStorage.removeItem('beteseb_active_chat_user_id');
            }
          }
        }

        // Fetch Pending Requests
        const { data: requests } = await supabase
          .from('friendships')
          .select('*, profiles:sender_id(id, full_name, avatar_url)')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');
        
        if (requests) setFriendRequests(requests);
      }
      setLoading(false);
    };
    init();
  }, [isPremium]);

  useEffect(() => {
    if (!selectedMatch || !currentUser) return;

    const checkFriendship = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedMatch.id}),and(sender_id.eq.${selectedMatch.id},receiver_id.eq.${currentUser.id})`)
        .single();
      
      const isAccepted = data?.status === 'accepted';
      setIsFriend(isAccepted);

      if (isAccepted && data) {
        const { data: telData } = await supabase
          .from('interaction_telemetry')
          .select('*')
          .eq('friendship_id', data.id)
          .maybeSingle();

        if (telData) {
          setTelemetry(telData);
          if (telData.phase === 2) {
            setShowPulseCheck(true);
          } else if (telData.phase === 3) {
            setSafeSpaceActive(true);
          }
        } else {
          setTelemetry(null);
          setShowPulseCheck(false);
          setSafeSpaceActive(false);
        }
      } else {
        setTelemetry(null);
        setShowPulseCheck(false);
        setSafeSpaceActive(false);
      }
    };

    checkFriendship();

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedMatch.id}),and(sender_id.eq.${selectedMatch.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);

      // Mark unread messages from the other user as read
      await supabase.from('messages')
        .update({ is_read: true })
        .eq('sender_id', selectedMatch.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedMatch.id) {
            setMessages((prev) => [...prev, msg]);
            // Auto-mark as read since we're already in this chat room
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
            
            // Auto-refresh coin balance if it contains coin symbol
            if (msg.content.includes('🪙')) {
              supabase
                .from('user_wallets')
                .select('coin_balance')
                .eq('id', currentUser.id)
                .single()
                .then(({ data }) => {
                  if (data) setCoinBalance(Number(data.coin_balance));
                });
            }
          }
        }
      )
      .subscribe();

    // Also subscribe to READ status updates
    const updateChannel = supabase
      .channel(`realtime:messages:updates:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${currentUser.id}`,
      }, (payload) => {
        const updatedMsg = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [selectedMatch, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestIceBreaker = () => {
    const suggestions = [
      "I see we both value tradition. How does your family celebrate holidays?",
      "Your profile mentions a love for our culture. What's your favorite traditional dish?",
      "I'm looking for someone who values family highly. What does a perfect family weekend look like to you?",
      "Your star sign is fascinating. Do you believe our compatibility is written in the stars?",
      "What is the one traditional value you'd never want to lose in a modern world?"
    ];
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    setNewMessage(random);
  };

  const generateIceBreakerAI = async () => {
    if (!selectedMatch) return;
    setIsGeneratingIceBreaker(true);
    
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `Generate a unique, culturally respectful, warm dating ice-breaker conversation starter in ${locale === 'am' ? 'Amharic' : 'English'} for a match whose name is ${selectedMatch.full_name} and star sign is ${selectedMatch.star_sign || 'Unknown'}. Keep it concise (1-2 sentences) and highly engaging.`, 
          locale 
        })
      });
      const data = await res.json();
      if (data.text) {
        setNewMessage(data.text);
      } else {
        suggestIceBreaker();
      }
    } catch (err) {
      console.error("Failed to generate AI ice-breaker:", err);
      suggestIceBreaker(); // Fallback to local array
    } finally {
      setIsGeneratingIceBreaker(false);
    }
  };

  const handleTranslate = async (messageId: string, targetLang: string) => {
    // Simulate AI Translation
    // In a real app, this would call an Edge Function or AI API
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    if (msg.translations?.[targetLang]) {
        // Toggle back to original (simulated by clearing for this view)
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, translations: { ...m.translations, [targetLang]: '' } } : m));
        return;
    }

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          translations: {
            ...m.translations,
            [targetLang]: `[AI ${targetLang.toUpperCase()}]: ${m.content} (Translated)`
          }
        };
      }
      return m;
    }));

    // Persist to DB
    await supabase.from('messages').update({
      translations: {
        ...msg.translations,
        [targetLang]: `[AI ${targetLang.toUpperCase()}]: ${msg.content} (Translated)`
      }
    }).eq('id', messageId);
  };

  const handleOpenWaliRoom = async () => {
    if (!currentUser || !selectedMatch) return;
    setIsWaliLoading(true);
    try {
      // 1. Check if room exists
      let { data: room, error } = await supabase
        .from('wali_rooms')
        .select('*')
        .or(`and(candidate1_id.eq.${currentUser.id},candidate2_id.eq.${selectedMatch.id}),and(candidate1_id.eq.${selectedMatch.id},candidate2_id.eq.${currentUser.id})`)
        .limit(1);

      if (room && room.length > 0) {
        setActiveWaliRoomId(room[0].id);
        setShowWaliModal(true);
      } else {
        // 2. Fetch guardians if any
        const { data: g1 } = await supabase.from('guardians').select('id').eq('user_id', currentUser.id).eq('status', 'approved').limit(1);
        const { data: g2 } = await supabase.from('guardians').select('id').eq('user_id', selectedMatch.id).eq('status', 'approved').limit(1);

        const { data: newRoom, error: createError } = await supabase
          .from('wali_rooms')
          .insert({
            candidate1_id: currentUser.id,
            candidate2_id: selectedMatch.id,
            guardian1_id: g1?.[0]?.id || null,
            guardian2_id: g2?.[0]?.id || null,
            status: 'active'
          })
          .select()
          .single();

        if (createError) throw createError;
        setActiveWaliRoomId(newRoom.id);
        setShowWaliModal(true);
      }
    } catch (err: any) {
      alert("Failed to initialize Wali Room: " + err.message);
    } finally {
      setIsWaliLoading(false);
    }
  };

  const handleSendWaliMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaliMessage.trim() || !activeWaliRoomId || !currentUser) return;

    // Load sender full_name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUser.id)
      .single();

    const senderName = profile?.full_name || 'Candidate';

    const { error } = await supabase
      .from('wali_messages')
      .insert({
        room_id: activeWaliRoomId,
        sender_id: currentUser.id,
        sender_name: senderName,
        content: newWaliMessage
      });

    if (!error) {
      setNewWaliMessage('');
    } else {
      alert("Failed to send message: " + error.message);
    }
  };

  const showUpgradePromptForTier = (tier: string) => {
    let promptText = '';
    if (tier === 'silver') {
      promptText = locale === 'am'
        ? "የዕለቱ መልእክት ገደብዎ ላይ ደርሰዋል። መታወቂያዎን በነጻ በመስቀል መለያዎን ወደ Gold Tier ያሳድጉ!"
        : "You have used your 3 texts/1 min limit. Upgrade instantly to Gold for free by simply uploading your Legal ID!";
    } else if (tier === 'gold') {
      promptText = locale === 'am'
        ? "የዕለቱ የውይይት ገደብዎ ላይ ደርሰዋል። በጓደኞችዎ ምስክርነት አግኝተው መለያዎን ወደ Platinum Tier ያሳድጉ!"
        : "Need more room to chat? Get verified by your peers to instantly unlock the Platinum tier!";
    } else if (tier === 'platinum') {
      promptText = locale === 'am'
        ? "የዕለቱን ገደብ ጨርሰዋል። ያለምንም ገደብ ለመወያየት መለያዎን ወደ Diamond Tier ያሳድጉ!"
        : "Remove all chat blocks. Upgrade directly to the premium Diamond tier for completely unlimited access!";
    }
    setUpgradeModalText(promptText);
    setShowUpgradeModal(true);
  };

  const handleBypassWithCoins = async () => {
    if (!currentUser || coinBalance < 10) return;
    try {
      const { error: debitError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: currentUser.id,
          amount: -10,
          type: 'gift_send', // spend
          note: 'Limit break bypass'
        });

      if (!debitError) {
        setCoinBalance(prev => prev - 10);
        setShowLimitModal(false);
        if (pendingMessageSend) {
          await pendingMessageSend();
          setPendingMessageSend(null);
        }
      } else {
        alert("Coin transaction failed: " + debitError.message);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleWatchAdBypass = async () => {
    if (!currentUser) return;
    try {
      const { showRewardedAd } = await import('@/lib/ads');
      await showRewardedAd(
        currentUser.id,
        async (rewardAmount) => {
          // Grant ad extension in daily_limits
          const { data: limitsData } = await supabase
            .from('daily_limits')
            .select('ad_extensions')
            .eq('user_id', currentUser.id)
            .single();

          const currentAds = limitsData?.ad_extensions || 0;
          const { error: updateError } = await supabase
            .from('daily_limits')
            .update({ ad_extensions: currentAds + 1 })
            .eq('user_id', currentUser.id);

          if (!updateError) {
            alert(locale === 'am' 
              ? "ማስታወቂያውን ስለተመለከቱ +2 ተጨማሪ መልእክት በነፃ ተፈቅዶልዎታል! መልእክትዎ አሁን ይላካል።"
              : "You earned +2 extra messages for watching the ad! Your message is being sent.");
            
            setShowLimitModal(false);
            if (pendingMessageSend) {
              await pendingMessageSend();
              setPendingMessageSend(null);
            }
          } else {
            alert("Failed to grant ad reward: " + updateError.message);
          }
        },
        () => {
          alert(locale === 'am' 
            ? "ማስታወቂያውን ሳያጠናቅቁ ዘለሉት። ሳንቲም ለማግኘት እባክዎ ቪዲዮውን ያጠናቅቁ።"
            : "You skipped the ad. Watch the full ad to earn the reward.");
        }
      );
    } catch (e: any) {
      alert("Error triggering ad: " + e.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || !currentUser) return;

    const messageContent = newMessage.trim();

    // Tiers & Daily Action Limits (Beteseb v3.6)
    const userTier = getUserTier(userProfile, hasVouchedRecords);
    const limits = getTierLimits(userTier);
    let currentSentCount = 0;

    if (userTier === 'bronze') {
      alert(locale === 'am'
        ? "ያልተረጋገጠ (Bronze Tier) አባላት መልእክት መላክ አይችሉም። እባክዎ መጀመሪያ ፕሮፋይልዎን ያረጋግጡ!"
        : "Unverified (Bronze Tier) members are blocked from sending text or audio messages. Please complete verification first!");
      return;
    }

    if (limits.maxTexts !== Infinity) {
      const { data: limitsData } = await supabase
        .from('daily_limits')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      let currentLimits = limitsData || { messages_sent: 0, ad_extensions: 0, last_reset: new Date().toISOString() };
      
      // Lazy Reset Logic: check if last_reset is on a previous day (UTC)
      const now = new Date();
      const lastReset = currentLimits.last_reset ? new Date(currentLimits.last_reset) : new Date(0);
      const isNewDay = now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
                        now.getUTCMonth() !== lastReset.getUTCMonth() ||
                        now.getUTCDate() !== lastReset.getUTCDate();

      if (isNewDay) {
        currentLimits = {
          ...currentLimits,
          messages_sent: 0,
          ad_extensions: 0,
          last_reset: now.toISOString()
        };
        // Update database in background (lazy reset)
        await supabase
          .from('daily_limits')
          .update({
            messages_sent: 0,
            ad_extensions: 0,
            last_reset: now.toISOString()
          })
          .eq('user_id', currentUser.id);
      }

      currentSentCount = currentLimits.messages_sent;
      const allowedTexts = limits.maxTexts + (currentLimits.ad_extensions * 2);

      if (currentSentCount >= allowedTexts) {
        // Save the pending send action to execute after bypass succeeds
        setPendingMessageSend(() => async () => {
          const msgData = {
            sender_id: currentUser.id,
            receiver_id: selectedMatch.id,
            content: messageContent,
          };
          const { data, error } = await supabase.from('messages').insert(msgData).select().single();
          if (!error && data) {
            setMessages((prev) => [...prev, data]);
            setNewMessage('');
            // Increment message sent in database daily_limits
            await supabase
              .from('daily_limits')
              .update({ 
                messages_sent: currentSentCount + 1,
                last_reset: new Date().toISOString()
              })
              .eq('user_id', currentUser.id);
          }
        });
        setShowLimitModal(true);
        return;
      }
    }

    // 1. Strict Phone & Email Sharing Block (Permanent Security Rule)
    const phoneRegex = /(?:\+?251|\b0)[\s-]*[97](?:[\s-]*\d){8}\b/;
    const digitSequenceRegex = /(?:\d[\s-]*){8,}/; // Blocks long digit sequences to prevent evasion
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

    if (phoneRegex.test(messageContent) || digitSequenceRegex.test(messageContent) || emailRegex.test(messageContent)) {
       alert(locale === 'am' 
         ? "የደህንነት ደንብ፦ በጽሁፍ ስልክ ቁጥር ወይም ኢሜይል መለዋወጥ በቋሚነት የተከለከለ ነው። እባክዎ በመተግበሪያው ውስጥ ያለውን የድምጽ ወይም የቪዲዮ ጥሪ ይጠቀሙ።" 
         : "Security Rule: Exchanging phone numbers or emails in chat is permanently prohibited. Please use the built-in audio or video call features.");
       return;
    }

    // 2. Content Shield - AI Moderation Call
    try {
      const response = await fetch(`/${locale}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      });
      const safety = await response.json();
      
      if (!safety.approved) {
        alert(locale === 'am' 
          ? `ይህ መልእክት የቤተሰብን ስነ-ምግባር ስለሚጥስ አልተላከም፦ ${safety.reason}` 
          : `Message blocked due to family values violation: ${safety.reason}`);
        return;
      }
    } catch (err) {
      console.error("AI Moderation failed in chat, bypassing to fallback", err);
    }

    const msgData = {
      sender_id: currentUser.id,
      receiver_id: selectedMatch.id,
      content: messageContent,
    };

    const { data, error } = await supabase.from('messages').insert(msgData).select().single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      
      // Increment messages_sent in daily_limits (optimized to reuse already fetched counter)
      if (limits.maxTexts !== Infinity) {
        await supabase
          .from('daily_limits')
          .update({ 
            messages_sent: currentSentCount + 1,
            last_reset: new Date().toISOString()
          })
          .eq('user_id', currentUser.id);
      }
    }
  };

  const handleSendCoins = async () => {
    if (!currentUser || !selectedMatch) return;
    const amountStr = prompt(locale === 'am' 
      ? "ለመላክ የሚፈልጉትን የሳንቲም (Coins) መጠን ያስገቡ፦" 
      : "Enter the number of coins you want to send:");
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      alert(locale === 'am' ? "እባክዎ ትክክለኛ ቁጥር ያስገቡ" : "Please enter a valid amount");
      return;
    }

    if (coinBalance < amount) {
      alert(locale === 'am' 
        ? `በቂ ሳንቲም የለዎትም። የእርስዎ ቀሪ ሳንቲም፡ ${coinBalance} ነው` 
        : `Insufficient coins. Your current balance is ${coinBalance}`);
      return;
    }

    const { error: debitError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: currentUser.id,
        amount: -amount,
        type: 'gift_send'
      });

    if (debitError) {
      alert("Deduction failed: " + debitError.message);
      return;
    }

    const { error: creditError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: selectedMatch.id,
        amount: amount,
        type: 'gift_receive'
      });

    if (creditError) {
      alert("Transfer failed: " + creditError.message);
      return;
    }

    setCoinBalance(prev => prev - amount);

    const transferMessage = locale === 'am'
      ? `🪙 ${amount} የቤተሰብ ሳንቲሞችን ልኬልሃለሁ/ልኬልሻለሁ!`
      : `🪙 Sent you ${amount} Beteseb Coins!`;

    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedMatch.id,
        content: transferMessage
      })
      .select()
      .single();

    if (!msgError && msgData) {
      setMessages((prev) => [...prev, msgData]);
    }

    alert(locale === 'am' ? `${amount} ሳንቲም በተሳካ ሁኔታ ተልኳል!` : `Successfully sent ${amount} coins!`);
  };

  const handleRequestCoins = async () => {
    if (!currentUser || !selectedMatch) return;
    const requestMessage = locale === 'am'
      ? `👋 እባክህ/እባክሽ ቴክስት መመለሻ ኮይን አልቆብኛል፤ የተወሰነ ኮይን ላክልኝ/ላኪልኝ! 🪙`
      : `👋 I have run out of coins to reply. Please send me some coins! 🪙`;

    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedMatch.id,
        content: requestMessage
      })
      .select()
      .single();

    if (!msgError && msgData) {
      setMessages((prev) => [...prev, msgData]);
    }

    alert(locale === 'am' ? "የኮይን መጠየቂያ መልዕክት ተልኳል!" : "Coin request sent!");
  };

  const handleFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('id', requestId);
    
    if (!error) {
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      // Refresh matches if accepted
      if (status === 'accepted') window.location.reload();
    }
  };

  const handleReportUser = async () => {
    if (!selectedMatch || !currentUser) return;
    setIsProcessing(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      reported_id: selectedMatch.id,
      reason: reportReason,
      details: reportDetails.trim()
    });
    if (!error) {
      alert(locale === 'am' ? 'ተጠቃሚው ሪፖርት ተደርጓል።' : 'User reported successfully.');
      setIsReportOpen(false);
      setReportDetails('');
      setShowMenu(false);
    } else {
      alert("Report failed: " + error.message);
    }
    setIsProcessing(false);
  };

  const handleBlockUser = async () => {
    if (!selectedMatch || !currentUser) return;
    const confirmBlock = confirm(
      locale === 'am' 
        ? 'በእርግጥ ይህንን ተጠቃሚ ማገድ ይፈልጋሉ? ከእንግዲህ መገናኘት አይችሉም።' 
        : 'Are you sure you want to block this user? You will no longer be able to communicate.'
    );
    if (!confirmBlock) return;

    setIsProcessing(true);
    const { error } = await supabase.from('blocks').insert({
      blocker_id: currentUser.id,
      blocked_id: selectedMatch.id
    });
    if (!error) {
      alert(locale === 'am' ? 'ተጠቃሚው ታግዷል።' : 'User blocked successfully.');
      setMatches(prev => prev.filter(m => m.id !== selectedMatch.id));
      setSelectedMatch(null);
      setShowMenu(false);
    } else {
      alert("Block failed: " + error.message);
    }
    setIsProcessing(false);
  };


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

        const fileName = `voice-${currentUser.id}-${Date.now()}.webm`;
        const { error } = await supabase.storage.from('chats').upload(fileName, blob);
        if (error) { console.error("Voice upload error:", error); return; }

        const { data: { publicUrl } } = supabase.storage.from('chats').getPublicUrl(fileName);
        await supabase.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: selectedMatch.id,
          content: `[VOICE_NOTE]${publicUrl}[/VOICE_NOTE]`,
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
      const fileName = `chat-img-${currentUser.id}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('chats').upload(fileName, blob);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('chats').getPublicUrl(fileName);
      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedMatch.id,
        content: `[IMAGE]${publicUrl}[/IMAGE]`,
        is_read: false
      });
    } catch (err: any) {
      console.error("Image upload error:", err);
    }
  };

  // Heartbeat to update last_online status in database
  useEffect(() => {
    if (!currentUser) return;
    const updateLastOnline = async () => {
      await supabase
        .from('profiles')
        .update({ last_online: new Date().toISOString() })
        .eq('id', currentUser.id);
    };
    updateLastOnline();
    const interval = setInterval(updateLastOnline, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const getLastSeenText = (match: Profile) => {
    if (match.enable_last_seen === false) return null;
    if (!match.last_online) return null;

    try {
      const lastOnlineDate = new Date(match.last_online);
      const diffMs = new Date().getTime() - lastOnlineDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 3) {
        return locale === 'am' ? 'በመስመር ላይ (Active Now)' : 'Active now';
      }

      // Format last online time
      const timeStr = lastOnlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isToday = new Date().toDateString() === lastOnlineDate.toDateString();

      if (isToday) {
        return locale === 'am'
          ? `የመጨረሻ እይታ ዛሬ በ ${timeStr}`
          : `Last seen today at ${timeStr}`;
      } else {
        const dateStr = lastOnlineDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return locale === 'am'
          ? `የመጨረሻ እይታ በ ${dateStr} በ ${timeStr}`
          : `Last seen on ${dateStr} at ${timeStr}`;
      }
    } catch (e) {
      return null;
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">{t('loading')}</div>;

  return (
    <div className="flex flex-col md:flex-row w-full bg-white rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border md:border-muted md:shadow-2xl h-[calc(100dvh-64px)] md:h-[calc(100vh-200px)]" style={{touchAction:'manipulation'}}>
      {/* Sidebar - Matches */}
      <aside className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-muted flex flex-col md:h-full ${selectedMatch ? 'hidden md:flex' : 'flex h-full md:h-full'}`}>
        <div className="p-6 border-b border-muted">
          <h2 className="text-xl font-bold text-accent mb-4 tracking-tighter uppercase">{t('title')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')} 
              className="w-full pl-10 pr-4 py-3 bg-muted/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Friend Requests Section */}
          {friendRequests.length > 0 && (
            <div className="px-4 py-2 space-y-3">
               <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Bell size={12} /> {tf('pending')}
               </h3>
               {friendRequests.map(req => (
                 <div key={req.id} className="bg-primary/5 border border-primary/10 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-secondary overflow-hidden">
                          <Image src={req.profiles.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=100'} alt="" width={32} height={32} className="object-cover w-full h-full" />
                       </div>
                       <span className="text-xs font-bold text-accent">{req.profiles.full_name}</span>
                    </div>
                    <div className="flex gap-1">
                       <button 
                        onClick={() => handleFriendRequest(req.id, 'accepted')}
                        className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center hover:scale-110 transition-all"
                       >
                          <Check size={14} />
                       </button>
                       <button 
                        onClick={() => handleFriendRequest(req.id, 'rejected')}
                        className="w-8 h-8 bg-muted text-gray-400 rounded-lg flex items-center justify-center hover:scale-110 transition-all"
                       >
                          <CloseIcon size={14} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('title')}</h3>
            {matches.length === 0 ? (
               <div className="p-8 text-center text-gray-400 text-sm">{t('noMatches')}</div>
            ) : (
              matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all group ${
                    selectedMatch?.id === match.id ? 'bg-primary/10 border-primary/20 bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-secondary border-2 border-primary overflow-hidden">
                      {match.avatar_url ? (
                        <Image src={match.avatar_url} alt={match.full_name} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary"><User size={24} /></div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="font-bold text-accent group-hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1">
                      {match.full_name}
                      {match.is_verified && <CheckCircle2 size={12} className="text-primary fill-primary/10" />}
                    </p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{match.star_sign || 'Abushakir Match'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#FDFBF9] min-h-0 ${selectedMatch ? 'flex' : 'hidden md:flex'}`}>
        {selectedMatch ? (
          (!isPremium && !isFriend) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white/50 backdrop-blur-sm">
               <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                  <ShieldCheck size={40} className="text-primary" />
               </div>
               <div className="max-w-sm space-y-2">
                  <h3 className="text-2xl font-black text-accent italic tracking-tighter">Premium or Friends Only</h3>
                  <p className="text-gray-500 text-sm">
                    Direct messaging is for premium members or accepted friends. Send a friend request to start a conversation for free!
                  </p>
               </div>
               <button 
                 onClick={() => window.location.search = '?tab=payment'}
                 className="bg-primary text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
               >
                 {t('upgradeNow')}
               </button>
            </div>
          ) : (
          <>
            {/* Header */}
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
                    {getLastSeenText(selectedMatch) ? (
                      <p className="text-[10px] text-green-500 font-bold tracking-wide">{getLastSeenText(selectedMatch)}</p>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('activeNow')}</p>
                    )}
                  </div>
                </div>
              </div>
               <div className="flex items-center gap-1 md:gap-4 text-gray-400 flex-nowrap">
                <button 
                  onClick={handleOpenWaliRoom}
                  aria-label="Wali Meeting Room" 
                  className="hover:text-primary transition-colors text-primary flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10"
                  title="Wali Room (የቤተሰብ/የሚዜ መድረክ)"
                >
                  <Users size={16} />
                  <span className="hidden md:inline">Wali Room</span>
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  aria-label="Send a gift" 
                  className="hover:text-primary transition-colors text-primary/80"
                >
                  <Gift size={20} />
                </button>
                 <button 
                   onClick={() => {
                     setPendingCallVideo(false);
                     setShowConsentModal(true);
                   }}
                   aria-label="Start phone call" 
                   className="hover:text-primary transition-colors"
                 >
                   <Phone size={20} />
                 </button>
                 <button 
                   onClick={() => {
                     if (limits.maxVideoCallMinutes === 0) {
                       alert(locale === 'am' 
                         ? "ያልተረጋገጠ (Bronze Tier) አባላት የቪዲዮ ጥሪ ማድረግ አይችሉም። እባክዎ መጀመሪያ ፕሮፋይልዎን ያረጋግጡ!" 
                         : "Unverified (Bronze Tier) members are blocked from making video calls. Please complete verification first!");
                       return;
                     }
                     setPendingCallVideo(true);
                     setShowConsentModal(true);
                   }}
                   aria-label="Start video call" 
                   className="hover:text-primary transition-colors"
                 >
                   <Video size={20} />
                 </button>
                <button 
                  onClick={handleSendCoins}
                  aria-label="Send coins" 
                  className="hover:text-primary transition-colors text-amber-500"
                  title={locale === 'am' ? 'ኮይን ላክ' : 'Send Coins'}
                >
                  <Coins size={20} />
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    aria-label="More options" 
                    className="hover:text-primary transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-2xl shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button 
                        onClick={() => { setIsReportOpen(true); setShowMenu(false); }}
                        className="w-full text-left px-5 py-3 hover:bg-muted text-xs font-bold text-amber-700 flex items-center gap-2"
                      >
                        ⚠️ {locale === 'am' ? 'ሪፖርት አድርግ (Report)' : 'Report User'}
                      </button>
                      <button 
                        onClick={handleBlockUser}
                        className="w-full text-left px-5 py-3 hover:bg-muted text-xs font-bold text-red-600 flex items-center gap-2 border-t border-muted"
                      >
                        🚫 {locale === 'am' ? 'አግድ (Block)' : 'Block User'}
                      </button>
                      <button 
                        onClick={() => { handleRequestCoins(); setShowMenu(false); }}
                        className="w-full text-left px-5 py-3 hover:bg-muted text-xs font-bold text-amber-600 flex items-center gap-2 border-t border-muted"
                        title={locale === 'am' ? 'ኮይን ጠይቅ' : 'Request Coins'}
                      >
                        🪙 {locale === 'am' ? 'ኮይን ጠይቅ (Request)' : 'Request Coins'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {safeSpaceActive && (
              <div className="bg-primary/5 border-b border-primary/20 px-6 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-primary">
                <span className="flex items-center gap-2">🛡️ Mutual Safe Space Active / የጋራ የደህንነት መድረክ</span>
                <button 
                  onClick={() => {
                    alert("Launching relationship counselor list. Please navigate to Workshops to book!");
                  }}
                  className="px-3 py-1 bg-primary text-white rounded-lg text-[9px] hover:scale-105 transition-all"
                >
                  Book Counselor / አማካሪ ያግኙ
                </button>
              </div>
            )}

            {showPulseCheck && (
              <div className="m-6 p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-3">
                  <span className="text-xl">❤️</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-amber-800 uppercase tracking-wider">
                      {locale === 'am' ? 'የውይይት ግምገማ (Pulse Check)' : 'Relationship Pulse Check'}
                    </h4>
                    <p className="text-xs text-amber-700 font-medium">
                      {locale === 'am' 
                        ? 'የውይይት ፍጥነታችሁ ቀንሷል። ስሜታችሁን በግልጽ ለመወያየት ወደ የጋራ የደህንነት መድረክ (Safe Space) መግባት ይፈልጋሉ?' 
                        : 'It looks like your conversation has cooled down. Would you like to enter a mutual Safe Space room to talk it out constructively?'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (telemetry) {
                        const { error } = await supabase
                          .from('interaction_telemetry')
                          .update({ phase: 3 })
                          .eq('id', telemetry.id);
                        if (!error) {
                          setSafeSpaceActive(true);
                          setShowPulseCheck(false);
                        }
                      } else {
                        setSafeSpaceActive(true);
                        setShowPulseCheck(false);
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all"
                  >
                    {locale === 'am' ? 'እንወያይ' : 'Talk It Out'}
                  </button>
                  <button
                    onClick={() => setShowPulseCheck(false)}
                    className="px-4 py-2 bg-amber-200/50 text-amber-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-200 transition-all"
                  >
                    {locale === 'am' ? 'ዝጋ' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}

            {isReportOpen && (
              <div className="p-6 bg-amber-50/50 border-b border-amber-200 space-y-4 animate-in slide-in-from-top-2 z-20 relative">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-accent uppercase tracking-wider">⚠️ {locale === 'am' ? 'ተጠቃሚውን ሪፖርት ያድርጉ' : 'Report User'}</h4>
                  <button onClick={() => setIsReportOpen(false)} className="text-gray-400 hover:text-accent"><CloseIcon size={16} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{locale === 'am' ? 'ሪፖርት የማድረጊያ ምክንያት' : 'Reason for Report'}</p>
                    <select 
                      value={reportReason} 
                      onChange={(e) => setReportReason(e.target.value as any)}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl font-bold text-xs"
                    >
                      <option value="abuse">{locale === 'am' ? 'ማስፈራራት ወይም ስድብ (Abuse / Harassment)' : 'Abuse or Harassment'}</option>
                      <option value="explicit content">{locale === 'am' ? 'ያልተገባ ምስል ወይም ፅሁፍ (Explicit Content)' : 'Explicit Content'}</option>
                      <option value="scam">{locale === 'am' ? 'ማጭበርበር (Scam / Fraud)' : 'Scam or Fraud'}</option>
                      <option value="other">{locale === 'am' ? 'ሌላ ምክንያት (Other Reason)' : 'Other Reason'}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{locale === 'am' ? 'ተጨማሪ ማብራሪያ' : 'Details'}</p>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder={locale === 'am' ? 'ዝርዝር ማብራሪያ እዚህ ይፃፉ...' : 'Please provide details...'}
                      className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs min-h-[44px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 bg-white border border-border text-gray-500 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                  >
                    {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleReportUser}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-accent text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md"
                  >
                    {isProcessing ? 'Sending...' : (locale === 'am' ? 'ሪፖርት ላክ' : 'Submit Report')}
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto min-h-0 p-4 md:p-10 space-y-6 scroll-smooth"
            >
              <div className="flex flex-col items-center mb-8">
                 <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 text-center max-w-xs">
                    <Heart size={20} className="text-primary mx-auto mb-2 fill-primary/20" />
                    <p className="text-xs text-accent font-medium mt-1 uppercase tracking-tighter">{t('compatibilityTitle')}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{t('compatibilitySub')}</p>
                 </div>
              </div>

              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] group relative ${msg.sender_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
                    {/* Missed Call System Messages */}
                    {(msg.content === '[MISSED_AUDIO_CALL]' || msg.content === '[MISSED_VIDEO_CALL]') ? (
                      <div className={`px-5 py-3 rounded-[1.5rem] flex items-center gap-3 text-xs font-bold ${
                        msg.sender_id === currentUser?.id 
                          ? 'bg-slate-100/50 border border-slate-200 text-slate-500' 
                          : 'bg-red-50/70 border border-red-100/80 text-red-500 shadow-sm'
                      }`}>
                        {msg.content === '[MISSED_VIDEO_CALL]' ? (
                          <VideoOff size={16} className={msg.sender_id === currentUser?.id ? 'text-slate-400' : 'text-red-500'} />
                        ) : (
                          <PhoneOff size={16} className={msg.sender_id === currentUser?.id ? 'text-slate-400' : 'text-red-500'} />
                        )}
                        <span>
                          {msg.sender_id === currentUser?.id
                            ? (locale === 'am' ? 'የማይመለስ ጥሪ (Outgoing Call - No Answer)' : 'Outgoing Call - No Answer')
                            : (locale === 'am' ? 'ያልተቀበሉ ጥሪ (Missed Call)' : 'Missed Call')}
                        </span>
                        <span className="ml-auto text-[10px] font-normal opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : msg.content.startsWith('[VOICE_NOTE]') ? (
                      <div className={`px-4 py-3 rounded-[2rem] shadow-sm ${msg.sender_id === currentUser?.id ? 'bg-accent text-white rounded-tr-none' : 'bg-white text-gray-600 rounded-tl-none border border-muted'}`}>
                        <audio controls src={msg.content.replace('[VOICE_NOTE]', '').replace('[/VOICE_NOTE]', '')} className="h-8 w-44 max-w-full" />
                      </div>
                    ) : msg.content.startsWith('[IMAGE]') ? (
                      <div className="rounded-[2rem] overflow-hidden shadow-sm max-w-[220px]">
                        <img src={msg.content.replace('[IMAGE]', '').replace('[/IMAGE]', '')} alt="Shared image" className="w-full h-auto object-cover rounded-[2rem]" />
                      </div>
                    ) : (
                      <div className={`
                        px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm
                        ${msg.sender_id === currentUser?.id 
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-white text-gray-600 rounded-tl-none border border-muted'
                        }
                      `}>
                        {msg.translations?.[locale] || msg.content}
                        
                        {/* Translation Toggle */}
                        <button 
                          onClick={() => handleTranslate(msg.id, locale)}
                          className={`absolute -bottom-6 ${msg.sender_id === currentUser?.id ? 'right-0' : 'left-0'} p-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all hover:text-primary`}
                        >
                          <Languages size={10} /> {msg.translations?.[locale] ? t('original') : t('translate', { lang: locale })}
                        </button>
                      </div>
                    )}

                    {/* Delivery status */}
                    <div className={`flex items-center gap-2 mt-2 px-2 text-[10px] ${msg.sender_id === currentUser?.id ? 'justify-end text-gray-400' : 'justify-start text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_id === currentUser?.id && (
                        msg.is_read && (userProfile?.enable_read_receipts !== false) && (selectedMatch?.enable_read_receipts !== false)
                          ? <CheckCheck size={14} className="text-primary" /> // Read - brand orange
                          : <CheckCheck size={14} className="text-gray-300" /> // Delivered - gray
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 md:p-6 bg-white border-t border-muted space-y-3 md:space-y-4">
              {safeSpaceActive ? (
                <div className="flex flex-col gap-2 w-full p-4 bg-primary/5 border border-primary/20 rounded-3xl">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest px-2">
                    {locale === 'am' ? 'ገንቢ የውይይት መሪዎች (Safe Space Prompts):' : 'Constructive Safe Space Prompts:'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      locale === 'am' 
                        ? "በግንኙነታችን ላይ ያለንን ተስፋዎች በግልፅ እንድንወያይ እፈልጋለሁ።"
                        : "I feel like we've drifted a bit and want to align on our relationship expectations.",
                      locale === 'am'
                        ? "የመነጋገሪያ ስልታችንን እንዴት ማሻሻል እንደምንችል እንወያይ።"
                        : "Let's discuss how we can improve our communication style.",
                      locale === 'am'
                        ? "የግንኙነት አማካሪ ማግኘት እፈልጋለሁ።"
                        : "I would like us to schedule a brief counseling check-in."
                    ].map((promptText, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewMessage(promptText)}
                        className="text-left px-3 py-2 bg-white hover:bg-primary/5 hover:text-primary text-[10px] font-bold rounded-2xl border border-gray-200 transition-all text-accent"
                      >
                        💬 {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                   <button 
                    type="button"
                    onClick={suggestIceBreaker}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-accent border border-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                   >
                      <Lightbulb size={12} /> Templates
                   </button>
                   <button 
                    type="button"
                    onClick={generateIceBreakerAI}
                    disabled={isGeneratingIceBreaker}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                   >
                      {isGeneratingIceBreaker ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} className="fill-primary" />}
                      AI Ice-breaker
                   </button>
                </div>
              )}
              <div className="flex items-center gap-3">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg relative ${isRecordingVoice ? 'bg-red-500 shadow-red-300 scale-110 animate-pulse' : 'bg-primary shadow-primary/20 hover:scale-105 active:scale-95'}`}
                  >
                    {isRecordingVoice ? (
                      <span className="text-white text-[11px] font-black">{voiceCountdown}s</span>
                    ) : (
                      <Mic size={20} className="text-white" />
                    )}
                  </button>
                )}
              </div>
            </form>
          </>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-6">
             <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-4">
                <Heart size={48} className="text-primary fill-primary/10 animate-pulse" />
             </div>
              <div className="space-y-4 px-4">
                 <h3 className="text-2xl md:text-3xl font-black text-accent mb-2 italic tracking-tighter">{t('selectMatchTitle')}</h3>
                 <p className="text-gray-400 max-w-sm mx-auto leading-relaxed text-sm md:text-base">
                   {t('selectMatchSub')}
                 </p>
              </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 opacity-40 w-full max-w-md">
                <div className="p-4 bg-white rounded-3xl border border-muted flex items-center justify-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center"><CheckCheck size={16} /></div>
                   <span className="text-[10px] font-bold uppercase">{t('encrypted')}</span>
                </div>
                <div className="p-4 bg-white rounded-3xl border border-muted flex items-center justify-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><User size={16} /></div>
                   <span className="text-[10px] font-bold uppercase">{t('private')}</span>
                </div>
             </div>
          </div>
        )}
      </div>
      {activeCallMatch && (
        <CallInterface 
          matchProfile={activeCallMatch} 
          onEndCall={() => {
            setActiveCallMatch(null);
            // Reset call direction so next call starts clean
            setIsIncomingCall(false);
          }} 
          isVideo={isCallVideo}
          isPremium={isPremium}
          isIncoming={isIncomingCall}
        />
      )}
      {showGiftModal && selectedMatch && (
        <GiftModal 
          recipientId={selectedMatch.id}
          recipientName={selectedMatch.full_name}
          locale={locale}
          onClose={() => setShowGiftModal(false)}
        />
      )}
      {showWaliModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-[600px] rounded-[3.5rem] border border-muted p-8 md:p-10 relative shadow-2xl flex flex-col justify-between animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
            {/* Header */}
            <div>
              <button 
                onClick={() => { setShowWaliModal(false); setIsWaliCallActive(false); }}
                className="absolute top-8 right-8 p-3 bg-muted/30 hover:bg-muted rounded-full transition-all text-gray-500 z-10"
              >
                <CloseIcon size={18} />
              </button>

              <div className="text-center space-y-2 border-b border-muted pb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  <Users size={14} /> Wali Meeting Room
                </div>
                <h3 className="text-2xl font-black text-accent italic tracking-tighter">
                  {locale === 'am' ? 'የቤተሰብ ማሳተፊያ የጋራ መድረክ' : 'Family-Integrated Dialogue'}
                </h3>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                    ⚠️ {locale === 'am' ? 'ማስጠንቀቂያ፡ በዚህ የቡድን ውይይት ውስጥ አስታራቂዎች (Walis) ይገኛሉ' : 'Note: Linked family guardians/mediators are present in this chat'}
                  </p>
                  {!isWaliCallActive && (
                    <button 
                      onClick={() => setIsWaliCallActive(true)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <Video size={10} /> {locale === 'am' ? 'የቪዲዮ ጥሪ ጀምር' : 'Start Video Call'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isWaliCallActive ? (
              /* Simulated Wali Video Call Layout */
              <div className="flex-1 flex flex-col justify-between my-4 space-y-4">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  {/* Panel 1: You */}
                  <div className="bg-slate-900 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center p-4 border border-white/10 shadow-inner">
                    {waliVideoOn ? (
                      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                        <User size={48} className="text-white/20 animate-pulse" />
                        {/* Simulated green dot */}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/25 border border-green-500/50 rounded-full text-[7px] font-black uppercase tracking-widest text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                          <span>{locale === 'am' ? 'ቀጥታ' : 'Live'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                        <VideoOff size={32} className="text-white/30" />
                      </div>
                    )}
                    {/* Watermark compliance */}
                    <div className="absolute bottom-2 left-2 text-[6px] font-mono text-white/25 pointer-events-none select-none uppercase tracking-wide">
                      BETESEB SECURE: {currentUser?.id?.substring(0, 8)}
                    </div>
                    <div className="absolute top-2 right-2 text-[6px] font-mono text-white/25 pointer-events-none select-none">
                      {new Date().toLocaleTimeString()}
                    </div>
                    <span className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-wider text-white/50 z-10 bg-slate-950/40 px-2 py-0.5 rounded-md">
                      {locale === 'am' ? 'እርስዎ (You)' : 'You'}
                    </span>
                  </div>

                  {/* Panel 2: Match */}
                  <div className="bg-slate-900 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center p-4 border border-white/10 shadow-inner">
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                      {selectedMatch.avatar_url ? (
                        <img src={selectedMatch.avatar_url} alt="" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <User size={48} className="text-white/20" />
                      )}
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/25 border border-green-500/50 rounded-full text-[7px] font-black uppercase tracking-widest text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span>{locale === 'am' ? 'በመስመር ላይ' : 'Online'}</span>
                      </div>
                    </div>
                    {/* Watermark compliance */}
                    <div className="absolute bottom-2 left-2 text-[6px] font-mono text-white/25 pointer-events-none select-none uppercase tracking-wide">
                      ANTI-CAPTURE ACTIVE
                    </div>
                    <span className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-wider text-white/50 z-10 bg-slate-950/40 px-2 py-0.5 rounded-md">
                      {selectedMatch.full_name}
                    </span>
                  </div>

                  {/* Panel 3: Guardian (Wali) */}
                  <div className="bg-slate-900 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center p-4 border border-white/10 shadow-inner">
                    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center space-y-2 p-2">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/25 animate-pulse">
                        <ShieldCheck size={28} />
                      </div>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
                        {locale === 'am' ? 'የቤተሰብ የሚዜ' : 'Guardian / Wali'}
                      </span>
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/25 border border-green-500/50 rounded-full text-[7px] font-black uppercase tracking-widest text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span>{locale === 'am' ? 'በመስመር ላይ' : 'Online'}</span>
                      </div>
                    </div>
                    {/* Watermark compliance */}
                    <div className="absolute bottom-2 left-2 text-[6px] font-mono text-white/25 pointer-events-none select-none uppercase tracking-wide">
                      WALI SECURE FEED
                    </div>
                  </div>
                </div>

                {/* Call Control Overlay */}
                <div className="flex items-center justify-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setWaliMicOn(!waliMicOn)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${waliMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/35'}`}
                    title={waliMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {waliMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  <button 
                    onClick={() => setWaliVideoOn(!waliVideoOn)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${waliVideoOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/35'}`}
                    title={waliVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    {waliVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>
                  <button 
                    onClick={() => setIsWaliCallActive(false)}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/20"
                    title="End Call"
                  >
                    <PhoneOff size={14} /> {locale === 'am' ? 'ጥሪ አቁም' : 'End Call'}
                  </button>
                </div>
              </div>
            ) : (
              /* Messages Area */
              <>
                <div className="flex-1 overflow-y-auto my-6 space-y-4 pr-2 custom-scrollbar">
                  {waliMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                      <MessageCircle size={36} className="opacity-30" />
                      <p className="text-xs uppercase tracking-widest font-bold">No messages yet</p>
                      <p className="text-[10px] max-w-xs leading-relaxed">Guardians and candidates can start the discussion on marriage plans here.</p>
                    </div>
                  ) : (
                    waliMessages.map(msg => {
                      const isOwn = msg.sender_id === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-gray-500">{msg.sender_name}</span>
                            {/* Check if sender is not one of the candidates (must be a guardian) */}
                            {msg.sender_id !== currentUser?.id && msg.sender_id !== selectedMatch.id && (
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-black uppercase">Guardian / አስታራቂ</span>
                            )}
                          </div>
                          <div className={`p-4 rounded-2xl max-w-md text-xs font-semibold leading-relaxed shadow-sm ${
                            isOwn ? 'bg-primary text-white rounded-tr-none' : 'bg-muted/50 text-accent rounded-tl-none border border-muted'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendWaliMessage} className="flex gap-4 items-center border-t border-muted pt-4">
                  <input 
                    type="text" 
                    placeholder={locale === 'am' ? 'መልእክትዎን እዚህ ይጻፉ...' : 'Type message here...'}
                    value={newWaliMessage}
                    onChange={(e) => setNewWaliMessage(e.target.value)}
                    className="flex-1 bg-muted/30 border border-muted rounded-2xl p-4 text-xs focus:outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!newWaliMessage.trim()}
                    className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20 shrink-0"
                  >
                    <Send size={18} className="ml-0.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] border border-muted p-8 text-center space-y-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-accent italic tracking-tighter">
                {locale === 'am' ? 'ዕለታዊ ገደብ ላይ ደርሰዋል' : 'Daily Limit Exhausted'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium px-2">
                {upgradeModalText}
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.reload();
                }}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-102 active:scale-98 transition-all"
              >
                {locale === 'am' ? 'አሁኑኑ መለያዎን ያሳድጉ' : 'Upgrade / Verify Now'}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full bg-muted text-gray-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-muted/75 transition-all"
              >
                {locale === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] border border-muted p-8 text-center space-y-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-accent italic tracking-tighter">
                {locale === 'am' ? 'የጥሪ ፈቃደኝነት ማረጋገጫ' : 'Mutual Call Consent'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium px-2">
                {locale === 'am' 
                  ? 'ጥሪውን ለመጀመር ፈቃደኛ መሆንዎን ያረጋግጡ። ጥሪው የሚጀምረው ሁለቱም ወገኖች ፈቃደኛነታቸውን ሲያረጋግጡ ብቻ ነው።' 
                  : 'Please confirm your consent to start this secure call. Communication will establish only when both candidates consent.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setIsCallVideo(pendingCallVideo);
                  // We are the CALLER — always show Outgoing call UI
                  setIsIncomingCall(false);
                  setActiveCallMatch(selectedMatch);
                  if (currentUser && selectedMatch) {
                    const roomId = [currentUser.id, selectedMatch.id].sort().join('_');
                    // Broadcast ONLY to the recipient's personal channel
                    const targetChan = supabase.channel(`user_calls_${selectedMatch.id}`);
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
                }}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-102 active:scale-98 transition-all"
              >
                {locale === 'am' ? 'እስማማለሁ (I Consent)' : 'I Consent'}
              </button>
              <button
                onClick={() => setShowConsentModal(false)}
                className="w-full bg-muted text-gray-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-muted/75 transition-all"
              >
                {locale === 'am' ? 'አልስማማም (Decline)' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
