'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithGoogle, signInWithFacebook } from '@/lib/firebase-auth';
import GeoGuard from '@/components/GeoGuard';
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
import ethiopianDate from 'ethiopian-date';
import EulaGate from '@/components/EulaGate';

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
  const t_onboard = useTranslations('Onboarding');
  const t_const = useTranslations('Constants');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View state: 'initial' | 'email' | 'phone' | 'phone-verification-gate'
  const [view, setView] = useState<'initial' | 'email' | 'phone' | 'phone-verification-gate'>('initial');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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

  // Initialize invisible reCAPTCHA when phone view or gate is entered
  useEffect(() => {
    if ((view === 'phone' || view === 'phone-verification-gate') && typeof window !== 'undefined') {
      const initRecaptcha = async () => {
        const { setupRecaptcha } = await import('@/lib/firebase-auth');
        const verifier = setupRecaptcha('recaptcha-container');
        if (verifier) setRecaptchaVerifier(verifier);
      };
      initRecaptcha();
    }
  }, [view]);

  // Location Access State (required for registration)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [locationCoords, setLocationCoords] = useState<{lat: number; lng: number} | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // EULA & Age Checkboxes (v3.5 compliance)
  const [confirmAge, setConfirmAge] = useState(false);
  const [agreedToEula, setAgreedToEula] = useState(false);
  const [agreedToTermsPrivacy, setAgreedToTermsPrivacy] = useState(false);
  const [eulaRead, setEulaRead] = useState(false);
  const [termsPrivacyRead, setTermsPrivacyRead] = useState(false);
  const [readingTab, setReadingTab] = useState<'eula' | 'terms' | null>(null);
  const [showReadError, setShowReadError] = useState('');

  // Birth Date and Calendar Selection States
  const [calendarType, setCalendarType] = useState<'gregorian' | 'ethiopian'>((locale === 'am' || locale === 'om' || locale === 'ti' || locale === 'so') ? 'ethiopian' : 'gregorian');
  const [birthDate, setBirthDate] = useState('');
  const [ethBirthDay, setEthBirthDay] = useState('');
  const [ethBirthMonth, setEthBirthMonth] = useState('');
  const [ethBirthYear, setEthBirthYear] = useState('');

  // Handle Ethiopian Date Conversion
  React.useEffect(() => {
    if (calendarType === 'ethiopian') {
      if (ethBirthDay && ethBirthMonth && ethBirthYear) {
        try {
          const [gy, gm, gd] = ethiopianDate.toGregorian(
            parseInt(ethBirthYear),
            parseInt(ethBirthMonth),
            parseInt(ethBirthDay)
          );
          setBirthDate(`${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`);
        } catch (e) {
          console.error("Invalid Ethiopian date", e);
        }
      }
    }
  }, [ethBirthDay, ethBirthMonth, ethBirthYear, calendarType]);

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    if (provider === 'apple') {
      setToast({
        message: locale === 'am'
          ? 'Apple ID መግባት በቅርቡ ይመጣል። እባክዎ ለጊዜው በኢሜይል ወይም በስልክ ቁጥር ይጠቀሙ።'
          : 'Apple ID login is coming soon. Please use Email or Phone for now.',
        show: true
      });
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = provider === 'google'
        ? await signInWithGoogle()
        : await signInWithFacebook();

      if (!result.success || !result.firebaseUser) {
        setError(result.error || 'Sign-in failed. Please try again.');
        return;
      }

      // Security gate: all users must verify phone before accessing the app
      if (!result.hasPhone) {
        setVerificationUser(result.firebaseUser);
        setView('phone-verification-gate');
        return;
      }

      router.push(result.isNewUser ? '/onboarding' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pending Action state to defer OAuth or direct signup until EULA is accepted
  const [pendingAction, setPendingAction] = useState<{
    type: 'social' | 'direct';
    provider?: 'google' | 'facebook' | 'apple';
    view?: 'phone' | 'email';
  } | null>(null);
  const [showEulaModal, setShowEulaModal] = useState(false);

  const selectSignupMethod = (method: 'google' | 'facebook' | 'apple' | 'phone' | 'email') => {
    console.log("selectSignupMethod called with:", method);
    localStorage.setItem('beteseb_eula_accepted', 'true');
    // Request location first if not yet granted
    if (locationStatus !== 'granted') {
      requestLocation();
    }
    if (method === 'phone' || method === 'email') {
      setView(method);
    } else {
      handleSocialLogin(method);
    }
  };

  const handleEulaAccept = () => {
    console.log("handleEulaAccept triggered. Pending action:", pendingAction);
    localStorage.setItem('beteseb_eula_accepted', 'true');
    setShowEulaModal(false);
    if (pendingAction) {
      if (pendingAction.type === 'direct' && pendingAction.view) {
        console.log("Executing pending direct signup view:", pendingAction.view);
        setView(pendingAction.view);
      } else if (pendingAction.type === 'social' && pendingAction.provider) {
        console.log("Executing pending social login provider:", pendingAction.provider);
        handleSocialLogin(pendingAction.provider);
      }
      setPendingAction(null);
    }
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
    setIsLoading(true);
    setError('');

    if (!birthDate) {
      setError(locale === 'am' ? 'እባክዎ የልደት ቀንዎን ያስገቡ' : 'Please select your birth date');
      setIsLoading(false);
      return;
    }

    // Calculate Age
    const bDate = new Date(birthDate);
    const today = new Date();
    let calculatedAge = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) calculatedAge--;
    if (calculatedAge < 18) {
      setError(locale === 'am'
        ? 'ይህን መተግበሪያ ለመጠቀም እድሜዎ 18 ወይም ከዚያ በላይ መሆን አለበት።'
        : 'You must be at least 18 years old to use this platform.');
      setIsLoading(false);
      return;
    }

    try {
      if (view === 'email') {
        // ── Email Signup via Firebase ─────────────────────────────────────
        const { isValid, errorKey } = validatePassword(password);
        if (!isValid) { setError(t(`errors.${errorKey}`)); setIsLoading(false); return; }

        const { signUpWithEmail } = await import('@/lib/firebase-auth');
        const result = await signUpWithEmail(email, password);

        if (!result.success || !result.firebaseUser) {
          setError(result.error || 'Signup failed. Please try again.');
          return;
        }

        // Store birth_date in Supabase profiles (server already created the profile)
        const { supabase } = await import('@/lib/supabase');
        await supabase.from('profiles').update({
          full_name: fullName,
          birth_date: birthDate,
          pref_location: searchParams.get('pref_location') || 'Local',
          registration_location: locationCoords ?? null,
        }).eq('id', result.firebaseUser.uid);

        // Email users must verify phone number
        if (!result.hasPhone) {
          setVerificationUser(result.firebaseUser);
          setView('phone-verification-gate');
          return;
        }

        router.push('/onboarding');

      } else if (view === 'phone') {
        // ── Phone Signup via Firebase OTP ─────────────────────────────────
        const { sendPhoneOtp, confirmPhoneOtp } = await import('@/lib/firebase-auth');

        if (!isOtpSent) {
          if (!recaptchaVerifier) {
            throw new Error('reCAPTCHA is loading. Please try again in a moment.');
          }
          const fullPhoneNumber = `${countryCode}${phone}`;
          const res = await sendPhoneOtp(fullPhoneNumber, recaptchaVerifier);

          if (!res.success || !res.confirmationResult) {
            setError(res.error || 'Failed to send OTP. Please check the number.');
            return;
          }

          setConfirmationResult(res.confirmationResult);
          setIsOtpSent(true);
        } else {
          if (!confirmationResult) throw new Error('OTP session expired. Please try again.');
          const result = await confirmPhoneOtp(confirmationResult, otpCode);

          if (!result.success || !result.firebaseUser) {
            setError(result.error || 'Invalid OTP code.');
            return;
          }

          // Store extra profile data in Supabase after phone verification
          const { supabase } = await import('@/lib/supabase');
          await supabase.from('profiles').update({
            full_name: fullName,
            birth_date: birthDate,
            pref_location: searchParams.get('pref_location') || 'Local',
            registration_location: locationCoords ?? null,
          }).eq('id', result.firebaseUser.uid);

          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyGatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { sendPhoneOtp, linkPhoneWithCurrentUser } = await import('@/lib/firebase-auth');

      if (!isGateOtpSent) {
        if (!recaptchaVerifier) throw new Error('reCAPTCHA is loading. Please try again.');
        const fullPhoneNumber = `${gateCountryCode}${gatePhone}`;
        const res = await sendPhoneOtp(fullPhoneNumber, recaptchaVerifier);

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

        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error occurred.');
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

        {/* Signup Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-8 md:p-10 border border-border relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-accent italic">
                {view === 'initial' ? t('signUp') 
                  : view === 'phone-verification-gate' ? (locale === 'am' ? 'ስልክ ማረጋገጫ' : 'Verify Phone')
                  : view === 'email' ? getEmailSignupLabel(locale) 
                  : getPhoneSignupLabel(locale)}
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
            {/* Location Status Banner */}
            {locationStatus === 'requesting' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-700 text-xs animate-in fade-in slide-in-from-top-2">
                <Loader2 size={16} className="animate-spin flex-shrink-0" />
                <span className="font-bold">{locale === 'am' ? '📍 ቦታዎን በማወቅ ላይ...' : '📍 Detecting your location...'}</span>
              </div>
            )}
            {locationStatus === 'granted' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 text-xs animate-in fade-in">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span className="font-bold">{locale === 'am' ? '✅ ቦታ ተረጋግጧል' : '✅ Location verified'}</span>
              </div>
            )}
            {locationStatus === 'denied' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-800 text-xs animate-in fade-in">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold">{locale === 'am' ? 'ቦታ ፍቃድ አልተሰጠም' : 'Location permission denied'}</p>
                  <p className="text-amber-600 mt-0.5">{locale === 'am' ? 'የቦታ ሎኬሽን ሳይረጋገጥ ምዝገባ ሊቆም ይችላል።' : 'Registration may be limited without location access.'}</p>
                  <button onClick={requestLocation} className="mt-1 text-primary font-bold underline">{locale === 'am' ? 'ደግሞ ሞክር' : 'Try again'}</button>
                </div>
              </div>
            )}

            {view === 'initial' ? (
              <div className="space-y-6">
                <div className={`flex flex-col gap-3 transition-all duration-300 ${(!confirmAge || !agreedToEula || !agreedToTermsPrivacy) ? 'opacity-40 blur-[1.5px] pointer-events-none' : ''}`}>

                  {/* Phone */}
                  <button
                    type="button"
                    onClick={() => selectSignupMethod('phone')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-gray-400 group-hover:text-primary transition-colors">
                      <Phone size={18} />
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {getPhoneSignupLabel(locale)}
                    </span>
                  </button>

                  {/* Email */}
                  <button
                    type="button"
                    onClick={() => selectSignupMethod('email')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-gray-400 group-hover:text-primary transition-colors">
                      <Mail size={18} />
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {getEmailSignupLabel(locale)}
                    </span>
                  </button>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => selectSignupMethod('google')}
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
                      {locale === 'am' ? 'በGoogle ይቀጥሉ' : 'Continue with Google'}
                    </span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => selectSignupMethod('facebook')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-[#1877F2]">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {locale === 'am' ? 'በFacebook ይቀጥሉ' : 'Continue with Facebook'}
                    </span>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => selectSignupMethod('apple')}
                    className="w-full relative flex items-center justify-center py-[14px] border-2 border-border hover:border-primary/40 rounded-2xl hover:bg-[#F8F4F1]/60 transition-all group"
                  >
                    <div className="absolute left-5 text-gray-800">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.97.08 2.13-.52 2.82-1.33z" />
                      </svg>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">
                      {locale === 'am' ? 'በApple ይቀጥሉ' : 'Continue with Apple'}
                    </span>
                  </button>

                </div>

                {/* EULA Agreement Checkboxes directly on signup selector page */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  {/* Age Checkbox */}
                  <div 
                    onClick={() => setConfirmAge(!confirmAge)} 
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${confirmAge ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'}`}
                  >
                    <input
                      type="checkbox"
                      checked={confirmAge}
                      onChange={(e) => setConfirmAge(e.target.checked)}
                      className="h-5 w-5 rounded accent-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-gray-600 font-bold select-none leading-relaxed">
                      {locale === 'am' ? 'እድሜዬ 18 ወይም ከዚያ በላይ መሆኑን አረጋግጣለሁ።' : 'I confirm that I am 18 years of age or older.'}
                    </span>
                  </div>

                  {/* EULA Checkbox */}
                  <div 
                    onClick={() => {
                      if (eulaRead) {
                        setAgreedToEula(!agreedToEula);
                        setShowReadError('');
                      } else {
                        setShowReadError(locale === 'am' ? 'እባክዎ መጀመሪያ የEULA ስምምነቱን ይክፈቱና ያንብቡት!' : 'Please open and read the EULA agreement first!');
                      }
                    }} 
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${agreedToEula ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'}`}
                  >
                    <input
                      type="checkbox"
                      checked={agreedToEula}
                      disabled={!eulaRead}
                      onChange={(e) => setAgreedToEula(e.target.checked)}
                      className="h-5 w-5 rounded accent-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-gray-600 font-bold select-none leading-relaxed">
                      {locale === 'am' ? 'በዜሮ-ታገስ ፖሊሲው እና ' : 'I agree to the Zero-Tolerance Policy and '}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadingTab('eula');
                        }} 
                        className="text-primary underline font-bold"
                      >
                        {locale === 'am' ? 'በEULA ስምምነቱ' : 'EULA agreement'}
                      </button>
                      {locale === 'am' ? ' ላይ ሙሉ ለሙሉ እስማማለሁ።' : '.'}
                    </span>
                  </div>

                  {/* Terms & Privacy Checkbox */}
                  <div 
                    onClick={() => {
                      if (termsPrivacyRead) {
                        setAgreedToTermsPrivacy(!agreedToTermsPrivacy);
                        setShowReadError('');
                      } else {
                        setShowReadError(locale === 'am' ? 'እባክዎ መጀመሪያ የአጠቃቀም መመሪያውን ይክፈቱና ያንብቡት!' : 'Please open and read the Terms of Service first!');
                      }
                    }} 
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${agreedToTermsPrivacy ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'}`}
                  >
                    <input
                      type="checkbox"
                      checked={agreedToTermsPrivacy}
                      disabled={!termsPrivacyRead}
                      onChange={(e) => setAgreedToTermsPrivacy(e.target.checked)}
                      className="h-5 w-5 rounded accent-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-gray-600 font-bold select-none leading-relaxed">
                      {locale === 'am' ? 'የአጠቃቀም መመሪያዎችንና የደህንነት ፖሊሲውን' : 'Terms of Service & Privacy Policy'}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadingTab('terms');
                        }} 
                        className="text-primary underline font-bold px-1"
                      >
                        {locale === 'am' ? 'ስምምነቶች' : 'agreements'}
                      </button>
                      {locale === 'am' ? 'ተስማምቻለሁ።' : 'agreed.'}
                    </span>
                  </div>

                  {showReadError && (
                    <p className="text-[10px] text-red-500 font-bold text-center mt-2 animate-bounce">
                      ⚠️ {showReadError}
                    </p>
                  )}
                </div>
              </div>
            ) : view === 'phone-verification-gate' ? (
              /* ── Phone Verification Gate (for Social/Email users without phone) ── */
              <form onSubmit={handleVerifyGatePhone} className="space-y-5">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                  <span className="text-2xl block mb-2">🔐</span>
                  <p className="text-amber-800 text-xs font-bold">
                    {locale === 'am'
                      ? 'ደህንነትዎን ለማረጋገጥ ስልክ ቁጥርዎን ያስገቡ'
                      : 'Please verify your phone number to complete registration'}
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
                    <>{locale === 'am' ? 'አረጋግጥና ጨርስ' : 'Verify & Complete'} <ChevronRight size={18} /></>
                  ) : (
                    <>{locale === 'am' ? 'ኮድ ላክ' : 'Send Verification Code'} <ChevronRight size={18} /></>
                  )}
                </button>
              </form>
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

                 {/* Birth Date / Age Gating */}
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                     {locale === 'am' ? 'የትውልድ ቀን (እድሜ ለመወሰን)' : 'Birth Date (For Age Verification)'}
                   </label>
                   
                   <div className="flex gap-2 p-1 bg-[#F8F4F1] rounded-2xl w-fit mb-3">
                     <button 
                       type="button" 
                       onClick={() => setCalendarType('gregorian')} 
                       className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${calendarType === 'gregorian' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                     >
                       {locale === 'am' ? 'እ.ኤ.አ (European)' : 'Gregorian'}
                     </button>
                     <button 
                       type="button" 
                       onClick={() => setCalendarType('ethiopian')} 
                       className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${calendarType === 'ethiopian' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                     >
                       {locale === 'am' ? 'ኢትዮጵያ (Ethiopian)' : 'Ethiopian'}
                     </button>
                   </div>

                   {calendarType === 'ethiopian' ? (
                     <div className="grid grid-cols-3 gap-2">
                        <select 
                          value={ethBirthDay} 
                          aria-label="Day" 
                          onChange={(e) => setEthBirthDay(e.target.value)} 
                          className="p-3 bg-[#F8F4F1] rounded-xl font-bold text-xs text-accent outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">{locale === 'am' ? 'ቀን' : 'Day'}</option>
                          {Array.from({ length: ethBirthMonth === '13' ? 6 : 30 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <select 
                          value={ethBirthMonth} 
                          aria-label="Month" 
                          onChange={(e) => setEthBirthMonth(e.target.value)} 
                          className="p-3 bg-[#F8F4F1] rounded-xl font-bold text-xs text-accent outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">{locale === 'am' ? 'ወር' : 'Month'}</option>
                          {['Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'].map((m, i) => (
                            <option key={m} value={i + 1}>
                              {locale === 'am' ? ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'][i] : m}
                            </option>
                          ))}
                        </select>
                        <select 
                          value={ethBirthYear} 
                          aria-label="Year" 
                          onChange={(e) => setEthBirthYear(e.target.value)} 
                          className="p-3 bg-[#F8F4F1] rounded-xl font-bold text-xs text-accent outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">{locale === 'am' ? 'ዓ.ም' : 'Year'}</option>
                          {Array.from({ length: 70 }, (_, i) => 2018 - 18 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                     </div>
                   ) : (
                     <input 
                       type="date" 
                       value={birthDate} 
                       onChange={(e) => setBirthDate(e.target.value)} 
                       className="w-full rounded-xl border-transparent p-4 bg-[#F8F4F1] text-sm text-accent font-medium outline-none focus:border-primary focus:bg-white transition-all" 
                     />
                   )}
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
                ) : isOtpSent ? (
                  /* OTP Code Entry for Phone Signup */
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

                {/* Password field — only shown for email signup. Phone uses OTP instead. */}
                {view === 'email' && (
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
                            : 'For your security, use at least 8 characters with uppercase & lowercase letters, numbers, and special characters (@, #, $).'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (isOtpSent && otpCode.length < 6)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : view === 'phone' && !isOtpSent ? (
                    <>{locale === 'am' ? 'ኮድ ላክ' : 'Send OTP Code'} <ChevronRight size={18} /></>
                  ) : view === 'phone' && isOtpSent ? (
                    <>{locale === 'am' ? 'አረጋግጥና ተመዝገብ' : 'Verify & Register'} <ChevronRight size={18} /></>
                  ) : (
                    <>{locale === 'am' ? 'ቀጥል' : 'Continue'} <ChevronRight size={18} /></>
                  )}
                </button>
              </form>
            )}



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

            {readingTab && (
              <div className="fixed inset-0 z-[10000] bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] p-6 max-w-lg w-full shadow-2xl relative border border-border">
                  <h3 className="text-xl font-bold text-accent italic mb-4">
                    {readingTab === 'eula' 
                      ? (locale === 'am' ? 'የደህንነት ደንብ እና EULA ስምምነት' : 'EULA & Zero-Tolerance Policy')
                      : (locale === 'am' ? 'የአጠቃቀም መመሪያ እና የደህንነት ፖሊሲ' : 'Terms of Service & Privacy Policy')}
                  </h3>
                  <div 
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 15;
                      if (isAtBottom) {
                        if (readingTab === 'eula') setEulaRead(true);
                        if (readingTab === 'terms') setTermsPrivacyRead(true);
                      }
                    }}
                    className="max-h-[250px] overflow-y-auto p-4 bg-muted/30 rounded-2xl text-[11px] text-gray-600 font-semibold leading-relaxed whitespace-pre-line border border-muted"
                  >
                    {readingTab === 'eula' ? (
                      locale === 'am' 
                        ? "• ዜሮ-ታገስ ፖሊሲ (Zero-Tolerance)፦ ቤተሰብ ማናቸውንም የስድብ፣ የጥላቻ ንግግር፣ የሀሰት መለያ፣ ማጭበርበር ወይም የወሲብ ይዘት ያላቸውን ነገሮች በፍጹም አይታገስም። ደንቡን የጣሰ አካውንት ያለምንም ማስጠንቀቂያ ወዲያውኑ ይዘጋል (Permanent Ban)።\n\n• ስክሪንሾት እና ቀረጻ ክልከላ (Screenshot & Recording Ban)፦ የአባላትን ደህንነት እና ምስጢራዊነት ለመጠበቅ የሌሎችን ፕሮፋይል ስክሪንሾት ማድረግ፣ ፎቶዎችን ሴቭ ማድረግ ወይም የስልክ/የቪዲዮ ጥሪዎችን መቅረጽ በቤተሰብ መድረክ ላይ በፍጹም የተከለከለ ነው። ይህንን ደንብ መጣስ በቀጥታ ከሲስተሙ ያለምንም ቅድመ-ማስጠንቀቂያ ያባርራል።"
                        : "• Zero Tolerance: Beteseb operates under a strict zero-tolerance policy for abuse, pornography, hate speech, and harassment. Any violations will result in immediate account termination.\n\n• Screenshot & Screen Recording Ban: To protect member privacy, attempting to screenshot profiles, save private photos, or record audio/video calls is strictly prohibited. Violating this rule will lead to an instant and permanent ban from the platform."
                    ) : (
                      locale === 'am'
                        ? "• የደህንነት ፖሊሲ፦ የእርስዎ የግል መረጃዎች፣ የጫኗቸው መታወቂያዎች፣ ፎቶዎች፣ መገኛ ቦታዎ እና ቻቶችዎ በከፍተኛ ምስጠራ (encryption) የተጠበቁ ናቸው። መረጃዎትን ለሶስተኛ ወገን በፍጹም አናጋራም፣ አንሸጥም ወይም አናሳይም።\n\n• የመረጃ ምስጠራ፦ ቻቶች እና ጥሪዎች በምስጠራ የሚተላለፉ በመሆናቸው ማንም ጣልቃ መግባት አይችልም።\n\n• የፕሮፋይል ቁጥጥር፦ በማንኛውም ጊዜ አካውንትዎን እና መረጃዎችዎን ሙሉ በሙሉ የመሰረዝ መብት አልዎት።"
                        : "• Privacy Policy & Zero Third-Party Sharing: Your personal data, document uploads (ID and selfie), locations, and chats are encrypted and securely stored. We never share, sell, or expose your data to any third parties.\n\n• Data Encryption: Chats and video calls are transmitted securely to prevent interception."
                    )}
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider animate-pulse">
                      {((readingTab === 'eula' && eulaRead) || (readingTab === 'terms' && termsPrivacyRead)) 
                        ? (locale === 'am' ? 'የተነበበ - አሁን መስማማት ይችላሉ ✅' : 'Read - You can now check the box ✅') 
                        : (locale === 'am' ? 'ለማረጋገጥ ወደ ታች ይሂዱ ⬇️' : 'Scroll to bottom to read ⬇️')}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setReadingTab(null)} 
                      className="bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all"
                    >
                      {locale === 'am' ? 'ዝጋ' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <GeoGuard>
        <SignupContent />
      </GeoGuard>
    </Suspense>
  );
}
