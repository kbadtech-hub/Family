'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { 
  Globe, 
  Heart, 
  Sparkles, 
  Users, 
  BookOpen, 
  Gift, 
  Share2, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  X,
  MessageSquare,
  HeartHandshake,
  Calendar,
  Coins
} from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'om', name: 'Oromoo' },
  { code: 'ti', name: 'ትግርኛ' },
  { code: 'so', name: 'Soomaali' },
  { code: 'ar', name: 'العربية' }
];

export default function MobileOnboarding() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Track swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Restore step from sessionStorage on mount (prevents reset after language change reloads)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStep = sessionStorage.getItem('beteseb_onboarding_step');
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
        sessionStorage.removeItem('beteseb_onboarding_step');
      }
      
      // Initial online check
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleNext = () => {
    if (currentStep < 11) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(11);
  };

  const handleLanguageSelect = (langCode: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('beteseb_onboarding_step', '2');
    }
    router.replace(pathname, { locale: langCode });
  };

  const handleAuthRedirect = (route: '/login' | '/signup') => {
    // If offline, block redirection and show custom dialog
    if (isOffline || !navigator.onLine) {
      setShowOfflineModal(true);
      return;
    }
    
    // Set onboarding completed flag in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('beteseb_onboarding_completed', 'true');
    }
    
    router.push(route);
  };

  // Touch handlers for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Slide navigation (flip logic for RTL Arabic layout)
    const nextDirection = locale === 'ar' ? isRightSwipe : isLeftSwipe;
    const backDirection = locale === 'ar' ? isLeftSwipe : isRightSwipe;

    if (nextDirection) {
      handleNext();
    } else if (backDirection) {
      handleBack();
    }
  };

  // Select layout direction based on locale
  const isRtl = locale === 'ar';

  return (
    <div 
      className="fixed inset-0 bg-[#0F172A] text-white flex flex-col justify-between p-6 pb-8 pt-4 z-[999] select-none font-sans overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_60%)] opacity-10 pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full h-12 relative z-10 shrink-0">
        <span className="text-primary italic tracking-tight font-black text-xl">
          {locale === 'am' ? 'ቤተሰብ' : 'BETESEB'}
        </span>
        {currentStep < 11 && (
          <button 
            onClick={handleSkip}
            className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors py-2 px-4 rounded-full border border-white/10 bg-white/5 cursor-pointer active:scale-95"
          >
            {t('skip')}
          </button>
        )}
      </div>

      {/* Main Slide Card Area */}
      <div className="flex-1 flex items-center justify-center py-4 relative z-10 w-full overflow-hidden">
        {/* Step 1: Language Select */}
        {currentStep === 1 && (
          <div className="w-full max-w-sm flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary mx-auto mb-1">
                <Globe size={32} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">{t('step1_title')}</h2>
              <p className="text-xs text-white/60 leading-relaxed px-4">{t('step1_desc')}</p>
            </div>
            
            <div className="pt-2 px-4">
              <CustomSelect
                value={locale}
                onChange={handleLanguageSelect}
                options={languages.map(l => ({ value: l.code, label: l.name }))}
                placeholder="Choose Language / ቋንቋ ይምረጡ"
                label="Language / ቋንቋ"
              />
            </div>
          </div>
        )}

        {/* Informational Slides (Steps 2 to 10) */}
        {currentStep >= 2 && currentStep <= 10 && (
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 px-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Step Icon */}
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-primary/10 to-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
              {currentStep === 2 && <Heart size={40} className="animate-pulse text-primary fill-primary/20" />}
              {currentStep === 3 && <Sparkles size={40} />}
              {currentStep === 4 && <MessageSquare size={40} />}
              {currentStep === 5 && <Users size={40} />}
              {currentStep === 6 && <BookOpen size={40} />}
              {currentStep === 7 && <HeartHandshake size={40} />}
              {currentStep === 8 && <Calendar size={40} />}
              {currentStep === 9 && <Gift size={40} />}
              {currentStep === 10 && <Coins size={40} />}
            </div>

            {/* Step Content */}
            <div className="space-y-3 px-2 overflow-hidden">
              <h2 className="text-xl font-black leading-tight italic text-white tracking-wide">
                {t(`step${currentStep}_title`)}
              </h2>
              <p className="text-xs text-white/60 leading-relaxed font-medium max-h-[30vh] overflow-y-auto">
                {t(`step${currentStep}_desc`)}
              </p>
            </div>
          </div>
        )}

        {/* Step 11: Get Started / Auth Gate */}
        {currentStep === 11 && (
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-primary/10 to-primary/25 border border-primary/40 flex items-center justify-center text-primary shadow-2xl shadow-primary/15 animate-bounce duration-1000 shrink-0">
              <ShieldCheck size={44} />
            </div>

            <div className="space-y-3 px-2">
              <h2 className="text-xl font-black leading-tight italic text-white tracking-wide">
                {t('step11_title')}
              </h2>
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                {t('step11_desc')}
              </p>
            </div>

            {/* Login & Signup Buttons */}
            <div className="w-full flex flex-col gap-3 pt-2 px-2 shrink-0">
              <button
                onClick={() => handleAuthRedirect('/signup')}
                className="w-full py-4 rounded-[2rem] bg-primary text-white font-bold text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {t('signup')} <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
              </button>
              <button
                onClick={() => handleAuthRedirect('/login')}
                className="w-full py-4 rounded-[2rem] border-2 border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
              >
                {t('login')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Area */}
      <div className="w-full flex flex-col space-y-6 relative z-10 shrink-0">
        {/* Navigation Indicator Dots & Arrow Buttons */}
        <div className="flex items-center justify-between w-full px-2">
          {/* Back Button */}
          {currentStep > 1 ? (
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-white/70 hover:text-white cursor-pointer"
            >
              <ChevronLeft size={20} className={isRtl ? 'rotate-180' : ''} />
            </button>
          ) : (
            <div className="w-10" />
          )}

          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 11 }).map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === idx + 1 
                    ? 'w-5 bg-primary' 
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          {currentStep < 11 ? (
            <button 
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/95 active:scale-90 transition-all text-white shadow-md shadow-primary/25 cursor-pointer"
            >
              <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Offline Alert Dialog Overlay Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[10000] animate-in fade-in duration-300">
          <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[2.5rem] w-full max-w-sm text-center relative space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowOfflineModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white leading-tight">
                {locale === 'am' ? 'ግንኙነት ተቋርጧል' : 'No Internet Connection'}
              </h3>
              <p className="text-xs text-white/60 leading-relaxed px-2">
                {t('offlineError')}
              </p>
            </div>

            <button
              onClick={() => setShowOfflineModal(false)}
              className="w-full py-4 rounded-[1.5rem] bg-white/10 hover:bg-white/15 border border-white/5 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
            >
              {locale === 'am' ? 'እሺ' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

