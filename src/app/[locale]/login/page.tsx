'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
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

function LoginContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  
  // View state: 'initial' | 'email' | 'phone'
  const [view, setView] = useState<'initial' | 'email' | 'phone'>('initial');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginParams = view === 'email' 
        ? { email, password } 
        : { phone: `${countryCode}${phone}`, password };

      const { data, error: authError } = await supabase.auth.signInWithPassword(loginParams);

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Direct redirect to dashboard
        window.location.href = `/${locale}/dashboard`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
             {locale === 'am' ? 'የኢትዮጵያውያን የትዳር መድረክ' : 'Global Habesha Matching'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-10 border border-border relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-accent italic">
                {view === 'initial' ? t('signIn') : view === 'email' ? (locale === 'am' ? 'በኢሜይል ይግቡ' : 'Sign in with Email') : (locale === 'am' ? 'በስልክ ይግቡ' : 'Sign in with Phone')}
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

            {view === 'initial' ? (
              <div className="space-y-4">
                {/* Google Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <Image src="/google.svg" alt="Google" width={20} height={20} />
                  <span className="font-bold text-sm text-accent">
                    {locale === 'am' ? 'በጎግል ይግቡ' : 'Sign in with Google'}
                  </span>
                </button>

                {/* Phone Button */}
                <button
                  onClick={() => setView('phone')}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-[#F8F4F1] rounded-2xl hover:bg-primary hover:text-white transition-all group"
                >
                  <Phone size={20} className="text-primary group-hover:text-white transition-colors" />
                  <span className="font-bold text-sm text-accent group-hover:text-white transition-colors">
                    {locale === 'am' ? 'በስልክ ቁጥር ይግቡ' : 'Sign in with Phone'}
                  </span>
                </button>

                {/* Email Button */}
                <button
                  onClick={() => setView('email')}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-[#F8F4F1] rounded-2xl hover:bg-primary hover:text-white transition-all group"
                >
                  <Mail size={20} className="text-primary group-hover:text-white transition-colors" />
                  <span className="font-bold text-sm text-accent group-hover:text-white transition-colors">
                    {locale === 'am' ? 'በኢሜይል ይግቡ' : 'Sign in with Email'}
                  </span>
                </button>
              </div>
            ) : (
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {t('signIn')} <ChevronRight size={18} />
                    </>
                  )}
                </button>
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
      <LoginContent />
    </Suspense>
  );
}
