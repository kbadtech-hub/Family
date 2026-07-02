'use client';

import React from 'react';
import { ShieldCheck, Smartphone, X } from 'lucide-react';
import { useLocale } from 'next-intl';

interface NativeIAPModalProps {
  onClose: () => void;
  currency: 'ETB' | 'USD';
}

/**
 * NativeIAPModal — Shown inside native app (Capacitor) builds.
 * Never renders web checkout buttons. Only shows informational contact.
 * Complies with Google Play and Apple App Store billing policies.
 */
export default function NativeIAPModal({ onClose, currency }: NativeIAPModalProps) {
  const locale = useLocale();

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-t-[2.5rem] w-full max-w-lg p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-accent uppercase tracking-tight">
                {locale === 'am' ? 'ፕሪሚየም አባልነት' : 'Premium Membership'}
              </h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                {locale === 'am' ? 'ሙሉ ተደራሽነት ያግኙ' : 'Get Full Access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          {(locale === 'am' ? [
            '✅ ያልተወሰነ የድምጽ ጥሪ',
            '✅ ቪዲዮ ጥሪ',
            '✅ ያልተወሰነ መልዕክት',
            '✅ የወዳጅነት ጥያቄ ላክ',
            '✅ የኮሚኒቲ ፖስቶች',
            '✅ ፕሮፋይሎችን በቅጡ ይመልከቱ',
          ] : [
            '✅ Unlimited audio calls',
            '✅ Video calling',
            '✅ Unlimited messaging',
            '✅ Send friend requests',
            '✅ Community posting',
            '✅ View full profiles',
          ]).map((benefit, i) => (
            <div key={i} className="text-sm font-semibold text-accent">{benefit}</div>
          ))}
        </div>

        {/* Payment Instructions — No web checkout button */}
        <div className="bg-muted rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="text-xs font-black text-accent uppercase tracking-widest">
              {locale === 'am' ? 'እንዴት ክፍያ ይፈጸማል' : 'How to Subscribe'}
            </h3>
          </div>
          {currency === 'ETB' ? (
            <div className="space-y-2 text-xs text-gray-600 font-medium">
              <p>1. {locale === 'am' ? 'ቴሌብር ወይም CBE ቢሮ ወደ +251946414018 ይላኩ' : 'Send payment via TeleBirr or CBE to +251946414018'}</p>
              <p>2. {locale === 'am' ? 'ስምዎን እና ፕላኑን ጽፈው ስሕተቱን ይላኩ' : 'Note your name and plan, then send the receipt'}</p>
              <p>3. {locale === 'am' ? 'ፕሪሚየምዎ በ24 ሰዓት ውስጥ ይሰጣል' : 'Your premium will be activated within 24 hours'}</p>
              <div className="bg-primary/10 rounded-xl p-3 text-center font-black text-primary text-xs">
                📧 betesebhub@gmail.com
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-gray-600 font-medium">
              <p>1. {locale === 'am' ? 'ኢሜይል ይላኩ፡ betesebhub@gmail.com' : 'Email us at: betesebhub@gmail.com'}</p>
              <p>2. {locale === 'am' ? 'ፕላን፣ ስምዎና ፔይፓልዎን ያካትቱ' : 'Include your plan, name, and PayPal ID'}</p>
              <p>3. {locale === 'am' ? 'ፕሪሚየምዎ በ24 ሰዓት ውስጥ ይሰጣል' : 'We will activate your premium within 24 hours'}</p>
              <div className="bg-primary/10 rounded-xl p-3 text-center font-black text-primary text-xs">
                📧 betesebhub@gmail.com
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl"
        >
          {locale === 'am' ? 'ዝጋ' : 'Close'}
        </button>
      </div>
    </div>
  );
}
