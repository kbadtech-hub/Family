'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  Globe,
  CheckCircle2,
  Layers,
  Sparkles,
  X
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
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleStartTrial = (location: 'Local' | 'Diaspora') => {
    // Redirect only to signup as the entry point
    router.push(`/signup?pref_location=${location}`);
  };

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
          
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-[#0F172A]">
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
            <button 
               onClick={() => setShowLocationModal(true)}
               className="w-full sm:w-auto bg-primary text-white py-5 px-12 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {t('Hero.cta1')} <ArrowRight size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
            </button>
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

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-4xl w-full bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden border border-border">
            <button 
               onClick={() => setShowLocationModal(false)}
               aria-label="Close modal"
               className="absolute top-10 right-10 p-3 bg-[#F8F4F1] rounded-2xl text-gray-400 hover:text-primary transition-all"
            >
               <X className="w-8 h-8" />
            </button>

            <div className="text-center mb-16 space-y-4 relative z-10">
               <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{t('modal.step1')}</h2>
               <h3 className="text-4xl font-black tracking-tighter text-[#0F172A]">{t('modal.where')}</h3>
               <p className="text-gray-500 text-lg font-medium">{t('modal.currencyNote')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
               <button 
                  onClick={() => handleStartTrial('Local')}
                  className="group p-10 rounded-[2.5rem] bg-white border-2 border-border hover:border-primary hover:shadow-xl transition-all text-center space-y-6 duration-300"
               >
                  <div className="mx-auto w-20 h-20 bg-[#F8F4F1] rounded-3xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                     <MapPin size={40} className="text-primary" />
                  </div>
                  <div>
                     <p className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">{t('modal.localTitle')}</p>
                  </div>
               </button>

               <button 
                  onClick={() => handleStartTrial('Diaspora')}
                  className="group p-10 rounded-[2.5rem] bg-white border-2 border-border hover:border-primary hover:shadow-xl transition-all text-center space-y-6 duration-300"
               >
                   <div className="mx-auto w-20 h-20 bg-[#F8F4F1] rounded-3xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      {locale === 'ar' ? <Globe size={40} className="text-primary" /> : <Globe size={40} className="text-primary" />}
                   </div>
                   <div>
                      <p className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">{t('modal.globalTitle')}</p>
                   </div>
                </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-12 text-center flex flex-col items-center gap-4 py-12 border-t border-muted/20">
        <span className="text-xl font-black tracking-tighter uppercase italic text-accent/20">{locale === 'am' ? 'ቤተሰብ' : 'BETESEB'}</span>
      </div>
    </div>
  );
}
