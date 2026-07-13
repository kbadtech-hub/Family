'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calculateCompatibility } from '@/lib/compatibility';
import { OfflineCache } from '@/lib/offline-cache';
import {
  Home,
  MessageCircle,
  Users,
  UserCircle,
  Heart,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  Globe,
  ChevronDown,
  AlertCircle,
  LogOut,
  ChevronRight,
  Gift,
  Sparkles,
  Camera,
  Send,
  Image as ImageIcon,
  X,
  BarChart2,
  User
} from 'lucide-react';
import CommunityView from '@/components/dashboard/CommunityView';
import PostCard from '@/components/dashboard/PostCard';

import PaymentTab from '@/components/dashboard/PaymentTab';
import ChatView from '@/components/dashboard/ChatView';
import ProfileView from '@/components/dashboard/ProfileView';
import GiftsView from '@/components/dashboard/GiftsView';
import WeddingPlannerView from '@/components/dashboard/WeddingPlannerView';
import MatchDetailView from '@/components/dashboard/MatchDetailView';
import SwipeCards from '@/components/dashboard/SwipeCards';
import DashboardCard from '@/components/dashboard/DashboardCard';
import LockOverlay from '@/components/dashboard/LockOverlay';
import GiftModal from '@/components/dashboard/GiftModal';
import AcademyView from '@/components/dashboard/AcademyView';
import SubscriptionGate from '@/components/SubscriptionGate';
import { getUserTier, calculateCompletionRate } from '@/lib/tiers';
import { unregisterPushNotifications } from '@/lib/push-notifications';

