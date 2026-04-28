'use client';

import React, { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Mail, ChevronRight, AlertCircle, Loader2, Key } from 'lucide-react';

function ForgotPasswordContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (resetError) throw resetError;

      setIsSuccess(true);
      // Redirect to verify OTP page for password recovery after 2 seconds
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=recovery`);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-border">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} />
          </div>
          <h2 className="text-2xl font-bold text-accent mb-4 italic">
            {locale === 'am' ? 'ኢሜል ተልኳል!' : locale === 'ti' ? 'ኢሜል ተሰዲዱ!' : 'Email Sent!'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {locale === 'am' ? 'ባለ 6 አሃዝ የማረጋገጫ ኮድ ወደ ኢሜልዎ ልከናል::' : locale === 'ti' ? '6 ቁጽሪ ዘለዎ ኮድ ናብ ኢሜልኩም ሰዲድና አለና።' : 'We have sent a 6-digit verification code to your email.'}
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-bold animate-pulse">
             <Loader2 className="animate-spin" size={18} />
             <span>{locale === 'am' ? 'ወደ ማረጋገጫ ገጽ በመውሰድ ላይ...' : locale === 'ti' ? 'ናብ መረጋገጺ ገጽ ይወስደኩም አሎ...' : 'Redirecting to verification...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Image src="/logo.png" alt="Beteseb" width={200} height={50} className="h-12 w-auto mx-auto object-contain" priority />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-border relative overflow-hidden">
          <div className="relative">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
               <Key size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-accent mb-2 italic">{t('forgot')}</h2>
            <p className="text-gray-400 text-sm mb-8 font-medium">
               {locale === 'am' ? 'የይለፍ ቃልዎን ለመቀየር ኢሜልዎን ያስገቡ' : locale === 'ti' ? 'መሕለፊ ቃልኩም ንምቕያር ኢሜልኩም አእትዉ' : 'Enter your email to receive a password reset code.'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('email')}</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-accent"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{t('processing')} <ChevronRight size={18} /></>}
              </button>
            </form>

            <div className="mt-8 text-center">
               <button onClick={() => router.push('/login')} className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">
                  {locale === 'am' ? 'ወደ መግቢያ ተመለስ' : locale === 'ti' ? 'ናብ መእተዊ ተመለሱ' : 'Back to Login'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
