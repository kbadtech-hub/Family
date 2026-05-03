'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';

interface SystemSettings {
  cms_content?: {
    hero_title?: string;
    hero_subtitle?: string;
  };
  system_access_key?: string;
}

export default function Home() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="flex flex-col bg-white text-[#0F172A] overflow-hidden min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_40%)] opacity-5" />
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-white to-transparent" />
        
        <div className="max-w-4xl text-center space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#F8F4F1] rounded-full text-primary font-bold text-xs tracking-widest uppercase border border-border/50">
            <Sparkles size={16} className="fill-primary" />
            {t('Hero.tagline')}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black leading-[1.15] tracking-tight text-[#0F172A]">
            <span className="block opacity-90">
              {settings?.cms_content?.hero_title || t('Hero.title1')}
            </span> 
            {!settings?.cms_content?.hero_title && (
              <span className="text-primary italic">
                 {t('Hero.title2')}
              </span>
            )}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
            {settings?.cms_content?.hero_subtitle || t('Hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Link 
               href="/signup"
               className="w-full sm:w-auto bg-primary text-white py-5 px-12 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {locale === 'am' ? 'ነጻ የ7 ቀን ሙከራ ጀምር' : 'Start Free Trial'} <ArrowRight size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
            </Link>
            <Link href="/about" className="w-full sm:w-auto px-12 py-5 rounded-[2rem] border-2 border-border text-[#0F172A] font-bold text-sm uppercase tracking-widest hover:bg-[#F8F4F1] transition-all text-center">
               {t('Hero.cta2')}
            </Link>
          </div>

          <div className="pt-16 flex flex-wrap items-center justify-center gap-10 opacity-30 grayscale underline decoration-primary/20">
             <div className="flex items-center gap-2 font-bold text-[10px] tracking-widest uppercase"><CheckCircle2 size={16}/> {t('Hero.verify1')}</div>
             <div className="flex items-center gap-2 font-bold text-[10px] tracking-widest uppercase"><ShieldCheck size={16}/> {t('Hero.verify2')}</div>
             <div className="flex items-center gap-2 font-bold text-[10px] tracking-widest uppercase"><Layers size={16}/> {t('Hero.verify3')}</div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 px-8 bg-[#FDFBF9]">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
               <div className="w-full aspect-square rounded-[3rem] bg-white border border-border overflow-hidden shadow-sm flex items-center justify-center group relative">
                  <div className="absolute inset-0 bg-[#F8F4F1] opacity-50 transition-opacity group-hover:opacity-100" />
                  <Heart size={120} className="text-primary/10 fill-primary/10 group-hover:fill-primary/20 transition-all duration-500 relative z-10" />
               </div>
               <div className="absolute -bottom-8 -right-8 bg-[#0F172A] p-8 rounded-[2rem] text-white shadow-2xl">
                  <p className="text-4xl font-black text-primary italic">94%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{t('Vision.stat')}</p>
               </div>
            </div>
            <div className="space-y-8">
               <h2 className="text-primary uppercase tracking-[0.3em] text-[10px] font-black">{t('Vision.tagline')}</h2>
               <h3 className="text-4xl font-black leading-tight text-[#0F172A]">{t('Vision.title')}</h3>
               <p className="text-lg text-gray-500 leading-relaxed font-medium">
                  {t('Vision.subtitle')}
               </p>
                <Link href="/about" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs group underline decoration-primary/30">
                   {t('Vision.cta')} <ArrowRight size={18} className={`transition-transform ${locale === 'ar' ? 'rotate-180 group-hover:-translate-x-2' : 'group-hover:translate-x-2'}`} />
                </Link>
            </div>
         </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 bg-white">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
               <h2 className="text-primary uppercase tracking-[0.3em] text-[10px] font-black">{t('Features.title')}</h2>
               <div className="h-1 w-20 bg-primary mx-auto rounded-full opacity-20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {[
                 { id: 'aiMatch', icon: Sparkles },
                 { id: 'idVerify', icon: ShieldCheck },
                 { id: 'expert', icon: CheckCircle2 }
               ].map(feature => (
                  <div key={feature.id} className="p-10 rounded-[3rem] bg-[#FDFBF9] border border-border/50 space-y-6 hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                     <div className="w-16 h-16 rounded-2xl bg-white border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <feature.icon size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-[#0F172A]">{t(`Features.${feature.id}.title`)}</h3>
                     <p className="text-gray-500 leading-relaxed font-medium">
                        {t(`Features.${feature.id}.desc`)}
                     </p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 px-8 bg-[#0F172A] text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_30%)] opacity-20" />
         <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-8">
               <h2 className="text-primary uppercase tracking-[0.3em] text-[10px] font-black">{t('Trust.title')}</h2>
               <h3 className="text-4xl font-black leading-tight">
                  {t('Trust.privacy.title')}
               </h3>
               <p className="text-lg text-white/60 leading-relaxed">
                  {t('Trust.privacy.desc')}
               </p>
               <div className="pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                     <ShieldCheck size={24} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Verified by Beteseb Secure Node</div>
               </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 space-y-8">
               <h4 className="text-xl font-bold italic">{t('Trust.values.title')}</h4>
               <p className="text-white/60 leading-relaxed">
                  {t('Trust.values.desc')}
               </p>
               <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                     <p className="text-2xl font-black text-primary">100%</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Privacy Sync</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                     <p className="text-2xl font-black text-primary">24/7</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">AI Monitoring</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 bg-white text-center space-y-12">
         <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#0F172A] italic">
               {t('CTA.message')}
            </h2>
            <Link 
               href="/signup"
               className="inline-flex bg-primary text-white py-6 px-16 rounded-[2.5rem] font-bold text-sm uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 items-center gap-4"
            >
               {locale === 'am' ? 'ነጻ የ7 ቀን ሙከራ ጀምር' : 'Start Free Trial'} <ArrowRight size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
            </Link>
         </div>

         <div className="pt-20 opacity-10">
            <span className="text-8xl font-black tracking-tighter uppercase italic">{locale === 'am' ? 'ቤተሰብ' : 'BETESEB'}</span>
         </div>
      </section>
    </div>
  );
}
