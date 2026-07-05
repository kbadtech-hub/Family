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
  ArrowLeft,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ScrollText,
  UserCheck,
  EyeOff as EyeOffIcon
} from 'lucide-react';
import { validatePassword } from '@/lib/password-validator';
import { COUNTRIES } from '@/lib/countries';
import ethiopianDate from 'ethiopian-date';

const getSlogan = (lang: string) => {
  switch (lang) {
    case 'am': return 'የኢትዮጵያውያን የትዳር መድረክ';
    case 'om': return 'Platformii Gaa\'ela Habashaa';
    case 'ti': return 'ናይ መጻምድቲ መድረኽ ኢትዮጵያውያን';
    case 'ar': return 'منصة الزواج الأثيوبية العالمية';
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

const getAgreementTexts = (lang: string) => {
  switch (lang) {
    case 'am':
      return {
        agreementHeader: 'ወደ ቤተሰብ ከመቀጠልዎ በፊት',
        agreementSub: 'ለደህንነትዎ ሲባል እባክዎ ሶስቱንም ስምምነቶች አንብበው ይስማሙ። ካልተቀበሉ ምዝገባ አይቻልም።',
        confirmAge: 'እድሜዬ 18 ወይም ከዚያ በላይ መሆኑን አረጋግጣለሁ።',
        confirmEula: 'በዜሮ-ታገስ ፖሊሲው እና በEULA ስምምነቱ ሙሉ ለሙሉ እስማማለሁ።',
        confirmTerms: 'የአጠቃቀም መመሪያዎችን (Terms of Service) እና የKYC ግዴታን ተስማምቻለሁ።',
        confirmPrivacy: 'የደህንነት ፖሊሲውን (Privacy Policy) እና መረጃዎችን ለሶስተኛ ወገን ያለማጋራት ደንቡን ተስማምቻለሁ።',
        readFirst: 'እባክዎ መጀመሪያ ስምምነቱን ወደ ታች ስክሮል በማድረግ እስከ መጨረሻው ያንብቡት!',
        scrollDown: 'ለማንበብ ወደ ታች ይሂዱ ⬇️',
        readyToAgree: 'ተነብቧል - አሁን መስማማት ይቻላል ✅',
        eulaTitle: '1. EULA እና የዜሮ-ታገስ ፖሊሲ',
        eulaContent: "• ዜሮ-ታገስ ፖሊሲ (Zero-Tolerance)፦ ቤተሰብ ማናቸውንም የስድብ፣ የጥላቻ ንግግር፣ የሀሰት መለያ፣ ማጭበርበር ወይም የወሲብ ይዘት ያላቸውን ነገሮች በፍጹም አይታገስም። ደንቡን የጣሰ አካውንት ያለምንም ማስጠንቀቂያ ወዲያውኑ ይዘጋል (Permanent Ban)።\n\n• ስክሪንሾት እና ቀረጻ ክልከላ፦ የአባላትን ደህንነት እና ምስጢራዊነት ለመጠበቅ የሌሎችን ፕሮፋይል ስክሪንሾት ማድረግ፣ ፎቶዎችን ሴቭ ማድረግ ወይም የስልክ/የቪዲዮ ጥሪዎችን መቅረጽ በቤተሰብ መድረክ ላይ በፍጹም የተከለከለ ነው።\n\n• መከባበር፦ ሁሉም አባላት በታማኝነት እና በመከባበር መንቀሳቀስ አለባቸው።",
        termsTitle: '2. የአጠቃቀም መመሪያ እና KYC ማረጋገጫ',
        termsContent: "• የKYC ማንነት ማረጋገጫ፦ እውነተኛ እና አስተማማኝ ማህበረሰብ ለመፍጠር ሁሉም ተጠቃሚዎች የKYC ማንነት ማረጋገጥ አለባቸው። ትክክለኛ የመንግስት መታወቂያ እና የቀጥታ ፎቶ (selfie) ማቅረብ ይጠበቃል።\n\n• የጊፍት እና የኮይኖች አጠቃቀም፦ ማንነትዎ ቬሪፋይድ እስካልተደረገ ድረስ ሙሉ አገልግሎቶችን ማግኘት አይቻልም።\n\n• የእድሜ ግዴታ፦ ዕድሜዎ 18 ወይም ከዚያ በላይ መሆን አለበት። የሀሰት መረጃ ሲሰጥ አካውንቱ ይዘጋል።",
        privacyTitle: '3. የደህንነት ፖሊሲ እና ለሶስተኛ ወገን ያለማጋራት',
        privacyContent: "• ለሶስተኛ ወገን ያለማጋራት፦ የእርስዎ የግል መረጃዎች፣ ፎቶዎች፣ መገኛ ቦታዎ እና ቻቶችዎ በከፍተኛ ምስጠራ (encryption) የተጠበቁ ናቸው። መረጃዎትን ለሶስተኛ ወገን በፍጹም አናጋራም።\n\n• የፕሮፋይል ቁጥጥር፦ በማንኛውም ጊዜ አካውንትዎን እና መረጃዎትን ሙሉ በሙሉ የመሰረዝ መብት አልዎት።",
        signupTitle: 'አዲስ አካውንት ይክፈቱ',
        alreadyHave: 'አካውንት አለዎት?',
        signIn: 'ይግቡ',
        orChoose: 'ወይም ይምረጡ',
        blurHint: 'ሶስቱንም ስምምነቶች ካነበቡ እና ካጸደቁ በኋላ አዝራሮቹ ይነቃሉ',
      };
    default:
      return {
        agreementHeader: 'Before Joining Beteseb',
        agreementSub: 'For your safety and the safety of our community, please read and accept all three agreements. Registration is not possible without acceptance.',
        confirmAge: 'I confirm that I am 18 years of age or older.',
        confirmEula: 'I agree to the Zero-Tolerance Policy and the EULA Terms.',
        confirmTerms: 'I agree to the Terms of Service and KYC Requirements.',
        confirmPrivacy: 'I agree to the Privacy Policy and Zero Third-Party Sharing.',
        readFirst: 'Please scroll down and read the agreement to the bottom first!',
        scrollDown: 'Scroll down to read ⬇️',
        readyToAgree: 'Read — You may now agree ✅',
        eulaTitle: '1. EULA & Zero-Tolerance Abuse Policy',
        eulaContent: "• Zero Tolerance: Beteseb operates under a strict zero-tolerance policy for abuse, pornography, hate speech, and harassment. Any violations will result in immediate account termination.\n\n• Screenshot & Screen Recording Ban: To protect member privacy, attempting to screenshot profiles, save private photos, or record audio/video calls is strictly prohibited. Violating this rule will lead to an instant and permanent ban.\n\n• Safety and Respect: All members must interact with honesty and respect.",
        termsTitle: '2. Terms of Service & KYC Identity Verification',
        termsContent: "• KYC Verification: To ensure a genuine and safe community, all users must complete KYC identity verification. You will be required to upload a valid ID document and a live selfie.\n\n• Gifts & Matching Gate: You cannot match with other users, send messages, or send/receive virtual gifts until your identity is fully verified.\n\n• Age Requirement: You must be at least 18 years old to register. Providing false information is a violation of these terms.",
        privacyTitle: '3. Privacy Policy & Zero Third-Party Data Sharing',
        privacyContent: "• Zero Third-Party Sharing: Your personal data, document uploads, locations, and chats are encrypted and securely stored. We never share, sell, or expose your data to any third parties.\n\n• Profile Control: You retain full ownership and control over your profile data, with the right to delete your account and all associated data at any time.",
        signupTitle: 'Create Your Account',
        alreadyHave: 'Already have an account?',
        signIn: 'Sign In',
        orChoose: 'Choose a signup method',
        blurHint: 'Read and accept all agreements above to unlock registration',
      };
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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Birth Date and Calendar Selection States
  const [calendarType, setCalendarType] = useState<'gregorian' | 'ethiopian'>((locale === 'am' || locale === 'om' || locale === 'ti' || locale === 'so') ? 'ethiopian' : 'gregorian');
  const [birthDate, setBirthDate] = useState('');
  const [ethBirthDay, setEthBirthDay] = useState('');
  const [ethBirthMonth, setEthBirthMonth] = useState('');
  const [ethBirthYear, setEthBirthYear] = useState('');

  // ─── Inline Agreement State ───
  const [activeTab, setActiveTab] = useState<'eula' | 'terms' | 'privacy' | null>(null);
  const [eulaRead, setEulaRead] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [agreedToEula, setAgreedToEula] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showEulaError, setShowEulaError] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [showPrivacyError, setShowPrivacyError] = useState(false);
  const eulaRef = React.useRef<HTMLDivElement>(null);
  const termsRef = React.useRef<HTMLDivElement>(null);
  const privacyRef = React.useRef<HTMLDivElement>(null);

  const allAgreed = confirmAge && agreedToEula && agreedToTerms && agreedToPrivacy;

  const checkScrollable = (ref: React.RefObject<HTMLDivElement | null>, setRead: (read: boolean) => void) => {
    if (ref.current) {
      const el = ref.current;
      if (el.scrollHeight <= el.clientHeight + 5) setRead(true);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'eula') checkScrollable(eulaRef, setEulaRead);
    if (activeTab === 'terms') checkScrollable(termsRef, setTermsRead);
    if (activeTab === 'privacy') checkScrollable(privacyRef, setPrivacyRead);
  }, [activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, setRead: (read: boolean) => void) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) setRead(true);
  };

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
    if (!allAgreed) return;
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
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
      }
    });
    if (oauthError) setError(oauthError.message);
  };

  const selectSignupMethod = (method: 'google' | 'facebook' | 'apple' | 'phone' | 'email') => {
    if (!allAgreed) return;
    if (method === 'apple') { handleSocialLogin('apple'); return; }
    if (method === 'phone' || method === 'email') {
      setView(method);
    } else {
      handleSocialLogin(method as 'google' | 'facebook');
    }
  };

  React.useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => router.push('/dashboard'), 2000);
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

    const { isValid, errorKey } = validatePassword(password);
    if (!isValid) {
      setError(t(`errors.${errorKey}`));
      setIsLoading(false);
      return;
    }

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
                  birth_date: birthDate,
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
                  birth_date: birthDate,
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
        await supabase.from('profiles').update({ birth_date: birthDate }).eq('id', data.user.id);
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

  const texts = getAgreementTexts(locale);

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-4 md:p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center">
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

        {/* ── STEP 1: INLINE AGREEMENT GATE ── */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-border overflow-hidden">
          {/* Agreement Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-accent italic tracking-tight">{texts.agreementHeader}</h2>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Beteseb Trust & Safety</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">{texts.agreementSub}</p>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Age Confirmation */}
            <div
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setConfirmAge(!confirmAge)}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={confirmAge}
                  onChange={(e) => setConfirmAge(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 checked:bg-primary checked:border-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                />
                <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
              </div>
              <span className="text-xs text-slate-700 font-bold select-none leading-snug">{texts.confirmAge}</span>
            </div>

            {/* EULA Accordion */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'eula' ? null : 'eula')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ScrollText size={14} className="text-primary shrink-0" />
                  <span className="text-left">{texts.eulaTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {agreedToEula && <Check size={13} className="text-emerald-500 stroke-[3]" />}
                  {activeTab === 'eula' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>
              {activeTab === 'eula' && (
                <div className="px-4 pb-4 space-y-2.5">
                  <div
                    ref={eulaRef}
                    onScroll={(e) => handleScroll(e, setEulaRead)}
                    className="bg-white border border-slate-200 rounded-xl p-3 max-h-[130px] overflow-y-auto text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-line"
                  >
                    {texts.eulaContent}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider">
                    {eulaRead
                      ? <span className="text-emerald-600">{texts.readyToAgree}</span>
                      : <span className="text-amber-500 animate-pulse">{texts.scrollDown}</span>}
                  </div>
                  <div
                    onClick={() => {
                      if (eulaRead) { setAgreedToEula(!agreedToEula); setShowEulaError(false); }
                      else setShowEulaError(true);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${agreedToEula ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'} ${!eulaRead ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <input type="checkbox" checked={agreedToEula} disabled={!eulaRead}
                        onChange={(e) => setAgreedToEula(e.target.checked)}
                        className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 checked:bg-primary checked:border-primary disabled:border-slate-200"
                        onClick={(e) => e.stopPropagation()} />
                      <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
                    </div>
                    <span className="text-xs text-slate-600 font-bold select-none leading-snug">{texts.confirmEula}</span>
                  </div>
                  {showEulaError && <p className="text-[10px] text-red-500 font-bold pl-8 animate-bounce">{texts.readFirst}</p>}
                </div>
              )}
            </div>

            {/* Terms Accordion */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'terms' ? null : 'terms')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-primary shrink-0" />
                  <span className="text-left">{texts.termsTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {agreedToTerms && <Check size={13} className="text-emerald-500 stroke-[3]" />}
                  {activeTab === 'terms' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>
              {activeTab === 'terms' && (
                <div className="px-4 pb-4 space-y-2.5">
                  <div
                    ref={termsRef}
                    onScroll={(e) => handleScroll(e, setTermsRead)}
                    className="bg-white border border-slate-200 rounded-xl p-3 max-h-[130px] overflow-y-auto text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-line"
                  >
                    {texts.termsContent}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider">
                    {termsRead
                      ? <span className="text-emerald-600">{texts.readyToAgree}</span>
                      : <span className="text-amber-500 animate-pulse">{texts.scrollDown}</span>}
                  </div>
                  <div
                    onClick={() => {
                      if (termsRead) { setAgreedToTerms(!agreedToTerms); setShowTermsError(false); }
                      else setShowTermsError(true);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${agreedToTerms ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'} ${!termsRead ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <input type="checkbox" checked={agreedToTerms} disabled={!termsRead}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 checked:bg-primary checked:border-primary disabled:border-slate-200"
                        onClick={(e) => e.stopPropagation()} />
                      <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
                    </div>
                    <span className="text-xs text-slate-600 font-bold select-none leading-snug">{texts.confirmTerms}</span>
                  </div>
                  {showTermsError && <p className="text-[10px] text-red-500 font-bold pl-8 animate-bounce">{texts.readFirst}</p>}
                </div>
              )}
            </div>

            {/* Privacy Accordion */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'privacy' ? null : 'privacy')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <EyeOffIcon size={14} className="text-primary shrink-0" />
                  <span className="text-left">{texts.privacyTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {agreedToPrivacy && <Check size={13} className="text-emerald-500 stroke-[3]" />}
                  {activeTab === 'privacy' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>
              {activeTab === 'privacy' && (
                <div className="px-4 pb-4 space-y-2.5">
                  <div
                    ref={privacyRef}
                    onScroll={(e) => handleScroll(e, setPrivacyRead)}
                    className="bg-white border border-slate-200 rounded-xl p-3 max-h-[130px] overflow-y-auto text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-line"
                  >
                    {texts.privacyContent}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider">
                    {privacyRead
                      ? <span className="text-emerald-600">{texts.readyToAgree}</span>
                      : <span className="text-amber-500 animate-pulse">{texts.scrollDown}</span>}
                  </div>
                  <div
                    onClick={() => {
                      if (privacyRead) { setAgreedToPrivacy(!agreedToPrivacy); setShowPrivacyError(false); }
                      else setShowPrivacyError(true);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${agreedToPrivacy ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent'} ${!privacyRead ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <input type="checkbox" checked={agreedToPrivacy} disabled={!privacyRead}
                        onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                        className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 checked:bg-primary checked:border-primary disabled:border-slate-200"
                        onClick={(e) => e.stopPropagation()} />
                      <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] transition-opacity" />
                    </div>
                    <span className="text-xs text-slate-600 font-bold select-none leading-snug">{texts.confirmPrivacy}</span>
                  </div>
                  {showPrivacyError && <p className="text-[10px] text-red-500 font-bold pl-8 animate-bounce">{texts.readFirst}</p>}
                </div>
              )}
            </div>

            {/* All agreed indicator */}
            {allAgreed && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-700 font-bold">
                  {locale === 'am' ? 'ሁሉም ስምምነቶች ተቀብለዋል ✅' : 'All agreements accepted ✅ — Choose your signup method below'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: SIGNUP METHODS CARD ── */}
        <div className={`bg-white rounded-[2rem] shadow-xl shadow-primary/5 p-6 md:p-8 border border-border relative transition-all duration-500 ${!allAgreed ? 'overflow-hidden' : ''}`}>
          
          {/* Blur Overlay when not agreed */}
          {!allAgreed && (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center rounded-[2rem] gap-3 px-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <p className="text-center text-xs font-bold text-gray-500 leading-relaxed">
                {texts.blurHint}
              </p>
              {/* Progress indicator */}
              <div className="flex gap-2">
                {[confirmAge, agreedToEula, agreedToTerms, agreedToPrivacy].map((agreed, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${agreed ? 'bg-primary' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          )}

          <div className={`relative ${!allAgreed ? 'pointer-events-none select-none' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent italic">
                {view === 'initial' ? texts.signupTitle : view === 'email' ? getEmailSignupLabel(locale) : getPhoneSignupLabel(locale)}
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
              <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {toast.show && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
                <span className="text-lg">⏳</span>
                <p className="font-medium leading-relaxed">{toast.message}</p>
              </div>
            )}

            {view === 'initial' ? (
              <div className="flex flex-col gap-3">
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
                        <select value={ethBirthDay} aria-label="Day" onChange={(e) => setEthBirthDay(e.target.value)} className="p-3 bg-[#F8F4F1] rounded-xl font-bold text-xs text-accent outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="">{locale === 'am' ? 'ቀን' : 'Day'}</option>
                          {Array.from({ length: ethBirthMonth === '13' ? 6 : 30 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <select value={ethBirthMonth} aria-label="Month" onChange={(e) => setEthBirthMonth(e.target.value)} className="p-3 bg-[#F8F4F1] rounded-xl font-bold text-xs text-accent outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="">{locale === 'am' ? 'ወር' : 'Month'}</option>
                          {['Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'].map((m, i) => (
                            <option key={m} value={i + 1}>
                              {locale === 'am' ? ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'][i] : m}
                            </option>
                          ))}
                        </select>
                        <select value={ethBirthYear} aria-label="Year" onChange={(e) => setEthBirthYear(e.target.value)} className="p-3 bg-[#F8F4F1] rounded-xl font-bold text-xs text-accent outline-none focus:ring-2 focus:ring-primary/20">
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
                    <div className="p-3.5 bg-blue-50/50 border border-blue-100/70 rounded-2xl mt-2 text-xs text-gray-600 space-y-1.5">
                      <p className="font-bold text-accent">
                        {locale === 'am' ? 'የይለፍ ቃል ምክር' : 'Password Recommendation'}
                      </p>
                      <p className="leading-relaxed text-[11px]">
                        {locale === 'am' 
                          ? 'ለደህንነትዎ ሲባል የሚያስገቡት የይለፍ ቃል ርዝመቱ 8 ወይም ከዚያ በላይ ሆኖ፣ ትልልቅና ትንንሽ ፊደላትን፣ ቁጥሮችን እና ልዩ ምልክቶችን (እንደ @፣ #፣ $) ያካተተ እንዲሁም በቀላሉ የሚያስታውሱት ቢሆን ይመከራል።'
                          : 'For your security, it is recommended that your password is at least 8 characters long, includes uppercase & lowercase letters, numbers, and special characters (like @, #, $).'}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
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

            <div className="mt-6 text-center pt-5 border-t border-border">
              <p className="text-gray-400 text-xs font-medium">
                {texts.alreadyHave}{' '}
                <button 
                  onClick={() => router.push('/login')}
                  className="text-primary font-bold hover:underline ml-1"
                >
                  {texts.signIn}
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
