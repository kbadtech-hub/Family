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
  Sparkles
} from 'lucide-react';
import CommunityView from '@/components/dashboard/CommunityView';
import PaymentTab from '@/components/dashboard/PaymentTab';
import ChatView from '@/components/dashboard/ChatView';
import ProfileView from '@/components/dashboard/ProfileView';
import GiftsView from '@/components/dashboard/GiftsView';
import WeddingPlannerView from '@/components/dashboard/WeddingPlannerView';
import MatchDetailView from '@/components/dashboard/MatchDetailView';
import SwipeCards from '@/components/dashboard/SwipeCards';
import AcademyView from '@/components/dashboard/AcademyView';
import SubscriptionGate from '@/components/SubscriptionGate';
import { getUserTier, calculateCompletionRate } from '@/lib/tiers';

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
  // Trial model removed (Blueprint v4.0) — using freemium tier-based limits
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, string>>({});
  const [matchingView, setMatchingView] = useState<'grid' | 'swipe'>('grid');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [hasVouchedRecords, setHasVouchedRecords] = useState(false);
  const [isGuardianLinked, setIsGuardianLinked] = useState(false);

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
    router.replace(pathname, { locale: newLocale });
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
       router.push('/');
    }
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
      if (!user) return;

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
      }

      // 2. Fetch Verification — profiles.verification_status is the source of truth
      // If the profile says 'verified', trust it permanently (no re-verification needed)
      const profileVerifyStatus = profileData?.verification_status || profileData?.is_verified ? 'verified' : null;
      
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
      // No trial tracking — Freemium model uses tier-based limits (Blueprint v4.0)

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
        setMatches(processedMatches);
        OfflineCache.cacheData(`matches_${user.id}`, processedMatches);
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
    };
    fetchData();
  }, []);

  const isPremium = ((profile as any)?.premium_until && new Date((profile as any).premium_until) > new Date()) || 
                    paymentStatus === 'approved' || 
                    ['admin', 'super_admin', 'expert'].includes((profile as any)?.role);
  const isAdmin = ['admin', 'super_admin'].includes((profile as any)?.role);

  const completionRate = calculateCompletionRate(profile as any);
  const userTier = getUserTier(profile as any, hasVouchedRecords);

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
          { id: 'gifts', icon: Gift, label: locale === 'am' ? 'ስጦታዎች' : 'Gifts' }
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
                      { id: 'wedding', icon: Sparkles, label: locale === 'am' ? 'የሰርግ እቅድ' : 'Wedding Planner' },
                      { id: 'gifts', icon: Gift, label: locale === 'am' ? 'ስጦታዎች' : 'Gifts' },
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

        {/* Verification Banner */}
        {profile?.verification_status !== 'verified' && profile?.verification_status !== 'pending' && !profile?.is_verified && (
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

        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            {/* Friend Suggestions Carousel */}
            {suggestions.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A] flex items-center gap-2">
                      <Users size={20} className="text-primary" /> {t('suggestions.title')}
                   </h2>
                 </div>
                 <div className="flex overflow-x-auto pb-6 gap-6 no-scrollbar -mx-2 px-2">
                    {suggestions.map((person) => {
                      const personCompletion = calculateCompletionRate(person);
                      const personTier = getUserTier(person, false); // Vouched count is optional, default false
                      const isRoyal = personCompletion === 100 && personTier === 'diamond';
                      return (
                        <div key={person.id} className="flex-shrink-0 w-64 bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all duration-500 group relative">
                          <div className={`relative w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-muted border ${
                            isRoyal
                              ? (person.gender === 'Male' ? 'border-amber-400 ring-2 ring-amber-300' : 'border-pink-400 ring-2 ring-pink-300')
                              : 'border-border'
                          }`}>
                             {isRoyal && (
                               <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs drop-shadow-md z-10 animate-bounce">
                                 👑
                               </div>
                             )}
                             {person.avatar_url ? (
                               <Image src={person.avatar_url} alt={person.full_name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-primary/20"><UserCircle size={40} /></div>
                             )}
                          </div>
                          <h3 className="font-black text-sm text-[#0F172A] text-center mb-0.5 flex items-center justify-center gap-1">
                            <span>{person.full_name}</span>
                            <span className="text-xs" title={getTierName(personTier)}>{getTierIcon(personTier)}</span>
                          </h3>
                          <p className="text-[9px] text-primary font-black uppercase tracking-widest text-center mb-4">{getTierName(personTier)}</p>
                          
                          <button 
                            onClick={async () => {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) return;
                              const { error } = await supabase.from('friendships').insert({
                                sender_id: user.id,
                                receiver_id: person.id,
                                status: 'pending'
                              });
                              if (!error) {
                                setFriendshipStatuses(prev => ({ ...prev, [person.id]: 'pending' }));
                                setSuggestions(prev => prev.filter(s => s.id !== person.id));
                              }
                            }}
                            className="w-full bg-primary/10 text-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                          >
                             {t('suggestions.addFriend')}
                          </button>
                        </div>
                      );
                    })}
                 </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <div className="flex justify-between items-center mb-8 flex-col sm:flex-row gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">{t('matching.title')}</h2>
                  
                  <div className="flex items-center gap-4">
                    {/* View Switcher Toggle */}
                    {!showPayment && matches.length > 0 && (
                      <div className="flex p-1 bg-muted rounded-2xl w-fit border border-gray-100 shadow-sm">
                        <button 
                          onClick={() => setMatchingView('grid')} 
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${matchingView === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-gray-400'}`}
                        >
                          Grid View
                        </button>
                        <button 
                          onClick={() => setMatchingView('swipe')} 
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${matchingView === 'swipe' ? 'bg-primary text-white shadow-sm' : 'text-gray-400'}`}
                        >
                          Swipe Deck
                        </button>
                      </div>
                    )}
                    <button className="text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 underline decoration-primary/20">
                      {t('matching.viewAll')} <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {matchingView === 'swipe' && !showPayment && matches.length > 0 && profile ? (
                  <div className="animate-in zoom-in-95 duration-500 py-4">
                    <SwipeCards 
                      userProfile={profile} 
                      candidates={candidates} 
                      onLike={(id) => setSelectedMatchId(id)}
                      onPass={(id) => console.log("Passed candidate:", id)}
                      isPremium={profile?.is_premium}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-500">
                    {showPayment && profile ? (
                      <div className="col-span-full">
                        <button onClick={() => setShowPayment(false)} className="mb-6 text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">← {t('backToDash')}</button>
                        <PaymentTab />
                      </div>
                    ) : !profile?.is_premium && paymentStatus !== 'approved' && matches.length === 0 ? (
                      <div className="col-span-full bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-primary/10 text-center space-y-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                          <Sparkles className="w-7 h-7 md:w-8 md:h-8" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-accent italic">{t('upgradeForMore')}</h3>
                        <p className="text-xs md:text-gray-500 max-w-sm mx-auto">{t('freemiumLimitNote')}</p>
                        <button onClick={() => setShowPayment(true)} className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20">{t('upgradeNow')}</button>
                      </div>
                    ) : matches.length === 0 ? (
                      <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                         {t('searching')}
                      </div>
                    ) : (
                      matches.map(match => {
                        const matchCompletion = match.profile ? calculateCompletionRate(match.profile) : 0;
                        const matchTier = match.profile ? getUserTier(match.profile, !!match.profile.has_vouched) : 'bronze';
                        const isRoyal = matchCompletion === 100 && matchTier === 'diamond';
                        return (
                          <div 
                            key={match.id} 
                            onClick={() => setSelectedMatchId(match.id)}
                            className="bg-white p-4 md:p-6 rounded-[2.5rem] border border-border shadow-sm group hover:shadow-xl transition-all duration-500 cursor-pointer w-full relative"
                          >
                            <div className={`relative aspect-square rounded-[2rem] overflow-hidden mb-5 border ${
                              isRoyal
                                ? (match.profile?.gender === 'Male' ? 'border-amber-400 ring-4 ring-amber-300' : 'border-pink-400 ring-4 ring-pink-300')
                                : 'border-border'
                            }`}>
                              {isRoyal && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-lg drop-shadow-md z-10 animate-bounce">
                                  👑
                                </div>
                              )}
                              <Image src={match.image} alt={match.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 animate-duration-1000" />
                              <div className={`absolute top-4 ${locale === 'ar' ? 'left-4' : 'right-4'} bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10`}>
                                {match.match_percent}% {t('matching.percent')}
                              </div>
                            </div>
                            <h3 className="text-base md:text-lg font-black text-[#0F172A] text-center md:text-left flex items-center justify-center md:justify-start gap-1">
                              <span>{match.name}</span>
                              <span className="text-xs" title={getTierName(matchTier)}>{getTierIcon(matchTier)}</span>
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center md:text-left">{getTierName(matchTier)}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-8">
              {/* Profile Completion & Trust Tier Dashboard Widget (Phase 4.5) */}
              <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                    {locale === 'am' ? 'የእምነት ደረጃ' : 'Trust Meter'}
                  </h3>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="text-3xl">{getTierIcon(userTier)}</span>
                    <span className="font-black text-accent text-sm uppercase tracking-wide">
                      {getTierName(userTier)}
                    </span>
                  </div>
                  {userTier === 'diamond' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest mt-1">
                      🛡️ High-Trust Seal Approved
                    </span>
                  )}
                </div>

                {/* Completion Rate Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>{locale === 'am' ? 'የመገለጫ ማጠናቀቂያ' : 'Profile Completion'}</span>
                    <span className="text-primary">{completionRate}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner border border-border">
                    <div 
                      style={{ width: `${completionRate}%` }}
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000"
                    />
                  </div>
                  {completionRate === 100 && (
                    <p className="text-[9px] text-green-600 font-bold uppercase tracking-wide text-center">
                      💯 100% Completed! Advanced badges unlocked.
                    </p>
                  )}
                </div>

                {/* Guardian Linked Indicator */}
                {isGuardianLinked && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center gap-2">
                    <span className="text-base">👨‍👩‍👦</span>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                      Guardian-Linked / ዋሊ ተገናኝቷል
                    </span>
                  </div>
                )}

                {/* Royal Frame Design Details */}
                {completionRate === 100 && userTier === 'diamond' && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-center space-y-1">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-1">
                      👑 {(profile as any)?.gender === 'Male' ? "King's Crown Frame Active" : "Queen's Crown Frame Active"}
                    </p>
                    <p className="text-[8px] text-gray-400 font-bold">
                      Your avatar across the system is highlighted with a royal border.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm text-center">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">{t('subscription')}</h3>
                {paymentStatus === 'approved' ? (
                  <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-[1.5rem] flex items-center justify-center gap-3">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <p className="font-bold text-xs uppercase tracking-widest text-green-700">{t('premium.active')}</p>
                  </div>
                ) : paymentStatus === 'pending' ? (
                  <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] space-y-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <p className="font-black text-xs uppercase tracking-widest text-primary">{t('reviewPending')}</p>
                       <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{t('reviewNote')}</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowPayment(true)} className="w-full bg-primary text-white py-5 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                    {t('premium.unlock')}
                  </button>
                )}
              </div>
            </aside>
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
