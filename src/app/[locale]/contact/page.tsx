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
    { id: 'youtube', icon: Youtube, color: '#FF0000', label: 'YouTube' },
    { id: 'facebook', icon: Facebook, color: '#1877F2', label: 'Facebook' },
    { id: 'telegram', icon: Send, color: '#26A5E4', label: 'Telegram' },
    { id: 'whatsapp', icon: MessageCircle, color: '#25D366', label: 'WhatsApp' },
    { id: 'linkedin', icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
    { id: 'twitter', icon: Twitter, color: '#000000', label: 'X (Twitter)' },
  ];

  const contactMethods = [
    { 
      id: 'phone', 
      icon: Phone, 
      label: t('phone'), 
      value: settings?.contact_info?.phone || '+251 911 22 33 44', 
      href: `tel:${settings?.contact_info?.phone || '+251911223344'}` 
    },
    { 
      id: 'email', 
      icon: Mail, 
      label: t('email'), 
      value: settings?.contact_info?.email || 'support@beteseb.com', 
      href: `mailto:${settings?.contact_info?.email || 'support@beteseb.com'}` 
    },
    { 
      id: 'address', 
      icon: MapPin, 
      label: t('address'), 
      value: t('officeLocation'), 
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
            <a 
              key={method.id} 
              href={method.href}
              className="card-premium flex items-start gap-6 group hover:translate-y-[-4px] animate-in fade-in slide-in-from-bottom-8 duration-700"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-muted text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                <method.icon size={28} />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{method.label}</h4>
                <p className="text-lg font-bold text-accent">{method.value}</p>
              </div>
            </a>
          ))}
          
          {/* Map Placeholder */}
          <div className="md:col-span-2 rounded-[2.5rem] overflow-hidden border border-border h-[300px] relative shadow-lg animate-in fade-in duration-1000 delay-500">
            <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15762.669524672613!2d42.1287!3d9.3129!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x163406f5c8f8f8f8%3A0x123456789abcdef!2sHarar%2C%20Ethiopia!5e0!3m2!1sen!2set!4v1620000000000!5m2!1sen!2set" 
               className="absolute inset-0 w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
               allowFullScreen
               loading="lazy"
            />
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${social.color}20`, color: social.color }}
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
