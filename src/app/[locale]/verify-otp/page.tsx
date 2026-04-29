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
  const type = (searchParams.get('type') || 'signup') as 'signup' | 'recovery';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const otpRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ];

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      // Focus last filled box or next empty
      const nextIndex = Math.min(pastedData.length, 5);
      otpRefs[nextIndex].current?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== '' && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const isEmail = email.includes('@');
      const verifyParams: any = {
        token: otpValue,
        type: type
      };

      if (isEmail) {
        verifyParams.email = email;
      } else {
        verifyParams.phone = email;
      }

      const { error } = await supabase.auth.verifyOtp(verifyParams);

      if (error) throw error;
      
      setIsSuccess(true);
      // Redirect based on type
      setTimeout(() => {
        if (type === 'recovery') {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        } else {
          router.push('/dashboard');
        }
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

  const handleResendOTP = async () => {
    setErrorMsg('');
    try {
      const isEmail = email.includes('@');
      let res;
      if (isEmail) {
        const resendType = (type === 'recovery' ? 'recovery' : 'signup') as any;
        res = await supabase.auth.resend({
          type: resendType,
          email: email,
        });
      } else {
        res = await supabase.auth.resend({
          type: 'sms_otp',
          phone: email,
        });
      }

      if (res.error) throw res.error;
      alert(locale === 'am' ? 'ኮዱ እንደገና ተልኳል' : 'Code resent successfully!');
    } catch (error: any) {
      setErrorMsg(error.message);
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

            <form onSubmit={handleVerifyOTP} className="space-y-8">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-16 md:w-14 md:h-20 bg-[#F8F4F1] border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl text-center text-2xl md:text-3xl font-black transition-all outline-none text-accent"
                    placeholder="•"
                  />
                ))}
              </div>
              
              {errorMsg && (
                <p className="text-red-500 text-sm font-bold animate-pulse">{errorMsg}</p>
              )}

              <button 
                type="submit"
                disabled={isSubmitting || otp.join('').length !== 6}
                className="w-full bg-primary text-white py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 font-black uppercase tracking-widest text-xs transition-all hover:bg-primary/90 active:scale-95"
              >
                {isSubmitting ? (
                   <Loader2 className="animate-spin" size={20} />
                ) : (
                   <>{locale === 'am' ? 'አረጋግጥ' : locale === 'ti' ? 'አረጋግጥ' : 'Verify & Continue'} <ChevronRight size={18} /></>
                )}
              </button>
            </form>

            <div className="pt-4 space-y-4">
              <p className="text-sm text-gray-400 font-medium">
                {locale === 'am' ? 'ኮዱ አልደረሰዎትም?' : 'Didn\'t receive the code?'}
                <button 
                  onClick={handleResendOTP}
                  className="text-primary font-bold ml-2 hover:underline"
                >
                  {locale === 'am' ? 'እንደገና ላክ' : 'Resend Code'}
                </button>
              </p>

              <button 
                onClick={() => router.push(type === 'recovery' ? '/forgot-password' : '/signup')}
                className="text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors block mx-auto"
              >
                {locale === 'am' ? 'ተመለስ' : locale === 'ti' ? 'ተመለሱ' : 'Go Back'}
              </button>
            </div>
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
