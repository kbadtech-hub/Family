'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Heart, Mail, Phone, Lock, ChevronRight, AlertCircle, Loader2, Globe, Eye, EyeOff } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';

function LoginContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = new URLSearchParams(window.location.search).get('error');
    if (errorParam === 'unconfirmed') {
      // Direct access allowed, no more OTP redirect
    }
  }, [locale, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginParams = authMode === 'email' 
        ? { email, password } 
        : { phone: `${countryCode}${phone}`, password };

      const { data, error: authError } = await supabase.auth.signInWithPassword(loginParams);

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Check if user is onboarded
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', data.user.id)
          .single();

        if (profile?.is_onboarded) {
          // Check verification
          const { data: verification } = await supabase
            .from('verifications')
            .select('status')
            .eq('user_id', data.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (verification?.status === 'verified') {
            router.push('/dashboard');
          } else {
            router.push('/onboarding?step=6');
          }
        } else {
          router.push('/onboarding');
        }
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
             {locale === 'am' ? 'የኢትዮጵያውያን የትዳር መድረክ' : 'Global Habesha Matching'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-10 border border-border relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl font-bold text-accent mb-8 italic">{t('signIn')}</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Auth Mode Toggle */}
            <div className="flex gap-2 p-1.5 bg-[#F8F4F1] rounded-2xl mb-8">
              <button
                onClick={() => setAuthMode('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-accent'}`}
              >
                <Mail size={14} /> {t('email')}
              </button>
              <button
                onClick={() => setAuthMode('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-accent'}`}
              >
                <Phone size={14} /> {t('phoneTab')}
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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
                className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 mt-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('signIn')} <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-400 text-sm font-medium">
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

        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">
          {locale === 'am' ? 'ቤተሰብ' : 'Beteseb'} Traditions
        </p>
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
