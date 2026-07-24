'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { Menu, X, Globe, ChevronDown, Bell, User, Coins, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NotificationDrawerModal from '@/components/NotificationDrawerModal';
import { fetchUserNotifications } from '@/lib/notifications';

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
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // User Auth & State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Current User & Initial Wallet + Notifications
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser({ ...user, profile });

      // Fetch Wallet Balance
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('coin_balance')
        .eq('id', user.id)
        .maybeSingle();

      if (wallet) {
        setCoinBalance(Number(wallet.coin_balance || 0));
      }

      // Fetch Unread Notifications Count
      const notifs = await fetchUserNotifications(user.id);
      const unreadCount = notifs.filter(n => !n.is_read).length;
      setUnreadNotificationsCount(unreadCount);

      // Real-time Wallet Balance Updates
      const walletChannel = supabase
        .channel(`user-wallet-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_wallets', filter: `id=eq.${user.id}` },
          (payload: any) => {
            if (payload.new) {
              const newBal = Number(payload.new.coin_balance || 0);
              setCoinBalance((prev) => {
                const diff = newBal - prev;
                if (diff > 0) {
                  showToast(`🎉 You earned/purchased +${diff} coins!`);
                } else if (diff < 0) {
                  showToast(`🪙 ${Math.abs(diff)} coins deducted.`);
                }
                return newBal;
              });
            }
          }
        )
        .subscribe();

      // Real-time Notifications Updates
      const notifChannel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
          () => {
            setUnreadNotificationsCount((prev) => prev + 1);
            showToast('🔔 New Notification received!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(notifChannel);
      };
    };

    initUser();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
      {/* Toast Banner for Real-time Coin / Notification Alerts */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[250] bg-accent text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-xs">
          <Sparkles size={16} className="text-secondary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className={`sticky top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3 border-b border-border' : 'bg-[#FDFBF9]/50 backdrop-blur-sm'}`}>
        <div className={`max-w-7xl mx-auto px-6 flex justify-between items-center text-foreground transition-all duration-300 ${isScrolled ? 'py-4' : 'py-8'}`}>
          
          {/* Logo */}
          <Link href="/" className="group decoration-transparent">
            <Image 
              src="/logo.png" 
              alt="Beteseb" 
              width={160} 
              height={40} 
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('home')}</Link>
            <Link href="/about" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('about')}</Link>
            <Link href="/community-hub" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('community')}</Link>
            <Link href="/contact" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('contact')}</Link>
          </nav>

          {/* Desktop Right-To-Left Navigation Items:
              Order (RTL): 1. Profile Icon | 2. Language Selector | 3. Notification Bell | 4. Coin Balance
          */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* 1. Profile Icon */}
            <Link 
              href={currentUser ? "/dashboard" : "/login"}
              className="w-10 h-10 rounded-2xl bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all border border-gray-100 relative group"
              title={currentUser ? "Go to Profile / Dashboard" : "Sign In"}
            >
              {currentUser?.profile?.avatar_url ? (
                <Image 
                  src={currentUser.profile.avatar_url} 
                  alt="Profile" 
                  width={40} 
                  height={40} 
                  className="w-full h-full rounded-2xl object-cover" 
                />
              ) : (
                <User size={18} className="text-accent group-hover:text-primary transition-colors" />
              )}
            </Link>

            {/* 2. Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F8F4F1] border border-border hover:border-primary transition-all font-bold text-xs uppercase tracking-widest"
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
                      className={`w-full px-6 py-3.5 text-left text-xs font-bold hover:bg-[#F8F4F1] hover:text-primary transition-all flex items-center justify-between ${locale === lang.id ? 'bg-[#F8F4F1] text-primary' : 'text-foreground'}`}
                    >
                      {lang.label}
                      {locale === lang.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Centralized Notification Bell Icon (With Unread Badge) */}
            <button
              onClick={() => {
                setIsNotificationOpen(true);
                setUnreadNotificationsCount(0);
              }}
              className="w-10 h-10 rounded-2xl bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all border border-gray-100 relative group"
              title="Centralized Platform Notifications"
            >
              <Bell size={18} className="text-accent group-hover:text-primary transition-colors" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-black text-white bg-primary rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* 4. Coin Balance Display & Wallet Logic */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/10 border border-secondary/30 text-secondary font-black text-xs uppercase tracking-widest shadow-inner">
              <Coins size={16} className="text-secondary animate-pulse" />
              <span>{coinBalance.toLocaleString()} Coins</span>
            </div>

            {!currentUser && (
              <Link href="/signup" className="bg-primary text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 ml-2">
                {t('signUp')}
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="p-2 text-foreground relative"
              title="Notifications"
            >
              <Bell size={22} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>

            {/* Mobile Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8F4F1] border border-border font-bold text-[10px] uppercase tracking-widest"
              >
                <Globe size={14} className="text-primary" />
                <span>{languages.find(l => l.id === locale)?.id}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-3 w-40 bg-white border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 z-[110]">
                  {languages.map(lang => (
                    <button 
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-[#F8F4F1] hover:text-primary transition-all flex items-center justify-between ${locale === lang.id ? 'bg-[#F8F4F1] text-primary' : 'text-foreground'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-border p-8 space-y-6 flex flex-col items-center animate-in slide-in-from-top-4 duration-300 shadow-2xl">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('home')}</Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('about')}</Link>
            <Link href="/community-hub" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('community')}</Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('contact')}</Link>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/10 border border-secondary/30 text-secondary font-black text-xs uppercase tracking-widest w-full justify-center">
              <Coins size={16} />
              <span>{coinBalance.toLocaleString()} Coins</span>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Link href={currentUser ? "/dashboard" : "/login"} onClick={() => setIsMobileMenuOpen(false)} className="w-full border border-primary text-primary text-center py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest">
                {currentUser ? 'My Profile' : t('signIn')}
              </Link>
              {!currentUser && (
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-primary text-white text-center py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest">
                  {t('signUp')}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Centralized Notification Drawer Component */}
      <NotificationDrawerModal 
        userId={currentUser?.id || ''}
        currentUserName={currentUser?.profile?.full_name || 'User'}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
}
