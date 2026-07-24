'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { 
  Menu, 
  X, 
  Globe, 
  ChevronDown, 
  User as UserIcon, 
  Bell, 
  Coins, 
  Sparkles 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NotificationDrawerModal from '@/components/NotificationDrawerModal';

interface SystemSettings {
  social_links?: Record<string, string>;
  contact_info?: Record<string, string>;
  cms_content?: Record<string, string>;
}

export default function Header() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const initUserAndWallet = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      setUser(currentUser);

      // Fetch user profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (profData) setProfile(profData);

      // Fetch coin balance
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('coin_balance')
        .eq('id', currentUser.id)
        .single();

      if (wallet) setCoinBalance(Number(wallet.coin_balance || 0));

      // Fetch unread notifications count
      const { count } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);

      // Realtime subscription for wallet updates
      const walletChannel = supabase
        .channel(`wallet-updates-${currentUser.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `id=eq.${currentUser.id}`
        }, (payload: any) => {
          if (payload.new && payload.new.coin_balance !== undefined) {
            const newBal = Number(payload.new.coin_balance);
            setCoinBalance(prev => {
              if (newBal > prev) {
                const added = newBal - prev;
                setToastMessage(
                  locale === 'am'
                    ? `🎉 እንኳን ደስ አለዎት! ${added} ኮይን ወደ ዋሌትዎ ገቢ ተደርጓል!`
                    : `🎉 Congratulations! ${added} coins added to your wallet!`
                );
                setTimeout(() => setToastMessage(null), 4000);
              }
              return newBal;
            });
          }
        })
        .subscribe();

      // Realtime subscription for notifications
      const notifChannel = supabase
        .channel(`notif-updates-${currentUser.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${currentUser.id}`
        }, () => {
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(notifChannel);
      };
    };

    initUserAndWallet();
  }, [locale]);

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'አማርኛ' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'العربية' },
    { id: 'ti', label: 'ትግርኛ' },
    { id: 'so', label: 'Soomaali' }
  ];

  const handleLanguageChange = (newLocale: string) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const queryString = params.toString();
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(targetPath, { locale: newLocale });
    setIsLangOpen(false);
  };

  return (
    <>
      {/* Real-time Purchase/Reward Toast Pop-up */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[200] bg-accent text-white px-6 py-4 rounded-2xl shadow-2xl border border-primary/30 flex items-center gap-3 animate-in slide-in-from-top duration-500">
          <Sparkles className="text-secondary animate-spin" size={20} />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <header className={`sticky top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3 border-b border-border' : 'bg-[#FDFBF9]/50 backdrop-blur-sm'}`}>
        <div className={`max-w-7xl mx-auto px-6 flex justify-between items-center text-foreground transition-all duration-300 ${isScrolled ? 'py-4' : 'py-6'}`}>
          
          {/* Logo */}
          <Link href="/" className="group decoration-transparent flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Beteseb" 
              width={160} 
              height={40} 
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8">
              <Link href="/" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('home')}</Link>
              <Link href="/about" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('about')}</Link>
              <Link href="/community-hub" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('community')}</Link>
              <Link href="/contact" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('contact')}</Link>
            </nav>

            {/* Top Navigation Header Actions Order (Right to Left):
                1. Profile Icon
                2. Language Selector
                3. Notification Bell Icon (with Unread Badge)
                4. Coin Balance Display & Wallet Logic
            */}
            <div className="flex items-center gap-4 border-l border-gray-200 pl-6">

              {/* 1. Profile Icon */}
              <Link 
                href={user ? "/dashboard" : "/login"}
                className="p-2.5 rounded-2xl bg-[#F8F4F1] border border-border hover:border-primary text-accent hover:text-primary transition-all flex items-center justify-center group"
                title={user ? (profile?.full_name || 'Profile') : t('signIn')}
              >
                {profile?.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    width={24} 
                    height={24} 
                    className="w-6 h-6 rounded-full object-cover" 
                  />
                ) : (
                  <UserIcon size={18} className="group-hover:scale-110 transition-transform" />
                )}
              </Link>

              {/* 2. Language Selector */}
              <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F8F4F1] border border-border hover:border-primary transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <Globe size={16} className="text-primary" />
                  <span>{languages.find(l => l.id === locale)?.label}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangOpen && (
                  <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-border rounded-[1.5rem] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 z-[110]">
                    {languages.map(lang => (
                      <button 
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full px-6 py-3 text-left text-xs font-bold hover:bg-[#F8F4F1] hover:text-primary transition-all flex items-center justify-between ${locale === lang.id ? 'bg-[#F8F4F1] text-primary' : 'text-foreground'}`}
                      >
                        {lang.label}
                        {locale === lang.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Centralized Notification Bell Icon */}
              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2.5 rounded-2xl bg-[#F8F4F1] border border-border hover:border-primary text-accent hover:text-primary transition-all flex items-center justify-center"
                title={locale === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 4. Coin Balance Display & Wallet Logic */}
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/30 text-amber-600 hover:scale-105 transition-all font-black text-xs"
                title={locale === 'am' ? 'የኮይን ባላንስ' : 'Coin Balance'}
              >
                <Coins size={16} className="text-amber-500 animate-bounce" />
                <span>{coinBalance.toLocaleString()}</span>
              </Link>

            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Coin Display */}
            <Link 
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 font-black text-[11px]"
            >
              <Coins size={14} className="text-amber-500" />
              <span>{coinBalance}</span>
            </Link>

            {/* Mobile Bell Icon */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2 rounded-xl bg-[#F8F4F1] border border-border text-accent"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Language Selector */}
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-2 rounded-xl bg-[#F8F4F1] border border-border text-xs font-bold uppercase"
            >
              <Globe size={16} className="text-primary" />
            </button>

            <button className="p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-border p-8 space-y-6 flex flex-col items-center animate-in slide-in-from-top-4 duration-300 shadow-2xl">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('home')}</Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('about')}</Link>
            <Link href="/community-hub" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('community')}</Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('contact')}</Link>
            
            <div className="flex flex-col gap-3 w-full pt-4 border-t border-gray-100">
              {user ? (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-primary text-white text-center py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">
                  {locale === 'am' ? 'ወደ ዳሽቦርድ ይግቡ' : 'Dashboard'}
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full border border-primary text-primary text-center py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">{t('signIn')}</Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-primary text-white text-center py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">{t('signUp')}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Centralized Notification Modal / Dynamic Drawer */}
      <NotificationDrawerModal 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        userId={user?.id}
        locale={locale}
      />
    </>
  );
}
