'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Sparkles, RefreshCw, X, ArrowRight, ShieldAlert } from 'lucide-react';

export default function OnboardingUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    let isMounted = true;

    async function checkOnboardingStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        // Check if user dismissed it during this session
        const sessionDismissed = typeof window !== 'undefined' ? sessionStorage.getItem(`onboarding_popup_dismissed_${session.user.id}`) : null;
        if (sessionDismissed === 'true') {
          setIsLoading(false);
          return;
        }

        // Query profile onboarding update status
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('has_updated_onboarding, onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.warn('[OnboardingUpdateModal] Profile query warning:', error.message);
          setIsLoading(false);
          return;
        }

        if (isMounted && profile && profile.has_updated_onboarding === false) {
          setIsOpen(true);
        }
      } catch (err) {
        console.error('[OnboardingUpdateModal] Error checking status:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && typeof window !== 'undefined') {
      sessionStorage.setItem(`onboarding_popup_dismissed_${session.user.id}`, 'true');
    }
    setIsOpen(false);
  };

  const handleStartUpdate = () => {
    setIsOpen(false);
    router.push('/onboarding?mode=update');
  };

  if (isLoading || !isOpen) return null;

  const isAmharic = locale === 'am';

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden border border-primary/20 animate-in zoom-in-95 duration-300">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-5 right-5 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-all active:scale-95 z-10"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="relative flex flex-col items-center text-center space-y-6">
          {/* Badge Icon */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary/10 via-primary/20 to-pink-100 rounded-[2rem] flex items-center justify-center border border-primary/30 shadow-inner text-primary">
              <Sparkles size={38} className="animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
              {isAmharic ? 'አዲስ የማጣመር ሎጂክ አፕዴት' : 'New Compatibility Update'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {isAmharic
                ? 'የመረጃ እና የተኳሃኝነት አፕዴት ማስታወቂያ'
                : 'Update Your Onboarding Profile'}
            </h2>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs mx-auto">
              {isAmharic
                ? 'በአዲሱ የኮምፓቲቢሊቲ ሎጂክ መሰረት ይበልጥ ተስማሚ የሆኑ ተዛምዶዎችን (Matches) ለማግኘት እና የ % score ለማሳደግ እባክዎን የመረጃ ስብስብዎን ከአዲስ ያድሱ።'
                : 'To get the most accurate compatibility scores (% Match) with the upgraded matching engine, please refresh your onboarding preferences.'}
            </p>
          </div>

          {/* Key Benefit Highlights */}
          <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2.5">
              <RefreshCw size={15} className="text-primary shrink-0" />
              <span>
                {isAmharic
                  ? 'የተሻሻለ 2-Way Geometric Mean ማጣመር'
                  : 'Upgraded 2-Way Geometric Mean algorithm'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={15} className="text-emerald-600 shrink-0" />
              <span>
                {isAmharic
                  ? 'የተሟላ አዲስ የፍላጎት እና እሴቶች መረጃ'
                  : 'Refined life values & partner preferences'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartUpdate}
              className="w-full py-4 bg-gradient-to-r from-primary via-primary to-pink-600 hover:from-primary/95 hover:to-pink-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{isAmharic ? 'መረጃዬን አሁን አድሳለሁ' : 'Update My Profile Now'}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs tracking-wider transition-all"
            >
              {isAmharic ? 'ቆይተው ያሳስቡኝ' : 'Remind Me Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
