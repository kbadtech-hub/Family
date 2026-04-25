'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter, usePathname } from '@/i18n/routing';
import { supabase } from '@/lib/supabase';
import {
  Home,
  MessageCircle,
  Users,
  UserCircle,
  Heart,
  CheckCircle2,
  ArrowUpRight,
  GraduationCap,
  Globe,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import CommunityView from '@/components/dashboard/CommunityView';
import VerificationGate from '@/components/dashboard/VerificationGate';
import PaymentPortal from '@/components/payment/PaymentPortal';
import ChatView from '@/components/dashboard/ChatView';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const n = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLangOpen, setIsLangOpen] = useState(false);

  interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    trial_ends_at: string | null;
    currency_locked: 'USD' | 'ETB';
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

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'አማርኛ' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'العربية' }
  ];

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsLangOpen(false);
  };

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

      let currentPaymentApproved = paymentData?.status === 'approved';
      if (paymentData) setPaymentStatus(paymentData.status);

      // 4. Fetch Matches (only if verified AND trial active/premium)
      if (currentVerifyStatus === 'verified' && (!currentTrialExpired || currentPaymentApproved)) {
        const { data: profiles } = await supabase.from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(3);

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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <header className="flex justify-between items-center mb-16">
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
                      <PaymentPortal profile={profile} onPaymentStarted={() => setShowPayment(false)} />
                    </div>
                  ) : verificationStatus !== 'verified' && profile?.id ? (
                    <div className="col-span-full">
                      <VerificationGate userId={profile.id} onVerified={() => setVerificationStatus('verified')} />
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
                  ) : (
                    matches.map(match => (
                      <div key={match.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm group hover:shadow-xl transition-all duration-500">
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
                ) : verificationStatus === 'verified' && !isTrialExpired ? (
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
        {(activeTab === 'chat' || activeTab === 'workshops') && verificationStatus !== 'verified' && profile?.id && (
          <div className="flex-1 flex flex-col pt-10 items-center justify-center">
             <VerificationGate userId={profile.id} onVerified={() => setVerificationStatus('verified')} />
          </div>
        )}

        {activeTab === 'chat' && verificationStatus === 'verified' && (
           <div className="mt-10 h-[calc(100vh-200px)]">
              <ChatView />
           </div>
        )}

        {activeTab === 'workshops' && verificationStatus === 'verified' && (
           <div className="flex items-center justify-center h-64 bg-white rounded-[3rem] border border-gray-100 mt-10">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Workshops Feature Coming Soon</p>
           </div>
        )}

        {activeTab === 'community' && <CommunityView isVerified={verificationStatus === 'verified'} />}
      </main>
    </div>
  );
}
