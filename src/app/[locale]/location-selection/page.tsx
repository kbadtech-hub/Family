'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from '@/i18n/routing';

export default function LocationSelectionPage() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const router = useRouter();

  const handleSelection = (location: 'Local' | 'Diaspora') => {
    // Redirect to signup with the preference
    router.push(`/signup?pref_location=${location}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_40%)] opacity-5" />
      
      <div className="max-w-4xl w-full bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="text-center mb-16 space-y-6 relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
              <Sparkles size={14} />
              {t('modal.step1')}
           </div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#0F172A]">
              {t('modal.where')}
           </h1>
           <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed italic">
              {t('modal.currencyNote')}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <button 
              onClick={() => handleSelection('Local')}
              className="group p-12 rounded-[3rem] bg-white border-2 border-border hover:border-primary hover:shadow-2xl transition-all text-center space-y-8 duration-500 hover:-translate-y-2"
           >
              <div className="mx-auto w-24 h-24 bg-[#F8F4F1] rounded-[2rem] flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                 <MapPin size={48} className="text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-2">
                 <p className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">{t('modal.localTitle')}</p>
                 <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Select <ArrowRight size={14} />
                 </div>
              </div>
           </button>

           <button 
              onClick={() => handleSelection('Diaspora')}
              className="group p-12 rounded-[3rem] bg-white border-2 border-border hover:border-primary hover:shadow-2xl transition-all text-center space-y-8 duration-500 hover:-translate-y-2"
           >
               <div className="mx-auto w-24 h-24 bg-[#F8F4F1] rounded-[2rem] flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                  <Globe size={48} className="text-primary group-hover:scale-110 transition-transform" />
               </div>
               <div className="space-y-2">
                  <p className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">{t('modal.globalTitle')}</p>
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Select <ArrowRight size={14} />
                 </div>
               </div>
            </button>
        </div>

        <div className="mt-16 text-center">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{locale === 'am' ? 'ቤተሰብ | የግል ደህንነትዎ የተጠበቀ ነው' : 'BETESEB | YOUR PRIVACY IS SECURED'}</p>
        </div>
      </div>
    </div>
  );
}
