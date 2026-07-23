'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle, signInWithFacebook, signInWithApple } from '@/lib/firebase-auth';
import GeoGuard from '@/components/GeoGuard';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Mail, 
  Phone, 
  Lock, 
  ChevronRight, 
  AlertCircle, 
  Loader2, 
  Globe, 
  Eye, 
  EyeOff, 
  ArrowLeft 
} from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';

const getSlogan = (lang: string) => {
  switch (lang) {
    case 'am': return 'የኢትዮጵያውያን የትዳር መድረክ';
    case 'om': return 'Platformii Gaa’ela Habashaa';
    case 'ti': return 'ናይ መጻምድቲ መድረኽ ኢትዮጵያውያን';
    case 'ar': return 'منصة الزواج الأثيوبية العالمية';
    case 'so': return 'Madasha Guurka Ee Habesha';
    default: return 'Global Habesha Marriage Platform';
  }
};

const getEmailLoginLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'በኢሜይል ይግቡ';
    case 'om': return 'Imeeliin Seenaa';
    case 'ti': return 'ብኢሜል እተዉ';
    case 'ar': return 'تسجيل الدخول بالبريد';
    case 'so': return 'Ku gal Imeelka';
    default: return 'Sign in with Email';
  }
};

const getPhoneLoginLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'በስልክ ቁጥር ይግቡ';
    case 'om': return 'Bilbilaan Seenaa';
    case 'ti': return 'ብቁፅሪ ስልኪ እተዉ';
    case 'ar': return 'تسجيل الدخول بالهاتف';
    case 'so': return 'Ku gal Nambarka';
    default: return 'Sign in with Phone';
  }
};

function LoginContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  
  // View state: 'initial' | 'email' | 'phone' | 'phone-verification-gate'
  const [view, setView] = useState<'initial' | 'email' | 'phone' | 'phone-verification-gate'>('initial');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Phone OTP Flow States
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  // Verification Gate for social/email users lacking phone number
  const [verificationUser, setVerificationUser] = useState<any>(null);
  const [gatePhone, setGatePhone] = useState('');
  const [gateCountryCode, setGateCountryCode] = useState('+251');
  const [gateOtpCode, setGateOtpCode] = useState('');
  const [isGateOtpSent, setIsGateOtpSent] = useState(false);
  const [gateVerificationId, setGateVerificationId] = useState<string | null>(null);

  // Initialize invisible reCAPTCHA when phone view or verification gate is entered
  useEffect(() => {
    if ((view === 'phone' || view === 'phone-verification-gate') && typeof window !== 'undefined') {
      const initRecaptcha = async () => {
        const { setupRecaptcha } = await import('@/lib/firebase-auth');
        const verifier = setupRecaptcha('recaptcha-container');
        if (verifier) {
          setRecaptchaVerifier(verifier);
        }
      };
      initRecaptcha();
    }
  }, [view]);

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setError('');
    setIsLoading(true);

    try {
      // Use Firebase Auth popup — no page redirect, no loop risk
      const result = provider === 'google'
        ? await signInWithGoogle()
        : provider === 'facebook'
        ? await signInWithFacebook()
        : await signInWithApple();

      if (!result.success || !result.firebaseUser) {
        setError(result.error || 'Sign-in failed. Please try again.');
        return;
      }

      // Existing user → go straight to dashboard
      // All users go directly to dashboard (onboarding can be done voluntarily from dashboard)
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (view === 'email') {
        // ── Email Login via Supabase Auth (direct — no Firebase needed) ─────────
        const { supabase } = await import('@/lib/supabase');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError || !data.user) {
          setError(signInError?.message || 'Login failed. Please check your credentials.');
          return;
        }

        router.push('/dashboard');

      } else if (view === 'phone') {
        // ── Phone Login via Supabase Auth with derived email (No OTP!) ──────────
        const fullPhoneNumber = `${countryCode}${phone}`;
        const derivedEmail = `${fullPhoneNumber.replace('+', '')}@phone.beteseb.app`;

        const { supabase } = await import('@/lib/supabase');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: derivedEmail,
          password,
        });

        if (signInError || !data.user) {
          setError(signInError?.message || 'Login failed. Please check your credentials.');
          return;
        }

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyGatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { sendPhoneOtp, linkPhoneWithCurrentUser, setupRecaptcha } = await import('@/lib/firebase-auth');

      if (!isGateOtpSent) {
        let verifier = recaptchaVerifier;
        if (!verifier) {
          verifier = setupRecaptcha('recaptcha-container');
          if (verifier) setRecaptchaVerifier(verifier);
        }
        if (!verifier) {
          throw new Error('reCAPTCHA verification failed to initialize. Please check your internet connection.');
        }
        const fullPhoneNumber = `${gateCountryCode}${gatePhone}`;
        const res = await sendPhoneOtp(fullPhoneNumber, verifier);

        if (!res.success || !res.confirmationResult) {
          setError(res.error || 'Failed to send OTP.');
          return;
        }

        setGateVerificationId(res.confirmationResult.verificationId);
        setIsGateOtpSent(true);
      } else {
        if (!gateVerificationId) throw new Error('Verification reference expired.');
        const result = await linkPhoneWithCurrentUser(gateVerificationId, gateOtpCode);

        if (!result.success) {
          setError(result.error || 'Phone verification failed.');
          return;
        }

        // Successfully linked phone, profile synced. Direct to dashboard or onboarding.
        router.push(result.isNewUser ? '/onboarding' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      router.push('/');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 cursor-pointer"
      onClick={handleBackgroundClick}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
      <div id="recaptcha-container" className="hidden" />
      <div className="max-w-md w-full cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Branding */}
        <div className="text-center mb-8">
          <Image 
            src="/logo.png" 
            alt="Beteseb" 
            width={200} 
            height={50} 
            className="h-10 w-auto mx-auto object-contain"
            priority
          />
          <p className="text-gray-400 mt-3 font-medium tracking-widest uppercase text-[9px]">
             {getSlogan(locale)}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-10 border border-border relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-accent italic">
                {view === 'initial' ? t('signIn') : view === 'email' ? getEmailLoginLabel(locale) : getPhoneLoginLabel(locale)}
              </h2>
              {view !== 'initial' && (
                <button 
                  onClick={() => setView('initial')}
                  className="p-2 text-gray-400 hover:text-primary transition-all rounded-full hover:bg-primary/5"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Coming Soon Toast */}
            {toast.show && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs animate-in fade-in slide-in-from-top-2">
                <span className="text-lg">⏳</span>
                <p className="font-medium leading-relaxed">{toast.message}</p>
              </div>
            )}

            {view === 'initial' ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3">

                  {/* Phone */}
                  <button
                    type="button"
                    onClick={() => setView('phone')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-gray-400 group-hover:text-primary transition-colors">
                      <Phone size={18} />
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {getPhoneLoginLabel(locale)}
                    </span>
                  </button>

                  {/* Email */}
                  <button
                    type="button"
                    onClick={() => setView('email')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-gray-400 group-hover:text-primary transition-colors">
                      <Mail size={18} />
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {getEmailLoginLabel(locale)}
                    </span>
                  </button>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {locale === 'am' ? 'በGoogle ይግቡ' : 'Sign in with Google'}
                    </span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-[#1877F2]">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {locale === 'am' ? 'በFacebook ይግቡ' : 'Sign in with Facebook'}
                    </span>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('apple')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-gray-800">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.97.08 2.13-.52 2.82-1.33z" />
                      </svg>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {locale === 'am' ? 'በApple ይግቡ' : 'Sign in with Apple'}
                    </span>
                  </button>

                </div>
              </div>
            ) : view === 'phone-verification-gate' ? (
              /* ── Phone Verification Gate (for Email/Social users without phone) ── */
              <form onSubmit={handleVerifyGatePhone} className="space-y-5">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                  <span className="text-2xl block mb-2">🔐</span>
                  <p className="text-amber-800 text-xs font-bold">
                    {locale === 'am'
                      ? 'ደህንነትዎን ለማረጋገጥ ስልክ ቁጥርዎን ያስገቡ'
                      : 'For your security, please verify your phone number to continue'}
                  </p>
                </div>

                {!isGateOtpSent ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                      {locale === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative group min-w-[110px]">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <select
                          value={gateCountryCode}
                          onChange={(e) => setGateCountryCode(e.target.value)}
                          aria-label="Select country code"
                          className="w-full pl-9 pr-2 py-4 bg-[#F8F4F1] rounded-2xl outline-none appearance-none font-bold text-accent text-xs"
                        >
                          {COUNTRIES.map(c => <option key={c.iso} value={c.code}>{c.iso} {c.code}</option>)}
                        </select>
                      </div>
                      <div className="relative group flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                        <input
                          type="tel"
                          required
                          value={gatePhone}
                          onChange={(e) => setGatePhone(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[#F8F4F1] rounded-2xl outline-none font-medium text-accent"
                          placeholder="912345678"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-gray-500 font-medium">
                      {locale === 'am'
                        ? `ወደ ${gateCountryCode}${gatePhone} የ 6-ዲጂት ኮድ ተልኳል`
                        : `A 6-digit code was sent to ${gateCountryCode}${gatePhone}`}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={gateOtpCode}
                      onChange={(e) => setGateOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-black tracking-[0.5em] py-5 bg-[#F8F4F1] rounded-2xl outline-none text-accent border-2 border-transparent focus:border-primary transition-all"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => { setIsGateOtpSent(false); setGateOtpCode(''); setGateVerificationId(null); }}
                      className="text-xs text-gray-400 hover:text-primary text-center w-full"
                    >
                      {locale === 'am' ? 'ቁጥሩን ቀይር / ኮዱን እንደገና ላክ' : 'Change number / Resend code'}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (isGateOtpSent && gateOtpCode.length < 6) || (!isGateOtpSent && gatePhone.length < 7)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : isGateOtpSent ? (
                    <>{locale === 'am' ? 'አረጋግጥ' : 'Verify & Continue'} <ChevronRight size={18} /></>
                  ) : (
                    <>{locale === 'am' ? 'ኮድ ላክ' : 'Send Verification Code'} <ChevronRight size={18} /></>
                  )}
                </button>
              </form>
            ) : (
              /* ── Email / Phone Login Form ── */
              <form onSubmit={handleLogin} className="space-y-5">
                {view === 'email' ? (
                  <div className="space-y-1.5">
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
                ) : isOtpSent ? (
                  /* OTP Code Entry for Phone Login */
                  <div className="space-y-3">
                    <p className="text-center text-sm text-gray-500 font-medium">
                      {locale === 'am'
                        ? `ወደ ${countryCode}${phone} የ 6-ዲጂት ኮድ ተልኳል`
                        : `A 6-digit code was sent to ${countryCode}${phone}`}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-black tracking-[0.5em] py-5 bg-[#F8F4F1] rounded-2xl outline-none text-accent border-2 border-transparent focus:border-primary transition-all"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => { setIsOtpSent(false); setOtpCode(''); setConfirmationResult(null); }}
                      className="text-xs text-gray-400 hover:text-primary text-center w-full"
                    >
                      {locale === 'am' ? 'ቁጥሩን ቀይር / ኮዱን እንደገና ላክ' : 'Change number / Resend code'}
                    </button>
                  </div>
                ) : (
                  /* Phone Number Entry */
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('phone')}</label>
                    <div className="flex gap-2">
                      <div className="relative group min-w-[110px]">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={16} />
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          aria-label="Select country code"
                          className="w-full pl-9 pr-2 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none appearance-none transition-all font-bold text-accent text-xs"
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

                {/* Password field — shown for both email and phone login */}
                {(view === 'email' || view === 'phone') && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('password')}</label>
                      <button type="button" onClick={() => router.push('/forgot-password')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">{t('forgot')}</button>
                    </div>
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
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>{t('signIn')} <ChevronRight size={18} /></>
                  )}
                </button>

                {view === 'email' && (
                  <button
                    type="button"
                    onClick={() => { setError(''); setView('phone'); }}
                    className="w-full text-[11px] font-bold text-primary hover:underline text-center pt-3 block"
                  >
                    {locale === 'am' ? '📲 በስልክ ቁጥር ለመግባት እዚህ ይጫኑ' : '📲 Sign in with Phone Number instead'}
                  </button>
                )}

                {view === 'phone' && (
                  <button
                    type="button"
                    onClick={() => { setError(''); setView('email'); }}
                    className="w-full text-[11px] font-bold text-primary hover:underline text-center pt-3 block"
                  >
                    {locale === 'am' ? '✉️ በኢሜይል አድራሻ ለመግባት እዚህ ይጫኑ' : '✉️ Sign in with Email Address instead'}
                  </button>
                )}
              </form>
            )}

            <div className="mt-8 text-center pt-6 border-t border-border">
              <p className="text-gray-400 text-xs font-medium">
                {t('noAccount')}{' '}
                <button 
                  onClick={() => router.push('/signup')}
                  className="text-primary font-bold hover:underline ml-1"
                >
                  {t('signUp')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <GeoGuard>
        <LoginContent />
      </GeoGuard>
    </Suspense>
  );
}
