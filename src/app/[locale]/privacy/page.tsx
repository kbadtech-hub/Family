'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ShieldCheck, Lock, EyeOff, Heart } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('Legal.Privacy');
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-muted py-24 px-6 md:px-12" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-accent tracking-tighter italic">
            {t('title')}
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
        </div>

        <div className="card-premium prose prose-lg max-w-none animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <div className="flex items-start gap-6 mb-8 border-b border-border pb-8">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 text-primary">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-accent mb-2">
                {locale === 'am' ? 'የደህንነት ቃል-ኪዳን' : 'Privacy Promise'}
              </h2>
              <p className="text-gray-500 text-sm italic font-medium">
                {locale === 'am' ? 'የእርስዎ ደህንነት ቅድሚያችን ነው' : 'Your Safety is Our Priority'}
              </p>
            </div>
          </div>

          <p className="text-xl leading-[1.8] text-gray-700 font-medium whitespace-pre-wrap">
            {t('content')}
          </p>

          <div className="mt-12 flex grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-muted p-6 rounded-3xl border border-border flex items-center gap-4 group hover:bg-white transition-all">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                   <Lock size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-accent italic">
                   {locale === 'am' ? 'የታሸገ መረጃ' : 'Sealed Data'}
                </span>
             </div>
             <div className="bg-muted p-6 rounded-3xl border border-border flex items-center gap-4 group hover:bg-white transition-all">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                   <EyeOff size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-accent italic">
                   {locale === 'am' ? 'ሚስጥራዊ ማንነት' : 'Secret Identity'}
                </span>
             </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex items-center gap-4 text-primary">
            <Heart className="fill-current" size={20} />
            <span className="text-sm font-black uppercase tracking-widest">
              {locale === 'am' ? 'ቤተሰብ - የታማኝነት መድረክ' : 'Beteseb - Platform of Trust'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
