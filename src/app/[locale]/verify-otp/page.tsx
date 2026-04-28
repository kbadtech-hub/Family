'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

function VerifyOtpContent() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;
      
      setIsSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Simple Amharic translation for common error
        if (error.message.includes('Token has expired')) {
          setErrorMsg(locale === 'am' ? 'ኮዱ ጊዜው አልፎበታል' : locale === 'ti' ? 'ኮድ ግዚኡ ሓሊፉ አሎ' : 'Code has expired');
        } else {
          setErrorMsg(locale === 'am' ? 'የተሳሳተ ኮድ' : locale === 'ti' ? 'ጌጋ ኮድ' : 'Invalid code');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-border">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-accent mb-4 italic">
            {locale === 'am' ? 'ተረጋግጧል!' : locale === 'ti' ? 'ተረጋጊጹ!' : 'Verified!'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {locale === 'am' ? 'በተሳካ ሁኔታ ገብተዋል:: ወደ ዳሽቦርድ በመውሰድ ላይ...' : locale === 'ti' ? 'ብዝተዓወተ መንገዲ አቲኹም አለኹም። ናብ ዳሽቦርድ ይወስደኩም አሎ...' : 'You have successfully signed in. Redirecting to dashboard...'}
          </p>
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-10">
          <Image 
            src="/logo.png" 
            alt="Beteseb" 
            width={200} 
            height={50} 
            className="h-12 w-auto mx-auto object-contain"
            priority
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-border relative overflow-hidden">
          <div className="relative space-y-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
              <Mail size={40} className="text-primary" />
            </div>
            
            <h2 className="text-3xl font-black text-accent italic">
              {locale === 'am' ? 'ኢሜልዎን ያረጋግጡ' : locale === 'ar' ? 'تحقق من البريد الإلكتروني' : locale === 'om' ? 'Imeelii keessan mirkaneessaa' : locale === 'ti' ? 'ኢሜልኩም አረጋግጹ' : 'Verify Email'}
            </h2>
            
            <p className="text-gray-500 font-medium">
              {locale === 'am' ? `ወደ ${email} የላክነውን ባለ 6 ዲጂት ኮድ ያስገቡ` : locale === 'ti' ? `ናብ ${email} ዝሰደድናዮ 6 ቁጽሪ ዘለዎ ኮድ አእትዉ` : `Enter the 6-digit code we sent to ${email}`}
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                autoFocus
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#F8F4F1] border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-[2rem] p-6 text-center text-4xl font-black tracking-[0.5em] transition-all text-accent outline-none"
                placeholder="000000"
              />
              
              {errorMsg && (
                <p className="text-red-500 text-sm font-bold animate-pulse">{errorMsg}</p>
              )}

              <button 
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full bg-primary text-white py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 font-black uppercase tracking-widest text-xs"
              >
                {isSubmitting ? (
                   <Loader2 className="animate-spin" size={20} />
                ) : (
                   <>{locale === 'am' ? 'አረጋግጥ' : locale === 'ti' ? 'አረጋግጥ' : 'Verify & Continue'} <ChevronRight size={18} /></>
                )}
              </button>
            </form>

            <button 
              onClick={() => router.push('/signup')}
              className="text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors"
            >
              {locale === 'am' ? 'ተመለስ' : locale === 'ti' ? 'ተመለሱ' : 'Go Back'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
