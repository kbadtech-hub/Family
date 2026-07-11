'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SystemSettings {
  cms_content?: {
    hero_title?: string;
    hero_subtitle?: string;
  };
  system_access_key?: string;
}

// 6-Language Translation Helpers to prevent any mixed-language bleed-throughs
const getCtaLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'አካውንት ይፍጠሩ';
    case 'om': return 'Galmee Uumi';
    case 'ti': return 'ኣካውንት ፍጠሩ';
    case 'ar': return 'أنشئ حسابك';
    case 'so': return 'Abuur Koontadaada';
    default: return 'Create Your Account';
  }
};

const getBottomCtaLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'አሁኑኑ ይቀላቀሉ';
    case 'om': return 'Amma dabalami';
    case 'ti': return 'ሕዚ ተጸንበሩ';
    case 'ar': return 'انضم الآن';
    case 'so': return 'Ku biir Hada';
    default: return 'Join Now';
  }
};

const getVerifiedNodeLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'በቤተሰብ ደህንነት ክፍል የተረጋገጠ';
    case 'om': return "Noodii Mirkaneessa Betesebiin Mirkanaa'e";
    case 'ti': return 'ብክፍሊ ድሕንነት ቤተሰብ ዝተረጋገፀ';
    case 'ar': return 'تم التحقق بواسطة عقدة بيتسيب الآمنة';
    case 'so': return 'Waxaa xaqiijiyay Nambarka Aaminada Beteseb';
    default: return 'Verified by Beteseb Secure Node';
  }
};

const getPrivacySyncLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'የግላዊነት ማመሳሰል';
    case 'om': return 'Wal-simannaa Qulqullinaa';
    case 'ti': return 'ምስጢራውነት ምትዕስሳር';
    case 'ar': return 'مزامنة الخصوصية';
    case 'so': return 'Isku xirka Qosolka';
    default: return 'Privacy Sync';
  }
};

const getAiMonitoringLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'በአርቲፊሻል ኢንተለጀንስ ክትትል';
    case 'om': return 'Hordoffii AI';
    case 'ti': return 'ክትትል ብአርቲፊሻል ኢንተለጀንስ';
    case 'ar': return 'مراقبة الذكاء الاصطناعي';
    case 'so': return 'La-socodka AI';
    default: return 'AI Monitoring';
  }
};

export default function Home() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // If user is already authenticated, send them straight to the dashboard.
  // This handles the case where they open the app after being logged in
  // (but NOT after logging out — signOut() clears the session token).
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router]);

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
          
          {/* Slogan Title — generous leading prevents Ethiopic/Arabic baseline collision */}
          <h1 className="text-4xl md:text-6xl font-black tracking-wide text-[#0F172A]" style={{ lineHeight: '1.6' }}>
            <span className="block mb-3">
              {settings?.cms_content?.hero_title || t('Hero.title1')}
            </span>
            {!settings?.cms_content?.hero_title && (
              <span className="text-primary italic block mt-1">
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
              {getCtaLabel(locale)} <ArrowRight size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
            </Link>
            <a href="#vision" className="w-full sm:w-auto px-12 py-5 rounded-[2rem] border-2 border-border text-[#0F172A] font-bold text-sm uppercase tracking-widest hover:bg-[#F8F4F1] transition-all text-center cursor-pointer">
               {t('Hero.visionBtn')}
            </a>
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
      <section id="vision" className="py-24 px-8 bg-[#FDFBF9]">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
               <div className="w-full aspect-square rounded-[3rem] bg-white border border-border overflow-hidden shadow-sm flex items-center justify-center group relative">
                  <div className="absolute inset-0 bg-[#F8F4F1] opacity-50 transition-opacity group-hover:opacity-100" />
                  <Heart size={120} className="text-primary animate-heart-burst relative z-10" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {[
                 { id: 'aiMatch', icon: Sparkles },
                 { id: 'idVerify', icon: ShieldCheck },
                 { id: 'expert', icon: CheckCircle2 },
                 { id: 'guardian', icon: Users },
                 { id: 'vouching', icon: CheckCircle2 }
               ].map(feature => (
                  <div key={feature.id} className="p-10 rounded-[3rem] bg-[#FDFBF9] border-2 border-primary/20 hover:border-primary/80 space-y-6 hover:shadow-2xl hover:shadow-primary/5 transition-all group">
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
                <div className="space-y-4 pt-4">
                  {[
                    t('Trust.privacy.item1'),
                    t('Trust.privacy.item2'),
                    t('Trust.privacy.item3'),
                    t('Trust.privacy.item4')
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 text-xs text-white/70">
                      <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
               <div className="pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                     <ShieldCheck size={24} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {getVerifiedNodeLabel(locale)}
                  </div>
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
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                       {getPrivacySyncLabel(locale)}
                     </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                     <p className="text-2xl font-black text-primary">24/7</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                       {getAiMonitoringLabel(locale)}
                     </p>
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
            <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium leading-relaxed">
               {t('CTA.subtext')}
            </p>
            <Link 
               href="/signup"
               className="inline-flex bg-primary text-white py-6 px-16 rounded-[2.5rem] font-bold text-sm uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 items-center gap-4"
            >
               {getBottomCtaLabel(locale)} <ArrowRight size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
            </Link>
         </div>

         <div className="pt-20 opacity-10">
            <span className="text-8xl font-black tracking-tighter uppercase italic">{locale === 'am' ? 'ቤተሰብ' : 'BETESEB'}</span>
         </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heart-pulse-burst {
          0% {
            transform: scale(0.9);
            fill: rgba(199, 131, 88, 0.1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            fill: rgba(199, 131, 88, 0.8);
            opacity: 1;
          }
          90% {
            transform: scale(1.4);
            fill: rgba(199, 131, 88, 1);
            opacity: 0.9;
          }
          95% {
            transform: scale(1.6);
            fill: rgba(199, 131, 88, 1);
            opacity: 0;
          }
          100% {
            transform: scale(0.9);
            fill: rgba(199, 131, 88, 0.1);
            opacity: 0.8;
          }
        }
        .animate-heart-burst {
          animation: heart-pulse-burst 4s infinite ease-in-out;
        }
      ` }} />
    </div>
  );
}
