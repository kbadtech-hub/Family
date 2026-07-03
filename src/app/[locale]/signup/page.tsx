'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Mail, 
  Lock, 
  ChevronRight, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Phone, 
  Globe, 
  User, 
  ArrowLeft 
} from 'lucide-react';
import { validatePassword } from '@/lib/password-validator';
import { COUNTRIES } from '@/lib/countries';

const getSlogan = (lang: string) => {
  switch (lang) {
    case 'am': return 'የኢትዮጵያውያን የትዳር መድረክ';
    case 'om': return 'Platformii Gaa’ela Habashaa';
    case 'ti': return 'ናይ መጻምድቲ መድረኽ ኢትዮጵያውያን';
    case 'ar': return 'منصة الزواج الأثይوبية العالمية';
    case 'so': return 'Madasha Guurka Ee Habesha';
    default: return 'Global Habesha Marriage Platform';
  }
};

const getEmailSignupLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'በኢሜይል ይቀጥሉ';
    case 'om': return 'Imeeliin Itti Fufa';
    case 'ti': return 'ብኢሜል ይቀጽሉ';
    case 'ar': return 'المتابعة بالبريد الإلكتروني';
    case 'so': return 'Ku sii wad Imeelka';
    default: return 'Continue with Email';
  }
};

const getPhoneSignupLabel = (lang: string) => {
  switch (lang) {
    case 'am': return 'በስልክ ይቀጥሉ';
    case 'om': return 'Bilbilaan Itti Fufa';
    case 'ti': return 'ብቁፅሪ ስልኪ ይቀጽሉ';
    case 'ar': return 'المتابعة برقم الهاتف';
    case 'so': return 'Ku sii wad Nambarka';
    default: return 'Continue with Phone';
  }
};

function SignupContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View state: 'initial' | 'email' | 'phone'
  const [view, setView] = useState<'initial' | 'email' | 'phone'>('initial');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  const handleSocialLogin = (provider: string) => {
    setToast({
      message: locale === 'am' 
        ? `በ ${provider} መግባት በቅርቡ ይመጣል። እባክዎ ለጊዜው በኢሜይል ወይም በስልክ ቁጥር ይጠቀሙ።` 
        : `${provider} login is coming soon. Please use Email or Phone for now.`,
      show: true
    });
  };

  React.useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Auto-redirect on success to dashboard
  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError(locale === 'am' ? 'እባክዎ መጀመሪያ በደንቦቹ ላይ ይስማሙ' : 'Please agree to the terms first');
      return;
    }
    setIsLoading(true);
    setError('');

    const { isValid, errorKey } = validatePassword(password);
    if (!isValid) {
      setError(t(`errors.${errorKey}`));
      setIsLoading(false);
      return;
    }

    const prefLocation = searchParams.get('pref_location');
    const identifier = view === 'email' ? email : `${countryCode}${phone}`;
 
    try {
      const { data, error: authError } = await supabase.auth.signUp(
        view === 'email' 
          ? { 
              email, 
              password, 
              options: {
                data: {
                  full_name: fullName,
                  is_onboarded: false,
                  verification_status: 'unverified',
                  pref_location: searchParams.get('pref_location') || 'Local',
                  trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }
              }
            }
          : { 
              phone: identifier, 
              password, 
              options: {
                data: {
                  full_name: fullName,
                  is_onboarded: false,
                  verification_status: 'unverified',
                  pref_location: searchParams.get('pref_location') || 'Local',
                  trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }
              }
            }
      );

      if (authError) throw authError;

      if (data.user) {
        setIsSuccess(true);
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
            {locale === 'am' ? 'እንኳን ደስ አለዎት!' : 'Registration Successful!'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {locale === 'am' ? 'ወደ ዳሽቦርድ በመውሰድ ላይ...' : 'Redirecting you to your dashboard...'}
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-bold animate-pulse">
             <Loader2 className="animate-spin" size={18} />
             <span>{locale === 'am' ? 'እባክዎ ይጠብቁ...' : 'Please wait...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
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

        {/* Signup Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-10 border border-border relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-accent italic">
                {view === 'initial' ? t('signUp') : view === 'email' ? getEmailSignupLabel(locale) : getPhoneSignupLabel(locale)}
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
                <div className="grid grid-cols-1 gap-4">
                  {/* Phone Button */}
                  <button
                    onClick={() => setView('phone')}
                    className="w-full flex flex-row items-center justify-between px-8 py-5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/10 hover:shadow-xl hover:bg-primary/95 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <Phone size={20} />
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {getPhoneSignupLabel(locale)}
                      </span>
                    </div>
                    <ChevronRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Email Button */}
                  <button
                    onClick={() => setView('email')}
                    className="w-full flex flex-row items-center justify-between px-8 py-5 bg-accent text-white rounded-2xl shadow-lg shadow-accent/10 hover:shadow-xl hover:bg-accent/95 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <Mail size={20} />
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {getEmailSignupLabel(locale)}
                      </span>
                    </div>
                    <ChevronRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {locale === 'am' ? 'ወይም በነዚህ ይቀጥሉ' : 'Or continue with'}
                  </span>
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
                </div>

                {/* Social Login Buttons */}
                <div className="flex justify-center gap-3">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-border hover:border-primary/30 rounded-2xl hover:bg-primary/5 transition-all text-accent group"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="font-bold text-[10px] uppercase tracking-wider text-gray-500">Google</span>
                  </button>

                  {/* Facebook Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Facebook')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-border hover:border-primary/30 rounded-2xl hover:bg-primary/5 transition-all text-accent group"
                  >
                    <svg className="w-5 h-5 text-[#1877F2] transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="font-bold text-[10px] uppercase tracking-wider text-gray-500">Facebook</span>
                  </button>

                  {/* Apple Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Apple ID')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-border hover:border-primary/30 rounded-2xl hover:bg-primary/5 transition-all text-accent group"
                  >
                    <svg className="w-5 h-5 text-black transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.97.08 2.13-.52 2.82-1.33z" />
                    </svg>
                    <span className="font-bold text-[10px] uppercase tracking-wider text-gray-500">Apple</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                    {locale === 'am' ? 'ሙሉ ስም' : 'Full Name'}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#F8F4F1] border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-accent"
                      placeholder={locale === 'am' ? 'ለምሳሌ፡ አበበ በልቻ' : 'e.g. Abebe Balcha'}
                    />
                  </div>
                </div>

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
                ) : (
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('password')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
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
                  {isPasswordFocused && !password && (
                    <div className="p-3.5 bg-blue-50/50 border border-blue-100/70 rounded-2xl mt-2 text-xs text-gray-600 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="font-bold text-accent">
                        {locale === 'am' ? 'የይለፍ ቃል ምክር' : 'Password Recommendation'}
                      </p>
                      <p className="leading-relaxed text-[11px]">
                        {locale === 'am' 
                          ? 'ለደህንነትዎ ሲባል የሚያስገቡት የይለፍ ቃል ርዝመቱ 8 ወይም ከዚያ በላይ ሆኖ፣ ትልልቅና ትንንሽ ፊደላትን፣ ቁጥሮችን እና ልዩ ምልክቶችን (እንደ @፣ #፣ $) ያካተተ እንዲሁም በቀላሉ የሚያስታውሱት ቢሆን ይመከራል።'
                          : 'For your security, it is recommended that your password is at least 8 characters long, includes uppercase & lowercase letters, numbers, and special characters (like @, #, $), and is easy to remember.'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold italic">
                        {locale === 'am' ? 'ምሳሌ፡ P@ssword123' : 'Example: P@ssword123'}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !agreedToTerms}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {locale === 'am' ? 'ቀጥል' : 'Continue'} <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Agreement - Always visible at bottom */}
            <div className="mt-8 flex items-start gap-3 px-2 group cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  id="agreedToTerms"
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
              <label htmlFor="agreedToTerms" className="text-xs text-gray-500 font-medium cursor-pointer leading-tight select-none">
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

            <div className="mt-8 text-center pt-6 border-t border-border">
              <p className="text-gray-400 text-xs font-medium">
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