function DashboardContent() {
  const t = useTranslations('Dashboard');
  const n = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    trial_ends_at: string | null;
    currency_locked: 'USD' | 'ETB';
    onboarding_completed: boolean;
    role: string;
    is_premium?: boolean;
    gender: string | null;
    premium_until?: string | null;
    coins?: number;
    verification_status?: string | null;
    is_verified?: boolean;
  }

  interface Match {
    id: string;
    name: string;
    match_percent: number;
    image: string;
    profile?: any;
  }

  const [matches, setMatches] = useState<Match[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('loading');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  // Trial model removed (Blueprint v4.0) â€” using freemium tier-based limits
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, string>>({});
  const [matchingView, setMatchingView] = useState<'grid' | 'swipe'>('grid');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [hasVouchedRecords, setHasVouchedRecords] = useState(false);
  const [isGuardianLinked, setIsGuardianLinked] = useState(false);
  const [unlockedProfileIds, setUnlockedProfileIds] = useState<Set<string>>(new Set());
  const [showPaywallTarget, setShowPaywallTarget] = useState<any>(null);
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [activeGiftCandidate, setActiveGiftCandidate] = useState<any>(null);
  const [activeRequestNotification, setActiveRequestNotification] = useState<any>(null);

  // Social Feed Integration States (vibe matching)
  const tc = useTranslations('Community');
  const [posts, setPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'none'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [coinPostConfirm, setCoinPostConfirm] = useState(false);
  const COIN_PER_POST = 20;

  const getCandidatesLabel = (count: number, currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return `${count} ዕጩዎች`;
      case 'om': return `${count} dorgomaa`;
      case 'ar': return `${count} مرشحين`;
      case 'ti': return `${count} ሕፁያት`;
      case 'so': return `${count} musharaxiin`;
      case 'en':
      default: return `${count} candidates`;
    }
  };

  const getPremiumSub = (currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return 'ያልተገደበ ግጥሚያዎችን፣ ሙሉ የፕሮፋይል ዝርዝሮችን እና ቅድሚያ የሚሰጠውን ድጋፍ ያግኙ።';
      case 'om': return 'Garmalee wal-gitiinsaa daangaa malee, odeeffannoo guutuu piroofaayilaa fi deeggarsa dursa argadhu.';
      case 'ar': return 'احصل على تطابقات غير محدودة، وتفاصيل الملف الشخصي الكاملة، ودعم ذو أولوية.';
      case 'ti': return 'ዘይተደረተ ግጥምማት፣ ምሉእ ዝርዝር ፕሮፋይልን ቀዳምነት ዝወሃቦ ደገፍን ረኸቡ።';
      case 'so': return 'Hel ku-habboonaan aan xadidnayn, faahfaahinta profile-ka oo buuxda, iyo taageero mudnaan leh.';
      case 'en':
      default: return 'Unlock unlimited matches, full profile details, and priority support.';
    }
  };

  const getFriendRequestText = (senderName: string, currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return senderName ? `${senderName} የጓደኝነት ጥያቄ ልኮልዎታል።` : 'የጓደኝነት ጥያቄ ልኮልዎታል።';
      case 'om': return senderName ? `${senderName} gaaffii michummaa isinii ergeera.` : 'gaaffii michummaa isinii ergeera.';
      case 'ar': return senderName ? `أرسل لك ${senderName} طلب صداقة.` : 'أرسل لك طلب صداقة.';
      case 'ti': return senderName ? `${senderName} ናይ ዕርክነት ሕቶ ልኢኹልካ ኣሎ።` : 'ናይ ዕርክነት ሕቶ ልኢኹልካ ኣሎ።';
      case 'so': return senderName ? `${senderName} wuxuu kuu soo diray codsi saaxiibtinimo.` : 'wuxuu kuu soo diray codsi saaxiibtinimo.';
      case 'en':
      default: return senderName ? `${senderName} sent you a friend request.` : 'sent you a friend request.';
    }
  };

  const getAcceptLabel = (currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return 'ተቀበል';
      case 'om': return 'Fudhadhu';
      case 'ar': return 'قبول';
      case 'ti': return 'ተቐበል';
      case 'so': return 'Oggolow';
      case 'en':
      default: return 'Accept';
    }
  };

  const getDeclineLabel = (currentLocale: string) => {
    switch (currentLocale) {
      case 'am': return 'አትቀበል';
      case 'om': return 'Didu';
      case 'ar': return 'رفض';
      case 'ti': return 'ኣይትቀበል';
      case 'so': return 'Diid';
      case 'en':
      default: return 'Decline';
    }
  };


  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dashboardPollRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeTab === 'dashboard' && !feedLoading) {
      const pollOptions = [
        { label: "Daily Video Chat", percent: 45 },
        { label: "Trust & Transparency", percent: 82 },
        { label: "Future Plan", percent: 34 }
      ];
      pollOptions.forEach((opt, i) => {
        if (dashboardPollRef.current[i]) {
          dashboardPollRef.current[i]!.style.width = `${opt.percent}%`;
        }
      });
    }
  }, [activeTab, feedLoading]);


  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'áŠ áˆ›áˆ­áŠ›' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' },
    { id: 'ti', label: 'á‰µáŒáˆ­áŠ›' },
    { id: 'so', label: 'Soomaali' }
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return '💎';
      case 'platinum': return '🌟';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze':
      default: return '🥉';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'diamond': return locale === 'am' ? 'á‹³á‹­áˆ˜áŠ•á‹µ (Diamond Tier)' : 'Diamond Tier';
      case 'platinum': return locale === 'am' ? 'á•áˆ‹á‰²áŠ’á‹¨áˆ (Platinum Tier)' : 'Platinum Tier';
      case 'gold': return locale === 'am' ? 'áŒŽáˆá‹°áŠ• (Gold Tier)' : 'Gold Tier';
      case 'silver': return locale === 'am' ? 'á‰¤á‹šáŠ­ áˆ›áˆ¨áŒ‹áŒˆáŒ« (Silver Tier)' : 'Basic Verified (Silver Tier)';
      case 'bronze':
      default: return locale === 'am' ? 'á‹«áˆá‰°áˆ¨áŒ‹áŒˆáŒ  (Bronze Tier)' : 'Unverified (Bronze Tier)';
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    try {
      // 1. Clear all offline/local caches so no stale data persists
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // Clear Supabase auth cookies as well
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
        });
      }
      // 2. Unregister Firebase push notifications
      await unregisterPushNotifications().catch(() => {});
      // 3. Sign out from Supabase (clears server-side session)
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Logout] Error during sign-out:', e);
    }
    // 4. Always redirect to landing page using replace() so user cannot go Back to dashboard
    router.replace('/');
  };

  const renderRoyalAvatar = (avatarUrl: string | null, gender: string | null, sizeClass = "w-10 h-10") => {
    const isRoyal = completionRate === 100 && userTier === 'diamond';
    return (
      <div className="relative flex items-center justify-center shrink-0">
        {isRoyal && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] animate-bounce z-10">
            👑
          </div>
        )}
        <div className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-muted transition-all border-2 ${
          isRoyal 
            ? (gender === 'Male' ? 'border-amber-400 ring-2 ring-amber-300' : 'border-pink-400 ring-2 ring-pink-300')
            : 'border-primary/20'
        }`}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={24} className="text-gray-300" />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'payment') {
       setShowPayment(true);
       setActiveTab('dashboard');
    }
  }, [searchParams]);

  // Profile dropdown click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No active session â€” clear stale cache and redirect to login
        OfflineCache.clearAll?.();
        router.replace('/login');
        return;
      }

      // Load Cached Profile if available to show immediately
      const cachedProfile = OfflineCache.getCachedData(`profile_${user.id}`);
      if (cachedProfile) {
        setProfile(cachedProfile);
      }

      // 1. Fetch Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        if (!profileData.onboarding_completed) {
          router.push('/onboarding');
          return;
        }
        if (profileData.warning_message) {
          setWarningMessage(profileData.warning_message);
        }
        // Fetch coin balance from user_wallets (Blueprint v4.0)
        const { data: walletData } = await supabase.from('user_wallets').select('coin_balance').eq('id', user.id).single();
        const coins = walletData ? Number(walletData.coin_balance) : 0;
        
        const mergedProfile = { ...(profileData as Profile), coins };
        setProfile(mergedProfile);
        OfflineCache.cacheData(`profile_${user.id}`, mergedProfile);

        // Fetch vouch count
        const { count: vouchCount } = await supabase
          .from('vouch_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('vouch_status', 'approved');
        setHasVouchedRecords(vouchCount !== null && vouchCount > 0);

        // Fetch guardian count
        const { count: guardianCount } = await supabase
          .from('guardians')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'approved');
        setIsGuardianLinked(guardianCount !== null && guardianCount > 0);

        // Fetch profile unlocks
        const { data: unlocksData } = await supabase
          .from('profile_unlocks')
          .select('target_id')
          .eq('user_id', user.id);
        const unlockSet = new Set((unlocksData || []).map(u => u.target_id));
        setUnlockedProfileIds(unlockSet);
      }

      // 2. Fetch Verification â€” profiles.verification_status is the source of truth
      // If the profile says 'verified', trust it permanently (no re-verification needed)
      // NOTE: Parentheses are REQUIRED â€” without them JS evaluates left-to-right and
      //       any truthy verification_status string (e.g. 'unverified') makes the whole
      //       expression resolve to 'verified', which is incorrect.
      const profileVerifyStatus = (profileData?.verification_status === 'verified' || profileData?.is_verified === true) ? 'verified' : null;
      
      if (profileVerifyStatus === 'verified') {
        setVerificationStatus('verified');
      } else {
        // Fallback: check verifications table for latest submission status
        const { data: verifyData } = await supabase.from('verifications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const currentVerifyStatus = verifyData?.status || 'none';
        setVerificationStatus(currentVerifyStatus);

        // If verifications table says verified but profiles doesn't, sync profiles
        if (currentVerifyStatus === 'verified') {
          await supabase.from('profiles').update({
            verification_status: 'verified',
            is_verified: true
          }).eq('id', user.id);
        }
      }

      // 3. Fetch Payment
      const { data: paymentData } = await supabase.from('payments')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const currentPaymentApproved = paymentData?.status === 'approved';
      if (paymentData) setPaymentStatus(paymentData.status);

      // 4. Calculate Premium Status
      const isPremium = currentPaymentApproved || 
                       (profileData?.premium_until && new Date(profileData.premium_until) > new Date()) ||
                       ['admin', 'super_admin', 'expert'].includes(profileData?.role);
      
      setProfile(prev => prev ? { ...prev, is_premium: isPremium } : null);
      // No trial tracking â€” Freemium model uses tier-based limits (Blueprint v4.0)

      // 5. Fetch Matches (Gender-Based Logic)
      // Load Cached Matches if available
      const cachedMatches = OfflineCache.getCachedData(`matches_${user.id}`);
      if (cachedMatches) {
        setMatches(cachedMatches);
      }

      // Fetch Blocked User IDs
      const { data: blockedData } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      
      const blockedIds = (blockedData || []).map(b => b.blocker_id === user.id ? b.blocked_id : b.blocker_id);

      // 5. Fetch Matches (Gender-Based Logic)
      let matchQuery = supabase.from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('onboarding_completed', true);
      
      if (blockedIds.length > 0) {
        matchQuery = matchQuery.not('id', 'in', `(${blockedIds.join(',')})`);
      }
      
      // Apply Gender Filter: Men see Women, Women see Men
      if (profileData?.gender === 'Male') {
        matchQuery = matchQuery.eq('gender', 'Female');
      } else if (profileData?.gender === 'Female') {
        matchQuery = matchQuery.eq('gender', 'Male');
      }

      const { data: profiles } = await matchQuery.limit(20);

      if (profiles && profileData) {
        let filteredProfiles = profiles || [];
        if (profileData.partner_location && profileData.partner_location.length > 0) {
          const prefs = Array.isArray(profileData.partner_location)
            ? profileData.partner_location
            : typeof profileData.partner_location === 'string'
            ? [profileData.partner_location]
            : [];
          
          const hasAnywhere = prefs.some((p: string) => p.toLowerCase() === 'anywhere');
          if (!hasAnywhere) {
            filteredProfiles = (profiles || []).filter(p => {
              const candidateCountry = typeof p.location === 'string'
                ? p.location
                : p.location?.country || '';
              return prefs.some((pref: string) => pref.trim().toLowerCase() === candidateCountry.trim().toLowerCase());
            });
          }
        }

        const candidateIds = filteredProfiles.map(p => p.id);
        const { data: vouchedData } = await supabase
          .from('vouch_records')
          .select('user_id')
          .in('user_id', candidateIds)
          .eq('vouch_status', 'approved');
        const vouchedSet = new Set((vouchedData || []).map(v => v.user_id));

        const { data: guardiansData } = await supabase
          .from('guardians')
          .select('user_id')
          .in('user_id', candidateIds)
          .eq('status', 'approved');
        const guardiansSet = new Set((guardiansData || []).map(g => g.user_id));

        const candidatesWithTrust = filteredProfiles.map(p => ({
          ...p,
          has_vouched: vouchedSet.has(p.id),
          is_guardian_linked: guardiansSet.has(p.id)
        }));
        setCandidates(candidatesWithTrust);
        const processedMatches = candidatesWithTrust.map(p => ({
          id: p.id,
          name: p.full_name || 'Anonymous',
          match_percent: calculateCompatibility(profileData, p),
          image: p.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200',
          profile: p
        }));
        const sortedMatches = processedMatches.sort((a, b) => b.match_percent - a.match_percent);
        setMatches(sortedMatches);
        OfflineCache.cacheData(`matches_${user.id}`, sortedMatches);
      }

      // 6. Fetch Pending Friend Requests Count
      const { count } = await supabase.from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      
      setPendingRequestsCount(count || 0);

      // 7. Fetch Friend Suggestions (Strict Gender Separation)
      let suggestionsQuery = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);
      
      if (blockedIds.length > 0) {
        suggestionsQuery = suggestionsQuery.not('id', 'in', `(${blockedIds.join(',')})`);
      }
      
      if (profileData?.gender === 'Male') {
        suggestionsQuery = suggestionsQuery.eq('gender', 'Female');
      } else if (profileData?.gender === 'Female') {
        suggestionsQuery = suggestionsQuery.eq('gender', 'Male');
      }
      
      const { data: suggestionsData } = await suggestionsQuery.limit(10);
      
      if (suggestionsData) {
        // Check friendship status for suggestions
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        const statuses: Record<string, string> = {};
        friendshipData?.forEach(f => {
          const otherId = f.sender_id === user.id ? f.receiver_id : f.sender_id;
          statuses[otherId] = f.status;
        });
        
        setFriendshipStatuses(statuses);
        setSuggestions(suggestionsData.filter(s => !statuses[s.id] || statuses[s.id] === 'rejected'));
      }

      // 8. Fetch Community Posts for Social Feed
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('*, profiles(full_name, avatar_url, star_sign, is_verified, role)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (postsData) {
        setPosts(postsData);
      }
      setFeedLoading(false);
    };
    fetchData();
  }, []);


  const isPremium = ((profile as any)?.premium_until && new Date((profile as any).premium_until) > new Date()) || 
                    paymentStatus === 'approved' || 
                    ['admin', 'super_admin', 'expert'].includes((profile as any)?.role);
  const isAdmin = ['admin', 'super_admin'].includes((profile as any)?.role);

  const completionRate = calculateCompletionRate(profile as any);
  const userTier = getUserTier(profile as any, hasVouchedRecords);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    if (!profile?.is_premium && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      const userCoins = profile?.coins || 0;
      if (userCoins < COIN_PER_POST) {
        alert(locale === 'am' 
          ? `áˆˆáˆ›áˆµáŒ á‰€áˆ ${COIN_PER_POST} á‰¤á‰°áˆ°á‰¥ áŠ®á‹­áŠ• á‹«áˆµáˆáˆáŒ‹á‰¸á‹‹áˆá¢ áˆ°á‰¥áˆµáŠ­áˆªá•áˆ½áŠ• á‹ˆá‹­áˆ áŠ®á‹­áŠ• á‹­áŒá‹™á¢`
          : `You need ${COIN_PER_POST} Beteseb Coins to post. Please subscribe or buy coins.`);
        return;
      }
      if (!coinPostConfirm) {
        setCoinPostConfirm(true);
        return;
      }
    }

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-z]{2,})/gi;
    const hasLinks = urlRegex.test(newPostContent);

    if (hasLinks && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
       alert(tc('adminOnly'));
       return;
    }

    setIsSubmitting(true);
    setCoinPostConfirm(false);
    
    try {
      const response = await fetch(`/${locale}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent.trim() })
      });
      const safety = await response.json();
      
      if (!safety.approved) {
        alert(`${tc('unsafeContent')}: ${safety.reason}`);
        setIsSubmitting(false);
        return;
      }
    } catch (e) {
      console.error("AI Moderation failed, using fallback", e);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Deduct coins
    if (!profile?.is_premium && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      const userCoins = profile?.coins || 0;
      await supabase.from('profiles').update({ coins: userCoins - COIN_PER_POST }).eq('id', user.id);
      setProfile(prev => prev ? { ...prev, coins: userCoins - COIN_PER_POST } : null);
    }

    const { error } = await supabase.from('community_posts').insert({
      author_id: user.id,
      content: newPostContent.trim(),
      topic: selectedTopic,
      category: selectedTopic,
      media_url: mediaUrl,
      media_type: mediaType === 'none' && hasLinks ? 'link' : mediaType,
      is_approved: true
    });

    if (!error) {
      setNewPostContent('');
      setMediaUrl(null);
      setMediaType('none');
      // Re-fetch posts
      const { data } = await supabase
        .from('community_posts')
        .select('*, profiles(full_name, avatar_url, star_sign, is_verified, role)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setPosts(data);
    }
    setIsSubmitting(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    
    let uploadFile: File | Blob = file;
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await new Promise<Blob>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              const MAX_DIM = 800;
              if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                } else {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(file);
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              
              let quality = 0.7;
              const tryCompress = () => {
                canvas.toBlob((blob) => {
                  if (!blob) {
                    resolve(file);
                    return;
                  }
                  if (blob.size > 50 * 1024 && quality > 0.1) {
                    quality -= 0.15;
                    tryCompress();
                  } else {
                    resolve(blob);
                  }
                }, 'image/jpeg', quality);
              };
              tryCompress();
            };
            img.onerror = () => resolve(file);
          };
          reader.onerror = () => resolve(file);
        });
        uploadFile = compressed;
      } catch (err) {
        console.error("Compression failed", err);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const path = `community/${user.id}-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('user_photos').upload(path, uploadFile, {
          contentType: 'image/jpeg'
        });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(path);
          setMediaUrl(publicUrl);
          setMediaType('image');
        }
    }
    setIsUploading(false);
  };

  // Real-time friend request listener
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`incoming-friendships-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `receiver_id=eq.${profile.id}`
        },
        async (payload: any) => {
          const newRequest = payload.new;
          if (newRequest && newRequest.status === 'pending') {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newRequest.sender_id)
              .single();

            if (senderProfile) {
              setActiveRequestNotification({
                friendshipId: newRequest.id,
                senderId: senderProfile.id,
                senderName: senderProfile.full_name || 'Someone',
                senderAvatar: senderProfile.avatar_url
              });
              setPendingRequestsCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleLike = async (candidateId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    // Check for incoming friend request from candidate to current user
    const { data: incoming } = await supabase
      .from('friendships')
      .select('*')
      .eq('sender_id', candidateId)
      .eq('receiver_id', user.id)
      .maybeSingle();

    if (incoming) {
      // Auto-accept it to make them friends!
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', incoming.id);

      if (!error) {
        setFriendshipStatuses(prev => ({ ...prev, [candidateId]: 'accepted' }));
        alert(locale === 'am' ? 'á‰°á‹›áˆá‹°á‹‹áˆ! áŠ áˆáŠ• áˆ˜áŠáŒ‹áŒˆáˆ­ á‹­á‰½áˆ‹áˆ‰á¢' : "It's a Match! You can now start chatting.");
        
        // Transition to chat with this user
        localStorage.setItem('beteseb_active_chat_user_id', candidateId);
        setActiveTab('chat');
      } else {
        alert(error.message);
      }
    } else {
      // Create pending friendship request
      const { error } = await supabase
        .from('friendships')
        .insert({
          sender_id: user.id,
          receiver_id: candidateId,
          status: 'pending'
        });

      if (!error) {
        setFriendshipStatuses(prev => ({ ...prev, [candidateId]: 'pending' }));
        alert(locale === 'am' ? 'áˆ‹á‹­áŠ­ á‰°á‹°áˆ­áŒ“áˆ!' : 'Profile liked!');
        
        // Try sending push
        fetch(`/${locale}/api/notifications/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: candidateId,
            title: 
              locale === 'am' ? 'አዲስ ላይክ' :
              locale === 'om' ? 'Jaalala Piroofaayilaa Haaraya' :
              locale === 'ar' ? 'إعجاب جديد بالملف الشخصي' :
              locale === 'ti' ? 'ሓዱሽ ላይክ' :
              locale === 'so' ? 'Like Profile Cusub' :
              'New Profile Like',
            body: locale === 'am'
              ? `${profile.full_name} áˆ‹á‹­áŠ­ áŠ á‹µáˆ­áŒŽá‹Žá‰³áˆ!`
              : `${profile.full_name} liked your profile!`
          })
        }).catch(() => {});
      } else {
        alert(error.message);
      }
    }
  };

  const handleDislike = async (candidateId: string) => {
    setDislikedIds(prev => {
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Silently ignore duplicate-key errors (user already passed this candidate)
      try {
        await supabase.from('friendships').insert({
          sender_id: user.id,
          receiver_id: candidateId,
          status: 'rejected'
        });
      } catch (_) { /* ignore */ }
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const { error } = await supabase.from('friendships').insert({
      sender_id: user.id,
      receiver_id: targetId,
      status: 'pending'
    });

    if (!error) {
      setFriendshipStatuses(prev => ({ ...prev, [targetId]: 'pending' }));
      alert(locale === 'am' ? 'á‹¨áŒ“á‹°áŠáŠá‰µ áŒ¥á‹«á‰„ á‰°áˆáŠ³áˆ!' : 'Friend request sent!');
      
      // Trigger push notification to target user
      fetch(`/${locale}/api/notifications/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          title: locale === 'am' ? 'áŠ á‹²áˆµ á‹¨áŒ“á‹°áŠáŠá‰µ áŒ¥á‹«á‰„' : 'New Friend Request',
          body: locale === 'am'
            ? `${profile.full_name} á‹¨áŒ“á‹°áŠáŠá‰µ áŒ¥á‹«á‰„ áˆáŠ®áˆá‹Žá‰³áˆ!`
            : `${profile.full_name} has sent you a friend request.`
        })
      }).catch(() => {});
    } else {
      alert(error.message);
    }
  };

  const handleCardClick = (candidate: any) => {
    // If premium, or self, or already unlocked, open details
    if (profile?.is_premium || profile?.id === candidate.id || unlockedProfileIds.has(candidate.id)) {
      setSelectedMatchId(candidate.id);
    } else {
      // Trigger Lock Overlay paywall
      setShowPaywallTarget(candidate);
    }
  };

  const handleUnlockSuccess = (targetId: string) => {
    setUnlockedProfileIds(prev => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });
    setProfile(prev => prev ? { ...prev, coins: Math.max(0, (prev.coins || 0) - 10) } : null);
    setSelectedMatchId(targetId);
    setShowPaywallTarget(null);
  };

  const handleAcceptNotification = async (friendshipId: string, senderId: string, senderName: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) {
      setActiveRequestNotification(null);
      setPendingRequestsCount(prev => Math.max(0, prev - 1));
      alert(locale === 'am' ? 'áŒ“á‹°áŠáŠá‰µ á‰°áˆ¨áŒ‹áŒáŒ§áˆ!' : 'Friend request accepted!');
      
      // Automatically open chat with the sender!
      localStorage.setItem('beteseb_active_chat_user_id', senderId);
      setActiveTab('chat');
    } else {
      alert(error.message);
    }
  };

  const handleDeclineNotification = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      setActiveRequestNotification(null);
      setPendingRequestsCount(prev => Math.max(0, prev - 1));
    } else {
      alert(error.message);
    }
  };


  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col md:flex-row overflow-x-hidden pb-20 md:pb-0" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar - Desktop Only */}
      <aside className={`hidden md:flex md:w-64 bg-[#0F172A] text-white md:flex-col p-8 sticky top-0 md:h-screen z-50 ${locale === 'ar' ? 'md:border-l' : 'md:border-r'} border-white/5`}>
        <div className="flex items-center gap-4 mb-12 group cursor-pointer">
          <Heart size={32} className="text-primary fill-primary/10 group-hover:fill-primary transition-all duration-300" />
          <span className="text-xl font-black italic uppercase tracking-tighter">
            {locale === 'am' ? 'á‰¤á‰°áˆ°á‰¥' : locale === 'ar' ? 'Ø¨ÙŠØªØ³Ø¨' : 'BETESEB'}
          </span>
        </div>

        <nav className="flex md:flex-col gap-3 flex-1">
          {[
            { id: 'dashboard', icon: Home, label: n('dashboard') },
            { id: 'chat', icon: MessageCircle, label: n('chat') },
            { id: 'community', icon: Users, label: n('community') },
            { id: 'workshops', icon: GraduationCap, label: n('workshops') },
            { id: 'wedding', icon: Sparkles, label: locale === 'am' ? 'á‹¨áˆ°áˆ­áŒ áŠ¥á‰…á‹µ' : 'Wedding Planner' },
            { id: 'gifts', icon: Gift, label: locale === 'am' ? 'áˆµáŒ¦á‰³á‹Žá‰½' : 'Gifts' },
            { id: 'profile', icon: UserCircle, label: n('profile') }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 md:flex-none flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 relative ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:bg-white/5'
                }`}
            >
              <item.icon size={22} />
              <span className="hidden md:block font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
              {item.id === 'chat' && pendingRequestsCount > 0 && (
                <span className="absolute top-2 right-2 md:relative md:top-0 md:right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-[#0F172A] md:border-none animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5 hidden md:block">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] text-red-400 hover:bg-red-400/10 transition-all duration-300"
           >
              <LogOut size={22} />
              <span className="font-bold text-[10px] uppercase tracking-widest">{n('logout')}</span>
           </button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] text-white z-50 border-t border-white/5 px-6 py-3 flex justify-between items-center shadow-2xl">
        {[
          { id: 'dashboard', icon: Home, label: n('dashboard') },
          { id: 'chat', icon: MessageCircle, label: n('chat') },
          { id: 'community', icon: Users, label: n('community') },
          { id: 'workshops', icon: GraduationCap, label: n('workshops') },
          { id: 'gifts', icon: Gift, label: locale === 'am' ? 'áˆµáŒ¦á‰³á‹Žá‰½' : 'Gifts' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
            className={`p-3 rounded-2xl transition-all duration-300 relative ${activeTab === item.id ? 'bg-primary text-white scale-110 shadow-lg' : 'text-white/40'}`}
          >
            <item.icon size={22} />
            {item.id === 'chat' && pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0F172A] animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-16 overflow-y-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 w-full border-b border-border pb-6">
          <div className="flex items-center justify-between w-full">
            {/* Company Logo in Header */}
            <div className="flex items-center gap-4">
              <Image 
                src="/logo.png" 
                alt="Beteseb Logo" 
                width={200} 
                height={45} 
                className="h-10 w-auto object-contain"
                priority
              />
              <div className="hidden sm:block h-6 w-[1px] bg-border" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-[#0F172A] italic tracking-tight">{t('welcome')}</h1>
                <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest">{t('subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border hover:border-primary transition-all text-xs font-bold"
                >
                  <Globe size={14} className="text-primary" />
                  <span className="uppercase">{locale}</span>
                  <ChevronDown size={12} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangOpen && (
                  <div className={`absolute top-full ${locale === 'ar' ? 'left-0' : 'right-0'} mt-2 w-40 bg-white border border-border rounded-2xl shadow-xl z-[100] overflow-hidden`}>
                    {languages.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full px-5 py-3 text-left text-xs font-bold hover:bg-[#F8F4F1] transition-all ${locale === lang.id ? 'text-primary bg-[#F8F4F1]' : 'text-gray-600'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Avatar Link with Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="hover:scale-105 active:scale-95 transition-all focus:outline-none flex items-center"
                  aria-label="Profile options"
                >
                  {renderRoyalAvatar(profile?.avatar_url || null, (profile as any)?.gender || null)}
                </button>

                {isProfileDropdownOpen && (
                  <div className={`absolute top-full ${locale === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-white border border-border rounded-3xl shadow-2xl z-[100] overflow-hidden`}>
                    {[
                      { id: 'dashboard', icon: Home, label: n('dashboard') },
                      { id: 'chat', icon: MessageCircle, label: n('chat') },
                      { id: 'community', icon: Users, label: n('community') },
                      { id: 'workshops', icon: GraduationCap, label: n('workshops') },
                      { id: 'wedding', icon: Sparkles, label: locale === 'am' ? 'á‹¨áˆ°áˆ­áŒ áŠ¥á‰…á‹µ' : 'Wedding Planner' },
                      { id: 'gifts', icon: Gift, label: locale === 'am' ? 'áˆµáŒ¦á‰³á‹Žá‰½' : 'Gifts' },
                      { id: 'profile', icon: UserCircle, label: n('profile') }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-left text-xs font-bold hover:bg-[#F8F4F1] transition-all flex items-center gap-3 ${activeTab === item.id ? 'text-primary bg-[#F8F4F1]' : 'text-gray-600'}`}
                      >
                        <item.icon size={16} className={activeTab === item.id ? 'text-primary' : 'text-gray-400'} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                    
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-5 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
                      >
                        <LogOut size={16} />
                        <span>{n('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Verification Banner â€” use the synced local verificationStatus state, NOT the raw
            profile fields which may be stale on first render before DB sync completes */}
        {verificationStatus !== 'verified' && verificationStatus !== 'pending' && verificationStatus !== 'loading' && (
          <div className="mb-10 bg-gradient-to-r from-primary to-orange-400 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                     <ShieldCheck size={14} /> {t('actionRequired')}
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter">
                    {t('verifyBannerTitle')}
                  </h2>
                  <p className="text-white/80 font-medium max-w-lg">
                    {t('verifyBannerSub')}
                  </p>
               </div>
               <button 
                 onClick={() => router.push('/onboarding?step=4')}
                 className="bg-white text-primary px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
               >
                  {t('verifyNow')} <ChevronRight size={20} />
               </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Floating Friend-Request Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeRequestNotification && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[300] w-[92vw] max-w-sm animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-primary/20 p-5 flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                {activeRequestNotification.senderAvatar ? (
                  <Image src={activeRequestNotification.senderAvatar} alt="" fill className="object-cover" />
                ) : (
                  <UserCircle className="w-full h-full text-gray-300 p-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-accent leading-snug">
                  <span className="text-primary">{activeRequestNotification.senderName}</span>{' '}
                  {locale === 'am' ? 'á‹¨áŒ“á‹°áŠáŠá‰µ áŒ¥á‹«á‰„ áˆáŠ³áˆá‹Žá¢' : 'sent you a friend request.'}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAcceptNotification(
                      activeRequestNotification.friendshipId,
                      activeRequestNotification.senderId,
                      activeRequestNotification.senderName
                    )}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    {locale === 'am' ? 'á‰€á‰ áˆ' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDeclineNotification(activeRequestNotification.friendshipId)}
                    className="flex-1 py-2 rounded-xl border-2 border-border text-gray-500 text-[10px] font-black uppercase tracking-wider hover:bg-muted active:scale-95 transition-all"
                  >
                    {locale === 'am' ? 'áŠ á‰µá‰€á‰ áˆ' : 'Decline'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setActiveRequestNotification(null)}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0 p-1"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Lock Overlay Paywall â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {showPaywallTarget && profile && (
          <LockOverlay
            targetUserId={showPaywallTarget.id}
            targetUserName={showPaywallTarget.full_name || 'this user'}
            currentCoins={profile.coins || 0}
            costCoins={10}
            locale={locale}
            onClose={() => setShowPaywallTarget(null)}
            onUnlockSuccess={() => handleUnlockSuccess(showPaywallTarget.id)}
            onUpgrade={() => { setShowPaywallTarget(null); setShowPayment(true); }}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Section heading */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A] flex items-center gap-2">
                <Heart size={20} className="text-primary fill-primary/20" />
                {locale === 'am' ? 'á‰°á‹›áˆ›áŒ…' : 'á‰°á‹›áˆ›áŒ…'}
              </h2>
              {profile && (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {matches.filter(m => !dislikedIds.has(m.id)).length}{' '}
                  {locale === 'am' ? 'á‹•áŒ©á‹Žá‰½' : 'candidates'}
                </span>
              )}
            </div>

            {/* Vertical DashboardCard feed */}
            <div className="flex flex-col items-center gap-8 pb-6">
              {matches.length === 0 ? (
                <div className="py-24 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  {t('searching')}
                </div>
              ) : (
                matches
                  .filter(m => !dislikedIds.has(m.id))
                  .map(match => (
                    <DashboardCard
                      key={match.id}
                      currentUser={profile}
                      candidate={match.profile || match}
                      locale={locale}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onSendFriendRequest={handleSendFriendRequest}
                      onSendGift={(c) => setActiveGiftCandidate(c)}
                      onCardClick={() => handleCardClick(match.profile || match)}
                      friendshipStatus={friendshipStatuses[match.id] || null}
                    />
                  ))
              )}

              {/* Premium CTA card at absolute bottom of feed */}
              {!isPremium && (
                <div className="w-full max-w-md mx-auto bg-gradient-to-br from-primary via-orange-400 to-amber-400 rounded-[3rem] p-10 text-white text-center space-y-5 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto">
                    <Sparkles size={32} className="fill-white" />
                  </div>
                  <div className="space-y-2 relative">
                    <h3 className="text-2xl font-black italic tracking-tight">
                      {locale === 'am' ? 'á•áˆªáˆšá‹¨áˆ á‹­áŠ­áˆá‰±' : 'á•áˆªáˆšá‹¨áˆ á‹­áŠ­áˆá‰±'}
                    </h3>
                    <p className="text-white/80 text-xs font-bold max-w-xs mx-auto leading-relaxed">
                      {locale === 'am'
                        ? 'á‹«áˆá‰°áŒˆá‹°á‰  áŒáŒ¥áˆšá‹«á‹Žá‰½áŠ•á£ áˆ™áˆ‰ á‹¨á•áˆ®á‹á‹­áˆ á‹áˆ­á‹áˆ®á‰½áŠ• áŠ¥áŠ“ á‰…á‹µáˆšá‹« á‹¨áˆšáˆ°áŒ á‹áŠ• á‹µáŒ‹á á‹«áŒáŠ™á¢'
                        : 'Unlock unlimited matches, full profile details, and priority support.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-white text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {t('premium.unlock')} â†’
                  </button>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Tab Components */}
        {activeTab === 'chat' && (
           <div className="mt-10 h-[calc(100vh-200px)]">
              <SubscriptionGate allowVerifiedView={false}>
                 <ChatView isPremium={isPremium} />
              </SubscriptionGate>
           </div>
        )}

        {activeTab === 'workshops' && (
           <div className="mt-10">
              <SubscriptionGate allowVerifiedView={true}>
                 <AcademyView isPremium={isPremium} userCoins={profile?.coins || 0} />
              </SubscriptionGate>
           </div>
        )}

        {activeTab === 'community' && (
          <div className="mt-10">
            <SubscriptionGate allowVerifiedView={true}>
              <CommunityView 
                isVerified={verificationStatus === 'verified'} 
                isPremium={isPremium} 
                isAdmin={isAdmin} 
                userCoins={profile?.coins || 0} 
              />
            </SubscriptionGate>
          </div>
        )}

        {activeTab === 'wedding' && (
          <div className="mt-10">
             <WeddingPlannerView currency={profile?.currency_locked || 'ETB'} />
          </div>
        )}

        {activeTab === 'gifts' && (
          <div className="mt-10">
             <GiftsView locale={locale} />
          </div>
        )}

        {activeTab === 'profile' && profile && (
          <ProfileView 
            profile={profile}             onUpdate={() => {
               // Re-fetch profile to update dashboard UI and update offline cache
               supabase.auth.getUser().then(({ data: { user } }) => {
                 if (user) {
                   supabase.from('profiles').select('*').eq('id', user.id).single()
                     .then(({ data }) => {
                       if (data) {
                         setProfile(data as Profile);
                         OfflineCache.cacheData(`profile_${user.id}`, data);
                       }
                     });
                 }
               });
             }} 
          />
        )}
        {selectedMatchId && (
          <MatchDetailView 
            matchId={selectedMatchId} 
            currentUserProfile={profile}
            isPremium={isPremium}
            onClose={() => setSelectedMatchId(null)} 
            onStartChat={() => {
              setSelectedMatchId(null);
              setActiveTab('chat');
            }}
          />
        )}
        {warningMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
             <div className="bg-white max-w-md w-full p-8 rounded-[2.5rem] border border-red-500/20 text-center space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                   <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                   <h3 className="font-black text-accent text-lg uppercase tracking-tight italic">
                     {locale === 'am' ? 'áŠ áˆµá‰¸áŠ³á‹­ á‹¨áŠ áˆµá‰°á‹³á‹³áˆª áˆ›áˆ³áˆ°á‰¢á‹«' : 'Urgent System Alert'}
                   </h3>
                   <p className="text-xs text-gray-500 leading-relaxed italic">
                      {warningMessage}
                   </p>
                </div>
                <button 
                  onClick={async () => {
                     // Dismiss warning in DB
                     const { data: { user } } = await supabase.auth.getUser();
                     if (user) {
                        await supabase.from('profiles').update({ warning_message: null }).eq('id', user.id);
                     }
                     setWarningMessage(null);
                  }}
                  className="btn-primary w-full py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  {locale === 'am' ? 'á‰°áˆ¨á‹µá‰»áˆˆáˆ (Acknowledge)' : 'I Acknowledge'}
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold text-primary animate-pulse">Loading Beteseb Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
