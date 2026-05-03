'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Star, Sparkles, ArrowRight, BookOpen, ShieldCheck, GraduationCap, Play } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

export default function ClassesPage() {
  const t = useTranslations('Classes');
  const locale = useLocale();
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase.from('lessons').select('*').limit(3);
      if (data) setLessons(data);
    };
    fetchLessons();
  }, []);

  return (
    <div className="bg-[#FDFBF9] min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <section className="py-20 md:py-32 px-6 flex flex-col items-center text-center space-y-6 md:space-y-8 bg-[radial-gradient(circle_at_bottom_right,_var(--primary)_0%,_transparent_40%)] bg-opacity-5">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] md:text-xs tracking-widest uppercase">
           <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 fill-primary" />
           {t('hero.tagline')}
        </div>
        <h1 className="text-4xl md:text-7xl font-black text-accent tracking-tight max-w-4xl leading-[1.1]">
          {t('hero.title1')} <br /> <span className="text-primary italic underline decoration-primary/20">{t('hero.title2')}</span>
        </h1>
        <p className="text-base md:text-xl text-gray-500 max-w-2xl leading-relaxed font-medium italic">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col md:flex-row gap-4 pt-6 w-full md:w-auto px-4 md:px-0">
           <Link href="/signup" className="btn-primary text-lg md:text-xl py-4 md:py-5 px-10 md:px-16 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3">
              {t('hero.cta')} <ArrowRight className={`w-5 h-5 md:w-6 md:h-6 ${locale === 'ar' ? 'rotate-180' : ''}`} />
           </Link>
           <Link href="/login" className="bg-white text-accent border-2 border-accent/10 text-lg md:text-xl py-4 md:py-5 px-10 md:px-16 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-tighter hover:bg-muted transition-all flex items-center justify-center">
              {t('login')}
           </Link>
        </div>
      </section>

      {/* Course Highlights */}
      <section className="py-16 md:py-24 px-6 md:px-8 max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 md:mb-16 gap-6">
            <div className="space-y-4 text-center md:text-left">
               <h2 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.4em]">{t('curriculum')}</h2>
               <h3 className="text-3xl md:text-4xl font-black text-accent tracking-tighter uppercase">{t('featured')}</h3>
            </div>
            <Link href="/dashboard?tab=workshops" className="text-primary font-black text-[10px] md:text-xs uppercase tracking-widest underline decoration-primary/20 hover:text-accent transition-colors">
               {t('viewAll')}
            </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {lessons.length > 0 ? lessons.map((c, i) => (
                <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden border border-gray-100 relative">
                   <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-24 h-24 bg-primary/5 rounded-full ${locale === 'ar' ? '-ml-12' : '-mr-12'} -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                   
                   <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all mb-8 shadow-inner relative z-10">
                      <Play size={32} className="fill-current" />
                   </div>
                   
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{c.category || t('general')}</p>
                   <h3 className="text-2xl font-black text-accent mb-4 tracking-tighter uppercase line-clamp-1">{c.title}</h3>
                   <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-2 italic font-medium">{c.description}</p>
                   
                   <div className="pt-6 border-t border-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] font-black text-accent italic uppercase tracking-widest">
                         <ShieldCheck size={14} className="text-primary" />
                         {t('premiumOnly')}
                      </div>
                      <Link href="/dashboard?tab=workshops" className="p-3 bg-muted rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
                         <ArrowRight size={18} />
                      </Link>
                   </div>
                </div>
            )) : (
               [1, 2, 3].map((_, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 animate-pulse">
                     <div className="w-16 h-16 bg-muted rounded-2xl mb-8" />
                     <div className="h-6 bg-muted rounded-full w-3/4 mb-4" />
                     <div className="h-4 bg-muted rounded-full w-full mb-2" />
                     <div className="h-4 bg-muted rounded-full w-2/3" />
                  </div>
               ))
            )}
         </div>
      </section>

      {/* Counseling Feature */}
      <section className="py-20 md:py-32 bg-accent text-white px-6 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--secondary)_0%,_transparent_70%)] opacity-10" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 md:gap-20 items-center relative z-10">
           <div className={`flex-1 space-y-6 md:space-y-10 ${locale === 'ar' ? 'text-right' : 'text-left'} text-center md:text-left`}>
              <h2 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.4em]">{t('counseling.tagline')}</h2>
              <h3 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.1] italic">{t('counseling.title1')} <br /> <span className="text-primary">{t('counseling.title2')}</span></h3>
              <p className="text-base md:text-lg text-white/50 leading-relaxed max-w-xl font-medium italic mx-auto md:mx-0">
                 {t('counseling.subtitle')}
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-8 pt-4">
                 <div className="space-y-2">
                    <p className="text-3xl md:text-4xl font-black text-primary">{t('counseling.stat1Value')}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{t('counseling.stat1Label')}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-3xl md:text-4xl font-black text-primary">{t('counseling.stat2Value')}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{t('counseling.stat2Label')}</p>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full bg-white/5 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border border-white/10 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-14 h-14 md:w-20 md:h-20 bg-primary rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-primary/30 animate-bounce">
                 <GraduationCap className="w-7 h-7 md:w-10 md:h-10 text-white" />
              </div>
              <div className="space-y-6 md:space-y-8">
                 <div className="flex gap-4 items-center justify-center md:justify-start">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center">
                       <BookOpen className="text-primary w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <p className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">{t('counseling.curriculumTitle')}</p>
                 </div>
                 <div className="space-y-3 md:space-y-4">
                    {[
                      t('counseling.topics.t1'),
                      t('counseling.topics.t2'),
                      t('counseling.topics.t3'),
                      t('counseling.topics.t4')
                    ].map((f, i) => (
                       <div key={i} className="flex justify-between items-center bg-white/5 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] hover:bg-white/10 transition-all cursor-default border border-white/5">
                          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{f}</p>
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"><Heart className="w-2 h-2 md:w-2.5 md:h-2.5 fill-white text-white" /></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer Meta */}
      <section className="py-32 px-8 text-center bg-white">
         <p className="text-xs font-black text-accent/10 uppercase tracking-[1em] mb-12">{t('footerMeta')}</p>
         <Link href="/signup" className="inline-flex items-center gap-4 btn-primary text-2xl py-6 px-20 group shadow-2xl shadow-primary/20">
            {t('footerCTA')} <ArrowRight className={`group-hover:translate-x-3 transition-transform duration-300 ${locale === 'ar' ? 'rotate-180' : ''}`} />
         </Link>
      </section>
    </div>
  );
}
