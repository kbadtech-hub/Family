'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Mail, Lock, ChevronRight, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, Phone, Globe } from 'lucide-react';
import { validatePassword } from '@/lib/password-validator';
import { COUNTRIES } from '@/lib/countries';

function SignupContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(locale === 'am' ? 'የይለፍ ቃል አይመሳሰልም' : locale === 'ti' ? 'መሕለፊ ቃል አይሰማማዕን' : 'Passwords do not match');
      setIsLoading(false);
      return;
    }

    const { isValid, errorKey } = validatePassword(password);
    if (!isValid) {
      setError(t(`errors.${errorKey}`));
      setIsLoading(false);
      return;
    }

    const prefLocation = searchParams.get('pref_location');
    const identifier = authMode === 'email' ? email : `${countryCode}${phone}`;
 
    try {
      const signupParams: any = {
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            is_onboarded: false,
            verification_status: 'unverified',
            pref_location: prefLocation || 'Local'
          }
        }
      };

      if (authMode === 'email') {
        signupParams.email = email;
      } else {
        signupParams.phone = identifier;
      }

      const { data, error: authError } = await supabase.auth.signUp(signupParams);

      if (authError) throw authError;

      if (data.user) {
        setIsSuccess(true);
        // After 3 seconds, redirect to OTP verification step in onboarding
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(identifier)}`);
        }, 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-border">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-accent mb-4 italic">
            {locale === 'am' ? 'እንኳን ደስ አለዎት!' : locale === 'ti' ? 'እንቋዕ ደስ በለኩም!' : 'Registration Successful!'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {locale === 'am' ? 'የማረጋገጫ ኮድ ወደ ኢሜልዎ ልከናል:: እባክዎ ኢሜልዎን ያረጋግጡ::' : locale === 'ti' ? 'ናይ ምርግጋጽ ኮድ ናብ ኢሜልኩም ሰዲድና አለና። ብኽብረትኩም ኢሜልኩም አረጋግጹ።' : 'We have sent a verification code to your email. Please check your inbox.'}
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-bold animate-pulse">
             <Loader2 className="animate-spin" size={18} />
             <span>{locale === 'am' ? 'ወደ ቀጣዩ ገጽ በመውሰድ ላይ...' : locale === 'ti' ? 'ናብ ቀጻሊ ገጽ ይወስደኩም አሎ...' : 'Redirecting to verification...'}</span>
          </div>
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
          <p className="text-gray-400 mt-4 font-medium tracking-widest uppercase text-[10px]">
             {locale === 'am' ? 'የኢትዮጵያውያን የትዳር መድረክ' : locale === 'ti' ? 'ናይ ኤርትራውያንን ኢትዮጵያውያንን ናይ ሓዳር መድረኽ' : 'Global Habesha Matching'}
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-10 border border-border relative overflow-hidden">
          <div className="relative">
            <h2 className="text-2xl font-bold text-accent mb-8 italic">{t('signUp')}</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Auth Mode Toggle */}
            <div className="flex gap-2 p-1.5 bg-[#F8F4F1] rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setAuthMode('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-accent'}`}
              >
                <Mail size={14} /> {t('email')}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-accent'}`}
              >
                <Phone size={14} /> {t('phoneTab')}
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {authMode === 'email' ? (
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
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('phone')}</label>
                  <div className="flex gap-2">
                    <div className="relative group min-w-[120px]">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                      <select 
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        aria-label="Select country code"
                        className="w-full pl-10 pr-4 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none appearance-none transition-all font-bold text-accent text-sm"
                      >
                        {COUNTRIES.map(c => <option key={c.iso} value={c.code}>{c.iso} {c.code}</option>)}
                      </select>
                    </div>
                    <div className="relative group flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-accent"
                        placeholder="912345678"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('password')}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-accent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all rounded-xl"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{locale === 'am' ? 'የይለፍ ቃል ማረጋገጫ' : 'Confirm Password'}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-accent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 px-2 group cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                <div className="relative flex items-center justify-center mt-1">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-border transition-all checked:bg-primary checked:border-primary hover:border-primary/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <CheckCircle2 
                    size={14} 
                    className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                  />
                </div>
                <label className="text-sm text-gray-500 font-medium cursor-pointer leading-tight select-none">
                  {t.rich('agreement', {
                    terms: (chunks) => (
                      <a 
                        href={`/${locale}/terms`} 
                        target="_blank" 
                        className="text-primary hover:underline font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {chunks}
                      </a>
                    ),
                    privacy: (chunks) => (
                      <a 
                        href={`/${locale}/privacy`} 
                        target="_blank" 
                        className="text-primary hover:underline font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {chunks}
                      </a>
                    )
                  })}
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('signUp')} <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-400 text-sm font-medium">
                {locale === 'am' ? 'አካውንት አለዎት?' : 'Already have an account?'}{' '}
                <button 
                  onClick={() => router.push('/login')}
                  className="text-primary font-bold hover:underline ml-1"
                >
                  {t('signIn')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
