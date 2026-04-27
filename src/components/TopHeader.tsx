'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Mail, Phone, Globe, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const languages = [
  { id: 'en', label: 'English', match: ['en'] },
  { id: 'am', label: 'አማርኛ', match: ['am'] },
  { id: 'om', label: 'Oromoo', match: ['om'] },
  { id: 'ar', label: 'العربية', match: ['ar'] }
];

export default function TopHeader() {
  const t = useTranslations('TopHeader');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const [suggestion, setSuggestion] = useState<{ id: string; label: string } | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Basic auto-detection logic
    const dismissedSuggestion = localStorage.getItem('hide-lang-suggestion');
    if (dismissedSuggestion === 'true') return;

    const browserLang = navigator.language.split('-')[0];
    if (browserLang !== locale) {
      const match = languages.find(l => l.match.includes(browserLang));
      if (match) {
        setSuggestion(match);
      }
    }
  }, [locale, languages]);

  const handleDismiss = () => {
    setSuggestion(null);
    localStorage.setItem('hide-lang-suggestion', 'true');
  };

  const handleSwitch = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setSuggestion(null);
    localStorage.setItem('hide-lang-suggestion', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-accent text-white py-2 px-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest border-b border-white/5 relative z-[110]">
      {/* Contact Info */}
      <div className="flex items-center gap-6 opacity-60">
        <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
          <Mail size={12} />
          <span>{settings?.contact_info?.email || settings?.cms_content?.email || t('email')}</span>
        </div>
        <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
          <Phone size={12} />
          <span>{settings?.contact_info?.phone || settings?.cms_content?.phone || t('phone')}</span>
        </div>
      </div>

      {/* Auto-Detection Suggestion */}
      {suggestion && (
        <div className="flex items-center gap-3 bg-primary/20 px-4 py-1 rounded-full animate-in fade-in slide-in-from-top-2 duration-500 my-2 md:my-0">
          <Globe size={12} className="text-primary animate-pulse" />
          <span className="text-white/80">
            {t('suggestion', { lang: suggestion.label })}
          </span>
          <button 
            onClick={() => handleSwitch(suggestion.id)}
            className="flex items-center gap-1 text-primary hover:underline group"
          >
            {t('switchBtn')} <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={handleDismiss} className="ml-1 opacity-40 hover:opacity-100">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Social Links / Mini Nav */}
      <div className="flex items-center gap-6 opacity-80 hidden md:flex">
         <a href="https://tiktok.com" target="_blank" className="hover:text-primary transition-colors text-[9px]">TIKTOK</a>
         <a href="https://t.me" target="_blank" className="hover:text-primary transition-colors text-[9px]">TELEGRAM</a>
         <div className="w-px h-3 bg-white/10 mx-2" />
         <span className="text-primary italic tracking-tight font-black">Beteseb Official</span>
      </div>
    </div>
  );
}
