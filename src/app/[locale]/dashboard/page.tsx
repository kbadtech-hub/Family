'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  ChevronRight
} from 'lucide-react';
import CommunityView from '@/components/dashboard/CommunityView';
import PaymentPortal from '@/components/payment/PaymentPortal';
import ChatView from '@/components/dashboard/ChatView';
import ProfileView from '@/components/dashboard/ProfileView';
import MatchDetailView from '@/components/dashboard/MatchDetailView';
import LessonsView from '@/components/dashboard/LessonsView';

function DashboardContent() {
  const t = useTranslations('Dashboard');
  const n = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLangOpen, setIsLangOpen] = useState(false);

  interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    trial_ends_at: string | null;
    currency_locked: 'USD' | 'ETB';
    onboarding_completed: boolean;
    role: string;
  }

  interface Match {
    id: string;
    name: string;
    match_percent: number;
    image: string;
  }

  const [matches, setMatches] = useState<Match[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('loading');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'አማርኛ' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'العربية' },
    { id: 'ti', label: 'ትግርኛ' }
  ];

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

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'payment') {
       setShowPayment(true);
       setActiveTab('dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      let currentTrialExpired = false;
      if (profileData) {
        setProfile(profileData as Profile);
        if (profileData.trial_ends_at) {
          const ends = new Date(profileData.trial_ends_at);
          const now = new Date();
          const diff = ends.getTime() - now.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(days > 0 ? days : 0);
          currentTrialExpired = diff <= 0;
          setIsTrialExpired(currentTrialExpired);
        }
      }

      // 2. Fetch Verification
      const { data: verifyData } = await supabase.from('verifications')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const currentVerifyStatus = verifyData?.status || 'none';
      setVerificationStatus(currentVerifyStatus);

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
                       (profileData?.trial_ends_at && new Date(profileData.trial_ends_at) > new Date()) ||
                       ['admin', 'super_admin', 'expert'].includes(profileData?.role);
      
      setProfile(prev => prev ? { ...prev, is_premium: isPremium } : null);

      // 5. Fetch Matches (only if ONBOARDED AND verified AND trial active/premium)
      if (profileData?.onboarding_completed && currentVerifyStatus === 'verified' && isPremium) {
        const { data: profiles } = await supabase.from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('onboarding_completed', true)
          .limit(10);

        if (profiles) {
          setMatches(profiles.map(p => ({
            id: p.id,
            name: p.full_name || 'Anonymous',
            match_percent: 85 + Math.floor(Math.random() * 10),
            image: p.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'
          })));
        }
      }
    };
    fetchData();
  }, []);

  const isPremium = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date() || 
                    paymentStatus === 'approved' || 
                    ['admin', 'super_admin', 'expert'].includes((profile as any)?.role);
  const isAdmin = ['admin', 'super_admin'].includes((profile as any)?.role);

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col md:flex-row" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 bg-[#0F172A] text-white flex md:flex-col p-8 sticky top-0 md:h-screen z-50 ${locale === 'ar' ? 'md:border-l' : 'md:border-r'} border-white/5`}>
        <div className="flex items-center gap-4 mb-12 hidden md:flex group cursor-pointer">
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
            { id: 'profile', icon: UserCircle, label: n('profile') }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 md:flex-none flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:bg-white/5'
                }`}
            >
              <item.icon size={22} />
              <span className="hidden md:block font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
          <button
             onClick={handleLogout}
             aria-label="Logout"
             className="md:hidden flex-1 flex items-center justify-center p-4 rounded-[1.5rem] text-red-400 hover:bg-red-400/10 transition-all"
           >
              <LogOut size={22} />
           </button>
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

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] italic tracking-tighter">{t('welcome')}</h1>
            <p className="text-gray-400 mt-2 font-bold text-xs uppercase tracking-widest">{t('subtitle')}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border hover:border-primary transition-all text-xs font-bold"
              >
                <Globe size={16} className="text-primary" />
                <span className="uppercase">{locale}</span>
                <ChevronDown size={14} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
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

            <div className="w-14 h-14 rounded-full bg-[#F8F4F1] border-2 border-primary/20 overflow-hidden shadow-sm">
              <Image src={profile?.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'} alt="Avatar" width={56} height={56} className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Verification Banner */}
        {!profile?.onboarding_completed && (
          <div className="mb-10 bg-gradient-to-r from-primary to-orange-400 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                     <ShieldCheck size={14} /> Action Required
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter">
                    {t('verifyBannerTitle')}
                  </h2>
                  <p className="text-white/80 font-medium max-w-lg">
                    {t('verifyBannerSub')}
                  </p>
               </div>
               <button 
                 onClick={() => router.push('/onboarding')}
                 className="bg-white text-primary px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
               >
                  {t('verifyNow')} <ChevronRight size={20} />
               </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">{t('matching.title')}</h2>
                  <button className="text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 underline decoration-primary/20">
                    {t('matching.viewAll')} <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {showPayment && profile ? (
                    <div className="col-span-full">
                      <button onClick={() => setShowPayment(false)} className="mb-6 text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">← {t('backToDash')}</button>
                      {paymentStatus === 'pending' ? (
                         <div className="bg-white p-20 rounded-[4rem] border border-primary/20 text-center space-y-6 shadow-2xl shadow-primary/5">
                            <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto animate-bounce">
                               <ShieldCheck size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-accent italic">Payment Under Review</h3>
                            <p className="text-gray-500 max-w-md mx-auto font-medium">We have received your screenshot. Our team is verifying the transfer. This usually takes a few hours.</p>
                            <button onClick={() => setShowPayment(false)} className="btn-secondary px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">Return to Dashboard</button>
                         </div>
                      ) : (
                         <PaymentPortal profile={profile} onPaymentStarted={() => {
                            setShowPayment(false);
                            setPaymentStatus('pending');
                         }} />
                      )}
                    </div>
                  ) : isTrialExpired && paymentStatus !== 'approved' ? (
                    <div className="col-span-full bg-white p-12 rounded-[3rem] border border-red-100 text-center space-y-6">
                      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-accent italic">{t('trialExpired')}</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">{t('trialEnded')}</p>
                      <button onClick={() => setShowPayment(true)} className="bg-primary text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20">{t('upgradeNow')}</button>
                    </div>
                  ) : !profile?.onboarding_completed ? (
                    <div className="col-span-full bg-[#F8F4F1] p-16 rounded-[3rem] border border-dashed border-primary/30 text-center space-y-6">
                       <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                          <Heart size={40} className="animate-pulse" />
                       </div>
                       <h3 className="text-2xl font-black text-accent italic">{t('matchingLocked')}</h3>
                       <p className="text-gray-400 max-w-sm mx-auto font-medium">{t('matchingLockedSub')}</p>
                       <button onClick={() => router.push('/onboarding')} className="btn-primary px-10 py-4 rounded-2xl">{t('completeOnboarding')}</button>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                       Searching for your perfect match...
                    </div>
                  ) : (
                    matches.map(match => (
                      <div 
                        key={match.id} 
                        onClick={() => setSelectedMatchId(match.id)}
                        className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm group hover:shadow-xl transition-all duration-500 cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-5">
                          <Image src={match.image} alt={match.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className={`absolute top-4 ${locale === 'ar' ? 'left-4' : 'right-4'} bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg`}>
                            {match.match_percent}% {t('matching.percent')}
                          </div>
                        </div>
                        <h3 className="text-lg font-black text-[#0F172A]">{match.name}</h3>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-8">
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
                       <p className="font-black text-xs uppercase tracking-widest text-primary">Review Pending</p>
                       <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Your payment screenshot is being reviewed.</p>
                    </div>
                  </div>
                ) : profile?.onboarding_completed && !isTrialExpired ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-primary/5 rounded-[1.5rem]">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Trial Status</p>
                      <p className="text-xl font-black text-accent italic">{trialDaysLeft} Days Left</p>
                    </div>
                    <button onClick={() => setShowPayment(true)} className="w-full bg-primary text-white py-5 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                      {t('premium.unlock')}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowPayment(true)} className="w-full bg-primary text-white py-5 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                    {t('premium.unlock')}
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Tab Components */}
        {activeTab === 'chat' && (
           <div className="mt-10 h-[calc(100vh-200px)]">
              <ChatView isPremium={isPremium} />
           </div>
        )}

        {activeTab === 'workshops' && (
           <div className="mt-10">
              <LessonsView isPremium={isPremium} />
           </div>
        )}

        {activeTab === 'community' && <CommunityView isVerified={verificationStatus === 'verified'} isPremium={isPremium} isAdmin={isAdmin} />}

        {activeTab === 'profile' && profile && (
          <ProfileView 
            profile={profile} 
            onUpdate={() => {
              // Re-fetch profile to update dashboard UI
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                  supabase.from('profiles').select('*').eq('id', user.id).single()
                    .then(({ data }) => data && setProfile(data as Profile));
                }
              });
            }} 
          />
        )}

        {selectedMatchId && (
          <MatchDetailView 
            matchId={selectedMatchId} 
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
