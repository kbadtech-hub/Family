'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube, Send, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const t = useTranslations('Footer');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const socialLinks = settings?.social_links || {};
  const cmsContent = settings?.cms_content || {};
  const contactInfo = settings?.contact_info || cmsContent;

  return (
    <footer className="bg-accent text-white py-24 px-8 mt-auto relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mb-48 blur-3xl opacity-30" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 relative z-10">
        <div className="space-y-8 flex-1">
          <div>
             <Link href="/">
                {cmsContent.logo_url ? (
                   <img src={cmsContent.logo_url} alt="Logo" className="h-16 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                ) : (
                   <img src="/logo.png" alt="Beteseb Logo" className="h-16 invert opacity-90 hover:opacity-100 transition-opacity" />
                )}
             </Link>
             <p className="text-white/40 mt-4 text-xs font-bold uppercase tracking-widest leading-loose">
               {t('tagline')}
             </p>
          </div>
          <p className="text-white/40 max-w-sm leading-relaxed text-sm">
            {cmsContent.footer_description || t('description')}
          </p>
          <div className="flex flex-wrap gap-3">
             {socialLinks.facebook && (
               <a href={socialLinks.facebook} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="Facebook">
                  <Facebook size={18} className="text-gray-400 group-hover:text-white" />
               </a>
             )}
             {socialLinks.instagram && (
               <a href={socialLinks.instagram} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="Instagram">
                  <Instagram size={18} className="text-gray-400 group-hover:text-white" />
               </a>
             )}
             {socialLinks.tiktok && (
               <a href={socialLinks.tiktok} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="TikTok">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
               </a>
             )}
             {socialLinks.telegram && (
               <a href={socialLinks.telegram} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="Telegram">
                  <Send size={18} className="text-gray-400 group-hover:text-white" />
               </a>
             )}
             {socialLinks.youtube && (
               <a href={socialLinks.youtube} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="YouTube">
                  <Youtube size={18} className="text-gray-400 group-hover:text-white" />
               </a>
             )}
             {socialLinks.twitter && (
               <a href={socialLinks.twitter} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="X (Twitter)">
                  <Twitter size={18} className="text-gray-400 group-hover:text-white" />
               </a>
             )}
             {socialLinks.linkedin && (
               <a href={socialLinks.linkedin} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="LinkedIn">
                  <Linkedin size={18} className="text-gray-400 group-hover:text-white" />
               </a>
             )}
             {socialLinks.whatsapp && (
               <a href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-primary transition-all group" title="WhatsApp">
                  <Send size={18} className="text-gray-400 group-hover:text-white rotate-[-45deg]" />
               </a>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 flex-[2]">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('connect')}</h3>
            <div className="space-y-4 text-white/50 text-sm font-medium">
              <div className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <Mail size={16} /> {contactInfo.email || 'contact@beteseb.com'}
              </div>
              <div className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <Phone size={16} /> {contactInfo.phone || '+49 (0) 123 456 789'}
              </div>
              <div className="flex items-start gap-3 hover:text-white transition-colors cursor-pointer">
                <MapPin size={16} /> {contactInfo.address || t('address')}
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
              <Link href="/onboarding" className="hover:text-white transition-colors font-bold text-white">{t('start')}</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('legal')}</h3>
            <div className="flex flex-col gap-4 text-white/50 text-sm font-medium">
              <Link href="#" className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link href="#" className="hover:text-white transition-colors">{t('privacy')}</Link>
              <Link href="/admin" className="hover:text-white transition-colors border-t border-white/10 pt-4 mt-2">{t('admin')}</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-white/10 text-xs tracking-[0.5em] uppercase font-black">
        {t('copyright')}
      </div>
    </footer>
  );
}
