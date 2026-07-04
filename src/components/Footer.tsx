'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { Mail, Phone, MapPin, Linkedin, Youtube, Send, Globe, MessageCircle, Facebook } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  whatsapp?: string;
}

interface CmsContent {
  footer_description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website_url?: string;
}

interface SystemSettings {
  social_links?: SocialLinks;
  cms_content?: CmsContent;
  contact_info?: CmsContent;
}

export default function Footer() {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const socialLinks: SocialLinks = (settings?.social_links as SocialLinks) || {};
  const cmsContent: CmsContent = (settings?.cms_content as CmsContent) || {};
  const contactInfo: CmsContent = (settings?.contact_info as CmsContent) || cmsContent;

  return (
    <footer className="bg-accent text-white py-24 px-8 mt-auto relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mb-48 blur-3xl opacity-30" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 relative z-10">
        <div className="space-y-8 flex-1">
          <div>
             <Link href="/" className="inline-block">
                <Image src="/logo.png" alt="Beteseb Logo" width={140} height={35} className="h-9 w-auto object-contain brightness-0 invert" />
             </Link>
             <p className="text-white/40 mt-4 text-xs font-bold uppercase tracking-widest leading-loose">
               {t('tagline')}
             </p>
          </div>
          <p className="text-white/40 max-w-sm leading-relaxed text-sm">
            {t('description')}
          </p>
          {/* Hardcoded Social Media Icons */}
          <div className="flex flex-wrap gap-3">
             <a href="https://www.facebook.com/betesebhub" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="Facebook">
               <Facebook size={18} className="text-gray-400 group-hover:text-white" />
             </a>
             <a href="https://www.youtube.com/@betesebhub" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="YouTube">
               <Youtube size={18} className="text-gray-400 group-hover:text-white" />
             </a>
             <a href="https://t.me/betesebhub" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="Telegram">
               <Send size={18} className="text-gray-400 group-hover:text-white" />
             </a>
             <a href="https://wa.me/447347663254" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="WhatsApp">
               <MessageCircle size={18} className="text-gray-400 group-hover:text-white" />
             </a>
             <a href="https://www.tiktok.com/@betesebhub" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="TikTok">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-white">
                 <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
               </svg>
             </a>
             <a href="https://www.linkedin.com/company/betesebhub" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="LinkedIn">
               <Linkedin size={18} className="text-gray-400 group-hover:text-white" />
             </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 flex-[2]">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('connect')}</h3>
            <div className="space-y-4 text-white/50 text-sm font-medium">
              <div className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <Phone size={16} /> +447347663254
              </div>
              <div className="flex items-start gap-3 hover:text-white transition-colors cursor-pointer">
                <MapPin size={16} /> {t('address')}
              </div>
              {contactInfo.website_url && (
                <a href={contactInfo.website_url} target="_blank" className="flex items-center gap-3 hover:text-white transition-colors">
                  <Globe size={16} /> {contactInfo.website_url.replace('https://', '').replace('http://', '')}
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('platform')}</h3>
            <div className="flex flex-col gap-4 text-white/50 text-sm font-medium">
              <Link href="/about" className="hover:text-white transition-colors">{t('vision')}</Link>
              <Link href="/classes" className="hover:text-white transition-colors">{t('classes')}</Link>
              <Link href="/community" className="hover:text-white transition-colors">{t('community')}</Link>
              <Link href="/signup" className="hover:text-white transition-colors font-bold text-white">{t('start')}</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('legal')}</h3>
            <div className="flex flex-col gap-4 text-white/50 text-sm font-medium">
              <Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-white/10 text-xs tracking-[0.5em] uppercase font-black">
        {t('copyright')}
      </div>
      <div className="text-center text-white/30 text-[10px] mt-2 font-bold uppercase tracking-widest">
        Developed by Nolawi Digital Hub
      </div>
    </footer>
  );
}
