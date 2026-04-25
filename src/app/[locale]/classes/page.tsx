'use client';

import React from 'react';
import { Calendar, Heart, Star, Sparkles, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

export default function ClassesPage() {
  const t = useTranslations('Classes');
  const locale = useLocale();

  const CLASSES = [
    {
      title: t('list.class1.title'),
      desc: t('list.class1.desc'),
      icon: Star,
      date: t('list.class1.date'),
      badge: t('list.class1.badge')
    },
    {
      title: t('list.class2.title'),
      desc: t('list.class2.desc'),
      icon: Heart,
      date: t('list.class2.date'),
      badge: t('list.class2.badge')
    },
    {
      title: t('list.class3.title'),
      desc: t('list.class3.desc'),
      icon: ShieldCheck,
      date: t('list.class3.date'),
      badge: t('list.class3.badge')
    }
  ];

  return (
    <div className="bg-[#FDFBF9] min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <section className="py-32 px-6 flex flex-col items-center text-center space-y-8 bg-[radial-gradient(circle_at_bottom_right,_var(--primary)_0%,_transparent_40%)] bg-opacity-5">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 rounded-full text-primary font-black text-xs tracking-widest uppercase">
           <Sparkles size={16} className="fill-primary" />
           {t('hero.tagline')}
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-accent tracking-tighter max-w-4xl">
          {t('hero.title1')} <br /> <span className="text-primary italic underline decoration-primary/20">{t('hero.title2')}</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <Link href="/onboarding" className="btn-primary text-xl py-5 px-16 shadow-2xl shadow-primary/20 flex items-center gap-3">
           {t('hero.cta')} <ArrowRight size={24} className={locale === 'ar' ? 'rotate-180' : ''} />
        </Link>
      </section>

      {/* Class Grid */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {CLASSES.map((c, i) => (
                <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden border border-gray-100 relative">
                   <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-24 h-24 bg-primary/5 rounded-full ${locale === 'ar' ? '-ml-12' : '-mr-12'} -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                   
                   <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all mb-8 shadow-inner">
                      <c.icon size={32} />
                   </div>
                   
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{c.badge}</p>
                   <h3 className="text-2xl font-black text-accent mb-4 tracking-tighter uppercase">{c.title}</h3>
                   <p className="text-gray-500 text-sm leading-relaxed mb-8">{c.desc}</p>
                   
                   <div className="pt-6 border-t border-muted/50 flex items-center gap-3 text-xs font-bold text-accent italic">
                      <Calendar size={14} className="text-primary" />
                      {c.date}
                   </div>
                </div>
            ))}
         </div>
      </section>

      {/* Counseling Feature */}
      <section className="py-32 bg-accent text-white px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--secondary)_0%,_transparent_70%)] opacity-10" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center relative z-10">
           <div className={`flex-1 space-y-10 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em]">{t('counseling.tagline')}</h2>
              <h3 className="text-5xl md:text-7xl font-black tracking-tight leading-none">{t('counseling.title1')} <br /> <span className="text-primary italic">{t('counseling.title2')}</span></h3>
              <p className="text-lg text-white/50 leading-relaxed max-w-xl">
                 {t('counseling.subtitle')}
              </p>
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <p className="text-3xl font-black text-primary">{t('counseling.stat1Value')}</p>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{t('counseling.stat1Label')}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-3xl font-black text-primary">{t('counseling.stat2Value')}</p>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{t('counseling.stat2Label')}</p>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full bg-white/5 backdrop-blur-3xl rounded-[4rem] p-12 border border-white/10 shadow-2xl">
              <div className="space-y-8">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                       <BookOpen className="text-white" />
                    </div>
                    <p className="text-xl font-black uppercase tracking-tighter">{t('counseling.curriculumTitle')}</p>
                 </div>
                 <div className="space-y-4">
                    {[
                      t('counseling.topics.t1'),
                      t('counseling.topics.t2'),
                      t('counseling.topics.t3'),
                      t('counseling.topics.t4')
                    ].map((f, i) => (
                       <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
                          <p className="text-xs font-black uppercase tracking-widest text-white/80">{f}</p>
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Heart size={10} className="fill-white text-white" /></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer Meta */}
      <section className="py-24 px-8 text-center bg-white">
         <p className="text-xs font-black text-accent/20 uppercase tracking-[0.5em] mb-8">{t('footerMeta')}</p>
         <Link href="/onboarding" className="inline-flex items-center gap-2 btn-primary text-xl py-5 px-16 group">
            {t('footerCTA')} <ArrowRight className={`group-hover:translate-x-2 transition-transform ${locale === 'ar' ? 'rotate-180' : ''}`} />
         </Link>
      </section>
    </div>
  );
}
