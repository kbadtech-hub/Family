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
  Coins,
  Sparkles,
  Camera,
  Send,
  Image as ImageIcon,
  X,
  BarChart2,
  User,
  Crown,
  Loader2
} from 'lucide-react';
import CommunityView from '@/components/dashboard/CommunityView';
import PostCard from '@/components/dashboard/PostCard';

import PaymentTab from '@/components/dashboard/PaymentTab';
import SubscriptionPlansPage from '@/components/dashboard/SubscriptionPlansPage';
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
import WorkshopsView from '@/components/dashboard/WorkshopsView';
import SubscriptionGate from '@/components/SubscriptionGate';
import AppStoreBadges from '@/components/AppStoreBadges';
import { getUserTier, calculateCompletionRate } from '@/lib/tiers';
import { unregisterPushNotifications } from '@/lib/push-notifications';
import { moderateText } from '@/lib/moderation';

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
  const isFirstRender = useRef(true);

  interface Profile {
    id: string;
    email?: string | null;
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
  const [defaultPaymentTab, setDefaultPaymentTab] = useState<'premium' | 'vip'>('premium');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('loading');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  // Trial model removed (Blueprint v4.0) â€” using freemium tier-based limits
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, string>>({});
  const [matchingView, setMatchingView] = useState<'grid' | 'swipe'>('grid');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [hasVouchedRecords, setHasVouchedRecords] = useState(false);
  const [isGuardianLinked, setIsGuardianLinked] = useState(false);
  const [unlockedProfileIds, setUnlockedProfileIds] = useState<Set<string>>(new Set());
  const [showPaywallTarget, setShowPaywallTarget] = useState<any>(null);
  const [showVerificationBlockModal, setShowVerificationBlockModal] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState<null | 'premium' | 'vip'>(null);
  const [appLinks, setAppLinks] = useState<{ play_store_url?: string; app_store_url?: string }>({});
  // IP-based Ethiopia detection — drives currency display, fully independent of UI language
  const [isEthiopiaUser, setIsEthiopiaUser] = useState<boolean | null>(null);

  const handleTabClick = (tabId: string) => {
    const coreTabs = ['chat', 'community', 'workshops', 'wedding', 'gifts'];
    if (coreTabs.includes(tabId) && verificationStatus !== 'verified') {
      setShowVerificationBlockModal(true);
      return;
    }
    // Clear unread chat badge when user opens the chat tab
    if (tabId === 'chat') {
      setUnreadChatsCount(0);
    }
    setActiveTab(tabId);
  };

  // Load app store links from settings
  useEffect(() => {
    const fetchAppLinks = async () => {
      const { data } = await supabase.from('settings').select('play_store_url, app_store_url, social_links').limit(1).single();
      if (data) {
        setAppLinks({
          play_store_url: (data as any).play_store_url || (data as any).social_links?.play_store_url || '',
          app_store_url: (data as any).app_store_url || (data as any).social_links?.app_store_url || '',
        });
      }
    };
    fetchAppLinks();
  }, []);
  // ── IP-based Location Detection (currency) ─────────────────────────────────
  // Detects the user's actual country via IP — completely independent of locale.
  // Ethiopia (ET) → ETB prices; all other countries → USD prices.
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // profile.currency_locked is an admin override — respect it first
        if (profile?.currency_locked === 'ETB') { setIsEthiopiaUser(true); return; }
        if (profile?.currency_locked === 'USD') { setIsEthiopiaUser(false); return; }
        const res = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(4000),
        });
        const data = await res.json();
        setIsEthiopiaUser(data?.country_code === 'ET');
      } catch {
        // On failure default to Ethiopia (app is primarily Ethiopia-focused)
        setIsEthiopiaUser(true);
      }
    };
    detectLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.currency_locked]);

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
    { id: 'am', label: 'አማርኛ' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'العربية' },
    { id: 'ti', label: 'ትግርኛ' },
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
      case 'diamond': return locale === 'am' ? 'ዳይመንድ (Diamond Tier)' : 'Diamond Tier';
      case 'platinum': return locale === 'am' ? 'ፕላቲኒየም (Platinum Tier)' : 'Platinum Tier';
      case 'gold': return locale === 'am' ? 'ጎልደን (Gold Tier)' : 'Gold Tier';
      case 'silver': return locale === 'am' ? 'ቤዚክ ማረጋገጫ (Silver Tier)' : 'Basic Verified (Silver Tier)';
      case 'bronze':
      default: return locale === 'am' ? 'ያልተረጋገጠ (Bronze Tier)' : 'Unverified (Bronze Tier)';
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const queryString = params.toString();
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(targetPath, { locale: newLocale });
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
    const isVipActive = !!(profile as any)?.is_vip_member &&
      (!(profile as any)?.vip_expires_at || new Date((profile as any).vip_expires_at) > new Date());
    const isPremiumActive = !!(profile as any)?.premium_until &&
      new Date((profile as any).premium_until) > new Date();
    const isAdmin = ['admin', 'super_admin', 'expert'].includes(profile?.role || '');
    const hasElevatedTier = isVipActive || isPremiumActive || isAdmin;
    const borderClass = isVipActive
      ? 'border-amber-400 ring-2 ring-amber-300'
      : isPremiumActive || isAdmin
        ? (gender === 'Female' ? 'border-pink-400 ring-2 ring-pink-300' : 'border-primary ring-2 ring-primary/30')
        : 'border-primary/20';
    return (
      <div className="relative flex items-center justify-center shrink-0">
        {/* Crown / star above avatar for elevated users */}
        {hasElevatedTier && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] animate-bounce z-10 drop-shadow">
            {isVipActive ? '👑' : '⭐'}
          </div>
        )}
        <div className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-muted transition-all border-2 ${borderClass}`}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={24} className="text-gray-300" />
          )}
        </div>
        {/* Small tier badge at bottom-right of avatar */}
        {isVipActive && (
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide border border-white shadow-sm leading-none">
            VIP
          </span>
        )}
        {!isVipActive && (isPremiumActive || isAdmin) && (
          <span className="absolute -bottom-1 -right-1 bg-primary text-white text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide border border-white shadow-sm leading-none">
            PRO
          </span>
        )}
      </div>
    );
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'payments' || tabParam === 'payment') {
        const planParam = searchParams.get('plan') as 'premium' | 'vip' | null;
        setActiveTab('payments');
        if (planParam === 'vip') setDefaultPaymentTab('vip');
        else setDefaultPaymentTab('premium');
        setShowPayment(false); // clear any stale modal flag
      } else {
        setActiveTab(tabParam);
      }
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const currentTab = url.searchParams.get('tab');
      
      if (isFirstRender.current) {
        isFirstRender.current = false;
        if (currentTab && currentTab !== activeTab) {
          setActiveTab(currentTab === 'payment' ? 'payments' : currentTab);
        }
        return;
      }

      if (currentTab !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  // ── Chapa Return Handler ─────────────────────────────────────────────────────
  // When Chapa redirects the user back after payment, it appends ?tx_ref=xxx to
  // the callback_url. This effect detects that and calls our verify endpoint to
  // confirm payment and upgrade the profile automatically.
  useEffect(() => {
    const txRef = searchParams.get('tx_ref');
    if (!txRef) return;

    const verifyChapa = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await fetch('/api/payments/chapa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_ref: txRef, userId: user.id }),
        });

        const result = await response.json();

        if (result.status === 'success') {
          console.log('[Dashboard] Chapa payment verified ✅:', result.message);

          if (result.type === 'coins') {
            // For coin purchases: update the local coin balance immediately
            if (result.coinBalance !== undefined) {
              setProfile(prev => prev ? { ...prev, coins: result.coinBalance } : null);
            }
            alert(`✅ ክፍያዎ ተጠናቋል! ኮይኖችዎ ገቢ ሆነዋል።\n✅ Payment received! Your wallet has been credited with ${result.coinBalance} coins.`);
            setActiveTab('gifts');
          } else if (result.type === 'vip') {
            // For VIP: refresh profile and mark VIP active
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (updatedProfile) {
              const vipActive = updatedProfile.is_vip_member &&
                (!updatedProfile.vip_expires_at || new Date(updatedProfile.vip_expires_at) > new Date());
              const premiumNow =
                vipActive ||
                (updatedProfile.premium_until && new Date(updatedProfile.premium_until) > new Date()) ||
                ['admin', 'super_admin', 'expert'].includes(updatedProfile.role);
              setProfile(prev => prev ? { ...prev, ...updatedProfile, is_premium: premiumNow } : null);
              setPaymentStatus('approved');
            }
            alert(`👑 ክፍያዎ ተጠናቋል! የቪአይፒ አባልነትዎ ገቢ ሆኗል።\n👑 VIP membership activated! Valid until ${new Date(result.vipExpiresAt).toLocaleDateString()}.`);
            setActiveTab('profile');
          } else {
            // Standard premium subscription
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (updatedProfile) {
              const isPremiumNow =
                (updatedProfile.premium_until && new Date(updatedProfile.premium_until) > new Date()) ||
                ['admin', 'super_admin', 'expert'].includes(updatedProfile.role);
              setProfile(prev => prev ? { ...prev, ...updatedProfile, is_premium: isPremiumNow } : null);
              setPaymentStatus('approved');
            }
            alert(`✅ ክፍያዎ ተጠናቋል! ፕሪሚየም አካውንትዎ ገቢ ሆኗል።\n✅ Payment verified and premium profile upgraded successfully!`);
            // Navigate to payments tab so the user sees their new status
            setActiveTab('payments');
          }
        } else {
          console.warn('[Dashboard] Chapa verify returned:', result.message);
          if (txRef.includes('coins_')) {
            setActiveTab('gifts');
          } else {
            setActiveTab('payments');
          }
          alert(`❌ ክፍያው አልተሳካም ወይም ተሰርዟል። እባክዎ እንደገና ይሞክሩ።\n❌ Payment failed or was cancelled. Please try again.`);
        }
      } catch (err) {
        console.error('[Dashboard] Chapa auto-verify error:', err);
        if (txRef.includes('coins_')) {
          setActiveTab('gifts');
        } else {
          setActiveTab('payments');
        }
        alert(`❌ ክፍያው አልተሳካም ወይም ተሰርዟል። እባክዎ እንደገና ይሞክሩ።\n❌ Payment failed or was cancelled. Please try again.`);
      } finally {
        // Clean tx_ref from URL to prevent re-triggering on page refresh
        const url = new URL(window.location.href);
        url.searchParams.delete('tx_ref');
        window.history.replaceState({}, '', url.toString());
      }
    };

    verifyChapa();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
        
        const mergedProfile = { ...(profileData as Profile), coins, email: user.email || null };
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
          .select('status, id_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const currentVerifyStatus = verifyData?.status || 'none';
        setVerificationStatus(currentVerifyStatus);
        if (currentVerifyStatus === 'rejected') {
          setRejectionReason(
            verifyData?.id_data?.rejection_reason || 
            (locale === 'am' ? 'ያልተገለጸ ምክንያት' : 'No reason specified')
          );
        }

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

      // Fetch Unread Messages and Missed Calls Count
      const { count: unreadCount } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setUnreadChatsCount(unreadCount || 0);

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

  // Real-time messages listener to dynamically update the unread chat badge count
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const updateUnreadCount = async () => {
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        setUnreadChatsCount(count || 0);
      };

      const channel = supabase
        .channel(`messages_unread_badge_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages'
        }, () => {
          updateUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);


  const isVipActive = (profile as any)?.is_vip_member &&
    (!(profile as any)?.vip_expires_at || new Date((profile as any).vip_expires_at) > new Date());
  const isPremium = isVipActive ||
                    ((profile as any)?.premium_until && new Date((profile as any).premium_until) > new Date()) ||
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
          ? `ለማሳተም ${COIN_PER_POST} ቤተሰብ ኮይኖች ያስፈልጉዎታል። እባክዎ አካውንትዎን ያሳድጉ ወይም ኮይኖችን ይግዙ።`
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
    
    const safety = await moderateText(newPostContent);
    if (!safety.approved) {
      alert(`${tc('unsafeContent')}: ${safety.reason}`);
      setIsSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Deduct coins from user_wallets (profiles.coins column does not exist)
    if (!profile?.is_premium && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      const { data: currentWallet } = await supabase
        .from('user_wallets')
        .select('coin_balance')
        .eq('id', user.id)
        .maybeSingle();
      const currentBalance = Number(currentWallet?.coin_balance || 0);
      const newBalance = Math.max(0, currentBalance - COIN_PER_POST);
      await supabase.from('user_wallets').update({ coin_balance: newBalance, updated_at: new Date().toISOString() }).eq('id', user.id);
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -COIN_PER_POST,
        type: 'admin_adjustment',
        note: 'Deducted for posting on community feed'
      });
      setProfile(prev => prev ? { ...prev, coins: newBalance } : null);
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
        alert(locale === 'am' ? 'ተዛምደዋል! አሁን መነጋገር ይችላሉ።' : "It's a Match! You can now start chatting.");
        
        // Transition to chat with this user
        localStorage.setItem('beteseb_active_chat_user_id', candidateId);
        handleTabClick('chat');
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
        alert(locale === 'am' ? 'ላይክ ተደርጓል!' : 'Profile liked!');
        
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
              ? `${profile.full_name} ላይክ አድርጎዎታል!`
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
      alert(locale === 'am' ? 'የጓደኝነት ጥያቄ ተልኳል!' : 'Friend request sent!');
      
      // Trigger push notification to target user
      fetch(`/${locale}/api/notifications/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          title: locale === 'am' ? 'አዲስ የጓደኝነት ጥያቄ' : 'New Friend Request',
          body: locale === 'am'
            ? `${profile.full_name} የጓደኝነት ጥያቄ ልኮልዎታል።`
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
      alert(locale === 'am' ? 'ጓደኝነት ተረጋግጧል!' : 'Friend request accepted!');
      
      // Automatically open chat with the sender!
      localStorage.setItem('beteseb_active_chat_user_id', senderId);
      handleTabClick('chat');
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
            {locale === 'am' ? 'ቤተሰብ' : locale === 'ar' ? 'بيتسب' : 'BETESEB'}
          </span>
        </div>

        <nav className="flex md:flex-col gap-3 flex-1">
          {[
            { id: 'dashboard', icon: Home, label: n('dashboard') },
            { id: 'chat', icon: MessageCircle, label: n('chat') },
            { id: 'community', icon: Users, label: n('community') },
            { id: 'workshops', icon: GraduationCap, label: n('workshops') },
            { id: 'wedding', icon: Sparkles, label: locale === 'am' ? 'የሰርግ እቅድ' : 'Wedding Planner' },
            { id: 'gifts', icon: Gift, label: locale === 'am' ? 'ስጦታዎች' : 'Gifts' },
            { id: 'profile', icon: UserCircle, label: n('profile') }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex-1 md:flex-none flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 relative ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:bg-white/5'
                }`}
            >
              <item.icon size={22} />
              <span className="hidden md:block font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
              {item.id === 'chat' && (pendingRequestsCount > 0 || unreadChatsCount > 0) && (
                <span className="absolute top-2 right-2 md:relative md:top-0 md:right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-[#0F172A] md:border-none animate-pulse">
                  {pendingRequestsCount + unreadChatsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5 hidden md:block space-y-4">
          {/* App Store Badges */}
          <AppStoreBadges
            playStoreUrl={appLinks.play_store_url}
            appStoreUrl={appLinks.app_store_url}
            layout="column"
            theme="dark"
          />
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
          { id: 'gifts', icon: Gift, label: locale === 'am' ? 'ስጦታዎች' : 'Gifts' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            aria-label={item.label}
            className={`p-3 rounded-2xl transition-all duration-300 relative ${activeTab === item.id ? 'bg-primary text-white scale-110 shadow-lg' : 'text-white/40'}`}
          >
            <item.icon size={22} />
            {item.id === 'chat' && (pendingRequestsCount > 0 || unreadChatsCount > 0) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0F172A] animate-pulse">
                {pendingRequestsCount + unreadChatsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${activeTab === 'chat' ? 'h-[calc(100vh-80px)] md:h-screen overflow-hidden p-0' : 'overflow-y-auto p-6 md:p-16'}`}>
        <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 w-full border-b border-border pb-6 ${activeTab === 'chat' ? 'mb-0 px-6 pt-6 md:px-16 md:pt-16' : 'mb-10'}`}>
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
              {/* Coin Balance Indicator */}
              {profile && (
                <button
                  id="btn-coin-balance-indicator"
                  onClick={() => setActiveTab('gifts')}
                  title={locale === 'am' ? 'የኮይን ሂሳብዎ — ይጫኑ ለማሳደግ' : 'Your Coin Balance — click to top up'}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all text-xs font-black group"
                >
                  <Coins size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="tabular-nums">{(profile.coins ?? 0).toLocaleString()}</span>
                </button>
              )}
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
                      { id: 'wedding', icon: Sparkles, label: locale === 'am' ? 'የሰርግ እቅድ' : 'Wedding Planner' },
                      { id: 'gifts', icon: Gift, label: locale === 'am' ? 'ስጦታዎች' : 'Gifts' },
                      { id: 'profile', icon: UserCircle, label: n('profile') }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleTabClick(item.id);
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

        {/* Verification Banner — use the synced local verificationStatus state, NOT the raw
            profile fields which may be stale on first render before DB sync completes */}
        {verificationStatus !== 'verified' && verificationStatus !== 'pending' && verificationStatus !== 'loading' && verificationStatus !== 'rejected' && (
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

        {/* Case B: Pending Review Notification Banner */}
        {verificationStatus === 'pending' && (
          <div className="mb-10 bg-blue-50 border border-blue-100 p-8 md:p-10 rounded-[3rem] text-accent shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in duration-500">
            <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <Loader2 size={28} className="animate-spin" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-blue-600">
                  {locale === 'am' ? 'የመለያ ማረጋገጫ በሂደት ላይ' : 'Verification Pending Review'}
                </h4>
                <p className="text-xs font-semibold text-gray-500 max-w-xl leading-relaxed">
                  {locale === 'am' 
                    ? 'መረጃዎ በትክክል ደርሶናል። በአሁኑ ሰዓት በአስተዳዳሪ (Admin) እየተገመገመ ስለሆነ እባክዎ ከ5 እስከ 30 ደቂቃ ይጠብቁ።'
                    : 'We have received your verification request. Our admin team is currently reviewing your documents, please wait 5 to 30 minutes.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Case A & Admin Decline: Rejected Notification Banner */}
        {verificationStatus === 'rejected' && (
          <div className="mb-10 bg-red-50 border border-red-100 p-8 md:p-10 rounded-[3rem] text-accent shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in duration-500">
            <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 bg-red-500 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-red-600">
                  {locale === 'am' ? 'ማረጋገጫው ውድቅ ተደርጓል' : 'Verification Rejected'}
                </h4>
                <p className="text-xs font-semibold text-gray-500 max-w-xl leading-relaxed">
                  {locale === 'am' 
                    ? `ያስገቡት ዶክመንት ውድቅ ተደርጓል። ምክንያት፦ ${rejectionReason}። እባክዎ በትክክል አስተካክለው ድጋሚ ይሞክሩ።`
                    : `Your verification request has been rejected. Reason: ${rejectionReason}. Please correct it and try again.`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/onboarding?step=4')}
              className="bg-red-500 hover:bg-red-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/10 hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2"
            >
              🔄 {locale === 'am' ? 'ድጋሚ አስገባ' : 'Try Again'}
            </button>
          </div>
        )}

        {/* ——— Floating Friend-Request Toast —————————————————————————————— */}
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
                  {locale === 'am' ? 'የጓደኝነት ጥያቄ ልኮልዎታል።' : 'sent you a friend request.'}
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
                    {locale === 'am' ? 'ተቀበል' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDeclineNotification(activeRequestNotification.friendshipId)}
                    className="flex-1 py-2 rounded-xl border-2 border-border text-gray-500 text-[10px] font-black uppercase tracking-wider hover:bg-muted active:scale-95 transition-all"
                  >
                    {locale === 'am' ? 'አትቀበል' : 'Decline'}
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
                {t('matching.title')}
              </h2>
              {profile && (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {getCandidatesLabel(matches.filter(m => !dislikedIds.has(m.id)).length, locale)}
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

              {/* ── Premium & VIP Hero Cards ───────────────────────────── */}
              {!isPremium && (
                <div className="w-full space-y-4">

                  {/* ── PREMIUM CARD ── */}
                  <div
                    onClick={() => setShowBenefitsModal('premium')}
                    className="w-full cursor-pointer group relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] select-none"
                    style={{ background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 40%, #FB923C 100%)' }}
                  >
                    {/* decorative circles */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />

                    <div className="relative flex flex-col gap-5 w-full">
                      {/* Top Row: Title spanning edge-to-edge with Price */}
                      <div className="flex justify-between items-center w-full border-b border-white/15 pb-4">
                        <span className="text-sm font-black uppercase tracking-wider text-white">
                          {locale === 'am' ? 'የፕሪሚየም አባልነት' : 'Premium Membership'}
                        </span>
                        <div className="text-white/95 font-black text-right">
                          <span className="text-lg leading-none">{isEthiopiaUser ? 'ብር 700' : '$7.99'}</span>
                          <span className="text-[9px] text-white/60 block font-bold leading-none mt-0.5">{isEthiopiaUser ? 'ከወር' : '/month'}</span>
                        </div>
                      </div>

                      {/* Middle Row: Icon & Descriptive Tag */}
                      <div className="flex items-center justify-start gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                          <Sparkles size={20} className="text-white fill-white/50" />
                        </div>
                        <span className="text-[10px] text-white/80 font-bold italic leading-relaxed">
                          {locale === 'am' ? 'ያልተገደበ ዕጩዎች፣ የቀጥታ ቻት እና ሙሉ ፕሮፋይሎችን ይክፈቱ።' : 'Unlock unlimited matches, private chat & full bios.'}
                        </span>
                      </div>

                      {/* Bottom Row: Centered Upgrade Button */}
                      <div className="flex justify-center w-full mt-1">
                        <div className="w-full text-center bg-white text-primary text-xs font-black uppercase tracking-[0.15em] py-4.5 rounded-2xl shadow-lg group-hover:bg-orange-50 transition-colors">
                          {locale === 'am' ? 'ወደ ፕሪሚየም ያሳድጉ' : 'Upgrade to Premium'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── VIP CARD ── */}
                  <div
                    onClick={() => setShowBenefitsModal('vip')}
                    className="w-full cursor-pointer group relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] select-none"
                    style={{ background: 'linear-gradient(135deg, #92400E 0%, #B45309 40%, #D97706 70%, #F59E0B 100%)' }}
                  >
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-yellow-300/10 rounded-full" />

                    <div className="relative flex flex-col gap-5 w-full">
                      {/* Top Row: Title spanning edge-to-edge with Price */}
                      <div className="flex justify-between items-center w-full border-b border-white/15 pb-4">
                        <span className="text-sm font-black uppercase tracking-wider text-yellow-200 flex items-center gap-1.5">
                          {locale === 'am' ? 'የቪ.አይ.ፒ ልዩ አባልነት' : 'VIP Elite Membership'} 👑
                        </span>
                        <div className="text-white/95 font-black text-right">
                          <span className="text-lg leading-none">{isEthiopiaUser ? 'ብር 1,500' : '$12.99'}</span>
                          <span className="text-[9px] text-white/60 block font-bold leading-none mt-0.5">{isEthiopiaUser ? 'ከወር' : '/month'}</span>
                        </div>
                      </div>

                      {/* Middle Row: Icon & Descriptive Tag */}
                      <div className="flex items-center justify-start gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                          <Crown size={20} className="text-yellow-200 fill-yellow-200/30" />
                        </div>
                        <span className="text-[10px] text-white/80 font-bold italic leading-relaxed">
                          {locale === 'am' ? 'የወርቅ አክሊል ባጅ፣ Ghost Mode፣ እና የተሟላ ፕሪሚየም ጥቅሞች።' : 'Crown badge, ghost mode, incognito & all premium benefits.'}
                        </span>
                      </div>

                      {/* Bottom Row: Centered Upgrade Button */}
                      <div className="flex justify-center w-full mt-1">
                        <div className="w-full text-center bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-[0.15em] py-4.5 rounded-2xl shadow-lg group-hover:bg-amber-300 transition-colors">
                          {locale === 'am' ? 'ወደ ቪ አይ ፒ ያሳድጉ' : 'Upgrade to VIP'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}



        {/* ── Payments Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'payments' && profile && (
          <div className="mt-10 pb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A] flex items-center gap-2">
                <Crown size={20} className="text-amber-500 fill-amber-100" />
                {locale === 'am' ? 'ፕሪሚየም እና ቪአይፒ አባልነት' : 'Premium & VIP Membership'}
              </h2>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                <X size={14} /> {locale === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
            <SubscriptionPlansPage
              profile={profile}
              defaultTab={defaultPaymentTab}
              onPaymentStarted={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {/* Tab Components */}
        {activeTab === 'chat' && (
           <div className="w-full flex-1 min-h-0 mt-0">
              <SubscriptionGate allowVerifiedView={false}>
                 <ChatView isPremium={isPremium} />
              </SubscriptionGate>
           </div>
        )}

        {activeTab === 'workshops' && (
           <div className="mt-10 space-y-16">
              <SubscriptionGate allowVerifiedView={true}>
                 <AcademyView isPremium={isPremium} userCoins={profile?.coins || 0} />
              </SubscriptionGate>
              <SubscriptionGate allowVerifiedView={true}>
                 <WorkshopsView currency={profile?.currency_locked || 'ETB'} />
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
              handleTabClick('chat');
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
                     {locale === 'am' ? 'አስቸኳይ የአስተዳዳሪ ማሳሰቢያ' : 'Urgent System Alert'}
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
                  {locale === 'am' ? 'ተረድቻለሁ (Acknowledge)' : 'I Acknowledge'}
                </button>
             </div>
          </div>
        )}
      </main>

      {/* ── Benefits Popup Modal ───────────────────────────────────────────────── */}
      {showBenefitsModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[600] flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBenefitsModal(null); }}
        >
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">

            {/* Card shell */}
            <div className={`rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
              showBenefitsModal === 'vip'
                ? 'bg-gradient-to-b from-[#92400E] to-[#1C0A00]'
                : 'bg-gradient-to-b from-[#9A3412] to-[#1C0700]'
            }`}>

              {/* ── Header ── */}
              <div className="relative p-8 pb-4 shrink-0">
                <button
                  onClick={() => setShowBenefitsModal(null)}
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
                    {showBenefitsModal === 'vip'
                      ? <Crown size={32} className="text-yellow-300 fill-yellow-300/30" />
                      : <Sparkles size={32} className="text-white fill-white/30" />}
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                      {locale === 'am' ? 'ቤተሰብ አባልነት' : 'Beteseb Membership'}
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white">
                      {showBenefitsModal === 'vip'
                        ? (locale === 'am' ? 'ቪ.አይ.ፒ አባልነት 👑' : 'VIP Status 👑')
                        : (locale === 'am' ? 'ፕሪሚየም አባልነት' : 'Premium Membership')}
                    </h2>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-white font-black text-lg">
                        {showBenefitsModal === 'vip'
                          ? (isEthiopiaUser ? 'ብር 1,500' : '$12.99')
                          : (isEthiopiaUser ? 'ብር 700' : '$7.99')}
                      </span>
                      <span className="text-white/50 text-[9px] font-bold">{locale === 'am' ? '/ ወር' : '/ month'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-white/60 text-[11px] font-medium leading-relaxed">
                  {showBenefitsModal === 'vip'
                    ? (locale === 'am'
                        ? 'ሙሉ ግላዊነት ቁጥጥር፣ የወርቅ አክሊል ሁኔታ እና ልዩ ፊቸሮች ያሉት ልዩ አባልነት።'
                        : 'An elite membership with full privacy control, golden crown status, and exclusive incognito features.')
                    : (locale === 'am'
                        ? 'ያልተገደቡ ዕጩዎችን፣ ቀጥታ ቻት እና ሙሉ የፕሮፋይል ዝርዝሮችን በማግኘት የትዳር አጋርዎን ያፋጥኑ።'
                        : 'Accelerate your match journey with unlimited candidates, direct messaging, and full profile details.')}
                </p>
              </div>

              {/* ── Benefits List (Scrollable) ── */}
              <div className="px-8 pb-6 space-y-3 overflow-y-auto flex-1 max-h-[40vh] scrollbar-thin scrollbar-thumb-white/20">
                <div className="h-px bg-white/10 mb-4" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                  {locale === 'am' ? 'ዋና ዋና ጥቅሞች' : 'Key Benefits'}
                </p>

                {(showBenefitsModal === 'premium' ? [
                  { icon: '♾️', title: locale === 'am' ? 'ያልተገደበ ዕጩ ምግብ' : 'Unlimited Matching Feed', sub: locale === 'am' ? 'የዕለቱን ገደብ ያለፉ ሁሉንም መገለጫዎች ያስሱ።' : 'Bypass daily card limits and explore all profiles freely.' },
                  { icon: '💬', title: locale === 'am' ? 'ቀጥታ የጽሑፍ ቻት' : 'Direct Private Chat', sub: locale === 'am' ? 'ከዕጩዎቻቸው ጋር ያለ ጊዜ ወሰን ቀጥታ ቻት ጀምሩ።' : 'Start instant conversations with matches — no wait limits.' },
                  { icon: '📋', title: locale === 'am' ? 'ሙሉ የፕሮፋይል ዝርዝሮች' : 'Full Profile Bios & Details', sub: locale === 'am' ? 'የተደበቁ መረጃዎችን፣ ባዮ እና ምርጫዎችን ይክፈቱ።' : 'Reveal blurred traits, full bios, and personal preferences.' },
                  { icon: '🎓', title: locale === 'am' ? 'የባለሙያ ክፍሎች' : 'Expert Academy Classes', sub: locale === 'am' ? 'ሁሉንም ወርክሾፖች እና ሴሚናሮች ያለ ኮይን ይድረሱ።' : 'Access all workshops and seminars without spending coins.' },
                  { icon: '⚡', title: locale === 'am' ? 'ቅድሚያ የደንበኛ ድጋፍ' : 'Priority Customer Support', sub: locale === 'am' ? 'ቅሬታዎ ቀዳሚ ትኩረት ያገኛል።' : 'Your support tickets are handled with top priority.' }
                ] : [
                  { icon: '👑', title: locale === 'am' ? 'የወርቅ አክሊል ባጅ' : 'Golden Crown Badge', sub: locale === 'am' ? 'በሁሉም ቦታ መገለጫዎ ላይ ሚያምር ዘውድ ይጨምሩ።' : 'Stand out with an elegant crown on your avatar across the platform.' },
                  { icon: '👻', title: locale === 'am' ? 'Ghost Mode — ሙሉ ድብቅ' : 'Ghost Mode — Full Incognito', sub: locale === 'am' ? 'ፎቶዎን ሙሉ በሙሉ ብዥ ያድርጉ እና ስምዎን ይደብቁ።' : 'Completely blur your avatar and hide your full name from others.' },
                  { icon: '🔕', title: locale === 'am' ? 'Online ሁኔታን ደብቁ' : 'Hide Online Status', sub: locale === 'am' ? 'ንቁ መሆንዎ፣ ታይቷል ምልክት እና ጽሑፍ ሁኔታን ደብቁ።' : 'Conceal your active status, typing state, and read receipts.' },
                  { icon: '🔍', title: locale === 'am' ? 'ማን እንዳያችሁ ይቆጣጠሩ' : 'Control Who Views You', sub: locale === 'am' ? 'የፕሮፋይልዎን ታይነት ሙሉ በሙሉ ያስተዳድሩ።' : 'Manage profile visibility and who can discover you.' },
                  { icon: '💎', title: locale === 'am' ? 'ሁሉም ፕሪሚየም ጥቅሞች' : 'All Premium Benefits Included', sub: locale === 'am' ? 'ያልተገደበ ዕጩ፣ ቀጥታ ቻት እና ሁሉም ፕሪሚየም ፊቸሮች።' : 'Enjoy the complete Premium feature set plus exclusive VIP perks.' }
                ]).map((b, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <span className="text-lg shrink-0 mt-0.5">{b.icon}</span>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-wide">{b.title}</p>
                      <p className="text-[10px] text-white/50 font-medium leading-snug mt-0.5">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Action Buttons ── */}
              <div className="px-8 pb-8 space-y-3 shrink-0 pt-4">
                <button
                  onClick={() => {
                    setShowBenefitsModal(null);
                    setDefaultPaymentTab(showBenefitsModal);
                    setActiveTab('payments');
                  }}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.18em] text-sm shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    showBenefitsModal === 'vip'
                      ? 'bg-amber-400 text-amber-900 shadow-amber-400/30 hover:bg-amber-300'
                      : 'bg-white text-primary shadow-white/20 hover:bg-orange-50'
                  }`}
                >
                  {showBenefitsModal === 'vip' ? <Crown size={16} className="fill-amber-900/30" /> : <Sparkles size={16} />}
                  {showBenefitsModal === 'vip'
                    ? (locale === 'am' ? 'ወደ ቪ.አይ.ፒ አሳድግ →' : 'Upgrade to VIP →')
                    : (locale === 'am' ? 'ወደ ፕሪሚየም አሳድግ →' : 'Upgrade to Premium →')}
                </button>
                {showBenefitsModal === 'premium' && (
                  <button
                    onClick={() => setShowBenefitsModal('vip')}
                    className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
                  >
                    {locale === 'am' ? '👑 ቪ.አይ.ፒ ጥቅሞችን ይመልከቱ' : '👑 View VIP Benefits Instead'}
                  </button>
                )}
                {showBenefitsModal === 'vip' && (
                  <button
                    onClick={() => setShowBenefitsModal('premium')}
                    className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
                  >
                    {locale === 'am' ? '⚡ ፕሪሚየም ጥቅሞችን ይመልከቱ' : '⚡ View Premium Benefits Instead'}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Full-Screen Payments Overlay (triggered from LockOverlay or legacy code) ── */}
      {showPayment && profile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="relative bg-[#FDFBF9] rounded-[3rem] w-full max-w-5xl shadow-2xl p-8 md:p-14 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowPayment(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all z-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <SubscriptionPlansPage
              profile={profile}
              defaultTab={defaultPaymentTab}
              onPaymentStarted={() => setShowPayment(false)}
            />
          </div>
        </div>
      )}
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
