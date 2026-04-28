'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { Menu, X, Globe, ChevronDown, Heart } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase';

interface SystemSettings {
  social_links?: Record<string, string>;
  cms_content?: Record<string, string>;
  contact_info?: Record<string, string>;
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

  return (
    <header className={`sticky top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-5 border-b border-border' : 'bg-[#FDFBF9]/50 backdrop-blur-sm py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-foreground">
        
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

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12 fill-background">
          <nav className="flex items-center gap-10">
            <Link href="/" className="text-base font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('home')}</Link>
            <Link href="/about" className="text-base font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('about')}</Link>
            <Link href="/classes" className="text-base font-bold uppercase tracking-widest hover:text-primary transition-colors">{t('classes')}</Link>
          </nav>

          <div className="flex items-center gap-6">
             {/* Language Selector */}
             <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F8F4F1] border border-border hover:border-primary transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <Globe size={16} className="text-primary" />
                  <span>{languages.find(l => l.id === locale)?.label}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangOpen && (
                   <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-border rounded-[1.5rem] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                      {languages.map(lang => (
                         <button 
                           key={lang.id}
                           onClick={() => handleLanguageChange(lang.id)}
                           className={`w-full px-6 py-4 text-left text-sm font-bold hover:bg-[#F8F4F1] hover:text-primary transition-all flex items-center justify-between ${locale === lang.id ? 'bg-[#F8F4F1] text-primary' : 'text-foreground'}`}
                         >
                            {lang.label}
                            {locale === lang.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                         </button>
                      ))}
                   </div>
                )}
             </div>

             <Link href="/login" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
               {t('signIn')}
             </Link>

             <Link href="/onboarding" className="bg-primary text-white px-8 py-3 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
               {t('signUp')}
             </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-border p-10 space-y-8 flex flex-col items-center animate-in slide-in-from-top-4 duration-300 shadow-2xl">
           <div className="grid grid-cols-2 gap-3 w-full">
              {languages.map(lang => (
                 <button 
                   key={lang.id} 
                   onClick={() => handleLanguageChange(lang.id)}
                   className={`p-4 rounded-[1.2rem] font-bold text-xs uppercase tracking-widest border transition-all ${locale === lang.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-[#F8F4F1] border-transparent'}`}
                 >
                   {lang.label}
                 </button>
              ))}
           </div>
           
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('home')}</Link>
          <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('about')}</Link>
          <Link href="/classes" onClick={() => setIsMobileMenuOpen(false)} className="font-bold uppercase tracking-widest text-sm">{t('classes')}</Link>
          <div className="flex flex-col gap-4 w-full">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full border border-primary text-primary text-center py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest">{t('signIn')}</Link>
            <Link href="/onboarding" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-primary text-white text-center py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest">{t('signUp')}</Link>
          </div>
        </div>
      )}
</header>
  );
}
