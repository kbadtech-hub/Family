'use client';

import React from 'react';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface PremiumGateProps {
  isPremium: boolean;
  children: React.ReactNode;
}

export default function PremiumGate({ isPremium, children }: PremiumGateProps) {
  const t = useTranslations('Premium');
  const locale = useLocale();
  const router = useRouter();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden bg-white p-12 rounded-[3rem] border border-primary/20 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
      
      <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
        <ShieldCheck size={48} className="text-primary fill-primary/10" />
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 rounded-full text-secondary font-black text-[10px] tracking-widest uppercase">
           <Sparkles size={12} className="fill-secondary" />
           PREMIUM ACCESS
        </div>
        <h2 className="text-3xl font-black text-accent italic tracking-tighter uppercase leading-none">
          {locale === 'am' ? 'ፕሪሚየም አገልግሎት' : 'Unlock Premium'}
        </h2>
        <p className="text-gray-500 font-medium leading-relaxed italic">
          {locale === 'am' 
            ? 'ይህንን አገልግሎት ለመጠቀም ፕሪሚየም አባል መሆን ይኖርብዎታል። ዛሬውኑ ይቀላቀሉንና ሁሉንም ጥቅማጥቅሞች ያግኙ።' 
            : 'Upgrade to premium to access this exclusive feature, including private chats, match contacts, and expert classes.'}
        </p>
      </div>

      <div className="pt-4 flex flex-col items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard?tab=payment')}
          className="btn-primary w-full max-w-xs py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs"
        >
          {locale === 'am' ? 'ፕሪሚየም ይሁኑ' : 'Upgrade to Premium'} <ArrowRight size={18} />
        </button>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Payment • Immediate Access</p>
      </div>
    </div>
  );
}
