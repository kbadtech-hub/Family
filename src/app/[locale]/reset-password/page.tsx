'use client';

import React, { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Lock, ChevronRight, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '@/lib/password-validator';

function ResetPasswordContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
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

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password update failed. Please try again.');
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
            {locale === 'am' ? 'ተቀይሯል!' : locale === 'ti' ? 'ተቐይሩ!' : 'Success!'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {locale === 'am' ? 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል። አሁን መግባት ይችላሉ።' : locale === 'ti' ? 'መሕለፊ ቃልኩም ብዝተዓወተ መንገዲ ተቐይሩ አሎ። ሕጂ ክትአትዉ ትኽእሉ ኢኹም።' : 'Your password has been updated successfully. You can now login.'}
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-bold animate-pulse">
             <Loader2 className="animate-spin" size={18} />
             <span>{locale === 'am' ? 'ወደ መግቢያ ገጽ በመውሰድ ላይ...' : locale === 'ti' ? 'ናብ መእተዊ ገጽ ይወስደኩም አሎ...' : 'Redirecting to login...'}</span>
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
            <h2 className="text-2xl font-bold text-accent mb-2 italic">{locale === 'am' ? 'አዲስ የይለፍ ቃል' : locale === 'ti' ? 'ሓድሽ መሕለፊ ቃል' : 'New Password'}</h2>
            <p className="text-gray-400 text-sm mb-8 font-medium">
               {locale === 'am' ? 'እባክዎን ጠንካራ አዲስ የይለፍ ቃል ያስገቡ' : locale === 'ti' ? 'በጃኹም ዝሓየለ ሓድሽ መሕለፊ ቃል አእትዉ' : 'Please enter a strong new password.'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all rounded-xl">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{locale === 'am' ? 'የይለፍ ቃል ማረጋገጫ' : locale === 'ti' ? 'መሕለፊ ቃል ምርግጋጽ' : 'Confirm Password'}</label>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{locale === 'am' ? 'ቀይር' : locale === 'ti' ? 'ቀይር' : 'Update Password'} <ChevronRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
