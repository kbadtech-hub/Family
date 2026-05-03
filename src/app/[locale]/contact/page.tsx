'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Youtube, 
  Facebook, 
  Send, 
  MessageCircle, 
  Linkedin, 
  Twitter 
} from 'lucide-react';

interface SystemSettings {
  social_links?: Record<string, string>;
  contact_info?: Record<string, string>;
}

export default function ContactPage() {
  const t = useTranslations('Contact');
  const locale = useLocale();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const socialIcons = [
    { id: 'youtube', icon: Youtube, color: 'text-[#FF0000]', bgColor: 'bg-[#FF0000]/10', label: 'YouTube' },
    { id: 'facebook', icon: Facebook, color: 'text-[#1877F2]', bgColor: 'bg-[#1877F2]/10', label: 'Facebook' },
    { id: 'telegram', icon: Send, color: 'text-[#26A5E4]', bgColor: 'bg-[#26A5E4]/10', label: 'Telegram' },
    { id: 'whatsapp', icon: MessageCircle, color: 'text-[#25D366]', bgColor: 'bg-[#25D366]/10', label: 'WhatsApp' },
    { id: 'linkedin', icon: Linkedin, color: 'text-[#0A66C2]', bgColor: 'bg-[#0A66C2]/10', label: 'LinkedIn' },
    { id: 'twitter', icon: Twitter, color: 'text-black', bgColor: 'bg-black/10', label: 'X (Twitter)' },
  ];

  const contactMethods = [
    { 
      id: 'phone', 
      icon: Phone, 
      label: t('phone'), 
      value: (
        <div className="space-y-1">
          <p>{t('phone1')}</p>
        </div>
      ),
      href: `tel:${t('phone1').replace(/\s/g, '')}` 
    },
    { 
      id: 'email', 
      icon: Mail, 
      label: t('email'), 
      value: 'betesebhub@gmail.com', 
      href: 'mailto:betesebhub@gmail.com' 
    },
    { 
      id: 'address', 
      icon: MapPin, 
      label: t('address'), 
      value: (
        <div className="space-y-2">
          <div>
            <span className="text-[10px] text-primary font-black uppercase block opacity-70 mb-0.5">{t('hqLabel')}</span>
            <p>{t('hqAddress')}</p>
          </div>
        </div>
      ),
      href: '#' 
    },
    { 
      id: 'chatbot', 
      icon: MessageSquare, 
      label: locale === 'am' ? 'ኤአይ ቻት ቦት' : 'AI Chatbot', 
      value: locale === 'am' ? 'ሁሌም ዝግጁ' : 'Always Ready', 
      href: '#' 
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-32" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Header */}
      <section className="bg-muted py-24 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-8 animate-in fade-in duration-700">
            {t('subtitle')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-accent mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t('title')}
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600 font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            {t('description')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactMethods.map((method, idx) => (
            <div 
              key={method.id} 
              className={`card-premium flex items-start gap-6 group animate-in fade-in slide-in-from-bottom-8 duration-700 ${
                idx === 0 ? 'delay-0' : idx === 1 ? 'delay-100' : idx === 2 ? 'delay-200' : 'delay-300'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-muted text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                <method.icon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{method.label}</h4>
                <div className="text-lg font-bold text-accent">
                  {method.id === 'chatbot' || method.id === 'email' ? (
                    <a href={method.href} className="hover:text-primary transition-colors">
                      {method.value}
                    </a>
                  ) : (
                    method.value
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Maps Section */}
          <div className="md:col-span-2 grid grid-cols-1 gap-6 animate-in fade-in duration-1000 delay-500">
            {/* London Map */}
            <div className="rounded-[2rem] overflow-hidden border border-border h-[400px] relative shadow-lg group">
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                {t('hqLabel')}
              </div>
              <iframe 
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d158857.7281065113!2d-0.2416815494246067!3d51.528771840875414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2suk!4v1620000000000!5m2!1sen!2suk" 
                 className="absolute inset-0 w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                 allowFullScreen
                 loading="lazy"
                 title="London, UK Map"
              />
            </div>
          </div>
        </div>

        {/* Social Media Column */}
        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
          <div className="card-premium bg-accent text-white">
            <h3 className="text-2xl font-bold mb-8 italic tracking-tighter">{t('socialTitle')}</h3>
            <div className="space-y-4">
              {socialIcons.map((social) => {
                const link = settings?.social_links?.[social.id] || '#';
                return (
                  <a 
                    key={social.id}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${social.bgColor} ${social.color}`}
                      >
                        <social.icon size={20} />
                      </div>
                      <span className="font-bold text-sm tracking-wide">{social.label}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Send size={14} className="rotate-[-45deg]" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="card-premium">
             <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
               {locale === 'am' ? 'የስራ ሰዓት' : 'Working Hours'}
             </h4>
             <p className="text-sm font-bold text-accent mb-2">
               {locale === 'am' ? 'ሰኞ - ቅዳሜ' : 'Mon - Sat'}
             </p>
             <p className="text-lg font-black text-accent italic">
               08:00 AM - 06:00 PM
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
