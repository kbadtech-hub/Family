'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Lock, ShieldAlert } from 'lucide-react';

export default function PrivacyBlurOverlay() {
  const locale = useLocale();
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    // Listen to window focus/blur events
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Also support document visibilitychange API (screen lock or app switcher trigger)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isBlurred) return null;

  const getOverlayText = (lang: string) => {
    switch (lang) {
      case 'am':
        return {
          title: 'ይህ ገጽ የተጠበቀ ነው (Protected View)',
          desc: 'ለደህንነትዎ ሲባል መተግበሪያው በማያ ገጽ ቀረጻ ወይም በማይታይበት ጊዜ ይደበቃል።'
        };
      case 'om':
        return {
          title: 'Ilaalcha Eegame',
          desc: 'Nageenya keessaniif jecha, yeroo viidiyoon waraabamu ykn yeroo mul\'atutti ni dhoksama.'
        };
      case 'ti':
        return {
          title: 'እዚ ገጽ ዝተሓለወ እዩ',
          desc: 'ንድሕንነትኩም ክብል እቲ መተግበሪያ ኣብ ዝተኸደነሉ እዋን ብምስጢር ይዕጾ።'
        };
      case 'so':
        return {
          title: 'Muuqaal La Difaacay',
          desc: 'Amnigaaga awgeed, arjiga waa la qarinayaa marka shaashada la duubayo ama la daminayo.'
        };
      case 'ar':
        return {
          title: 'شاشة محمية للخصوصية',
          desc: 'لحماية خصوصيتك وأمانك، يتم حجب محتوى الصفحة أثناء المغادرة أو تسجيل الشاشة.'
        };
      default:
        return {
          title: 'Privacy Shield Active',
          desc: 'For your security, this screen is blurred while you are away or if screen capture is active.'
        };
    }
  };

  const texts = getOverlayText(locale);

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
      <div className="max-w-xs space-y-4">
        <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner animate-pulse">
          <Lock size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-md font-bold text-white uppercase tracking-wider">{texts.title}</h3>
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
            <ShieldAlert size={12} /> Beteseb Encryption
          </p>
        </div>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          {texts.desc}
        </p>
      </div>
    </div>
  );
}
