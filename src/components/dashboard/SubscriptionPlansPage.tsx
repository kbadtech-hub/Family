'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  Star, 
  Crown,
  EyeOff,
  UserCheck,
  Award,
  X
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import LocationGate from '@/components/dashboard/LocationGate';
import SystemAlertModal from '@/components/ui/SystemAlertModal';
import { generateChapaTxRef } from '@/lib/subscription';

interface SubscriptionPlansPageProps {
  profile: any;
  defaultTab?: 'premium' | 'vip';
  onPaymentStarted?: () => void;
}

export default function SubscriptionPlansPage({ profile, defaultTab = 'premium', onPaymentStarted }: SubscriptionPlansPageProps) {
  const locale = useLocale();
  const t = useTranslations('Subscription');
  const isAm = locale === 'am';
  const [activePlanType, setActivePlanType] = useState<'premium' | 'vip'>(defaultTab);
  
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'error' | 'success' | 'info' | 'warning'; title?: string }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showAlert = (message: string, type: 'error' | 'success' | 'info' | 'warning' = 'info', title?: string) => {
    setAlertModal({ isOpen: true, message, type, title });
  };
  const [selectedDuration, setSelectedDuration] = useState<string>('6m');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [isEthiopiaVerified, setIsEthiopiaVerified] = useState(false);

  // Currency is ALWAYS derived from the IP-based LocationGate result — never from profile.location
  // (profile.location could be stale; a user in Dubai with "Ethiopia" stored must see USD)
  // Before the gate runs, default to false (USD) — the gate is shown first anyway so prices are never displayed prematurely.
  const isEthiopia = isLocationVerified ? isEthiopiaVerified : false;
  const currency = isEthiopia ? 'ETB' : 'USD';
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

  // Payment Claim States
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTxRef, setClaimTxRef] = useState('');
  const [claimType, setClaimType] = useState('subscription_vip');
  const [claimExplanation, setClaimExplanation] = useState('');
  const [claimError, setClaimError] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const handleSubmitClaim = async () => {
    if (!claimTxRef.trim()) {
      setClaimError(t('claimTxRequired'));
      return;
    }
    setSubmittingClaim(true);
    setClaimError('');

    try {
      const ticketNumber = `BTS-CLAIM-${Math.floor(10000 + Math.random() * 90000)}`;
      const formattedMessage = `[PAYMENT_CLAIM]\nTx Ref: ${claimTxRef.trim()}\nType: ${claimType}\nPackage: Manual Claim\nExplanation: ${claimExplanation.trim()}`;

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: profile?.id || null,
          message: formattedMessage,
          status: 'pending',
          ticket_number: ticketNumber
        });

      if (error) throw error;

      showAlert(
        t('claimSuccessMsg').replace('{ticket}', ticketNumber),
        'success',
        t('claimSuccess')
      );
      setShowClaimModal(false);
      setClaimTxRef('');
      setClaimExplanation('');
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Multi-lingual instructions for Google Play Policy compliance (Web-to-App upgrade)
  const instructions = {
    am: {
      title: 'የተመረጠው አገልግሎት',
      upgradeTitle: 'በዌብሳይታችን ይክፈሉ',
      desc: 'ይህን መተግበሪያ ወደ ፕሪሚየም ወይም ቪአይፒ ለማሳደግ፣ እባክዎ በስልክዎ ወይም በኮምፒተርዎ ብሮውዘር ወደ ዌብሳይታችን (beteseb1.online) በመሄድ ክፍያ ይፈጽሙ።',
      footer: 'ክፍያውን እንደፈጸሙ መተግበሪያው በራስ-ሰር ይከፈትልዎታል።',
      badge: 'አስተማማኝ የደህንነት ስርዓት'
    },
    om: { // Oromiffa
      title: 'Tajaajila Filatame',
      upgradeTitle: 'Weebsaayitii Keenya irratti Kafalaa',
      desc: 'Appilikeeshinii kana gara Premium ykn VIPtti ol guddisuuf, maaloo bilbila ykn kompiutara keessaniin weebsaayitii keenya (beteseb1.online) daawwachuun kafaltii raawwadhaa.',
      footer: 'Kafaltii raawwattanii yeroo xumurtan appilikeeshiniin keessan ofumaan banama.',
      badge: 'Sirna Nageenya Mirkanaa\'ee'
    },
    ti: { // Tigrinya
      title: 'ዝተመርጸ ኣገልግሎት',
      upgradeTitle: 'ኣብ ወብሳይትና ይክፈሉ',
      desc: 'ነዚ መተግበሪያ ናብ ፕሪሚየም ናይ ቪኣይፒ ንምዕባይ፡ በጃኹም ብስልኪ ወይ ብኮምፒተርኩም ብሮውዘር ናብ ወብሳይትና (beteseb1.online) ብምኻድ ክፍሊት ይፈጽሙ።',
      footer: 'ክፍሊት ከምዝፈጸምኩም መተግበሪያኡ ብባዕሉ ክኽፈት እዩ።',
      badge: 'ውሑስ ናይ ምርግጋጽ ስርዓት'
    },
    so: { // Somali
      title: 'Adeegga la Doortay',
      upgradeTitle: 'Ku Bixi Websaydkayaga',
      desc: 'Si aad abkan ugu cusboonaysiiso Premium ama VIP, fadlan ka booqo websaydkayaga (beteseb1.online) taleefankaaga ama kombuyuutarkaaga si aad lacag bixinta u dhamaystirto.',
      footer: 'Markaad lacag bixinta dhamaystirto, abkaagu si toos ah ayuu u furmi doonaa.',
      badge: 'Nidaamka Amniga ee la Hubiyay'
    },
    ar: { // Arabic
      title: 'الخدمة المختارة',
      upgradeTitle: 'ادفع على موقعنا الإلكتروني',
      desc: 'لترقية هذا التطبيق إلى فئة مميزة (Premium) أو VIP، يرجى زيارة موقعنا الإلكتروني (beteseb1.online) على متصفح الهاتف أو الكمبيوتر لإتمام عملية الدفع.',
      footer: 'بمجرد إتمام الدفع، سيتم تفعيل حسابك في التطبيق تلقائياً.',
      badge: 'نظام تحقق آمن'
    },
    en: {
      title: 'Selected Category',
      upgradeTitle: 'Pay on our Website',
      desc: 'To upgrade this app to Premium or VIP status, please visit our website (beteseb1.online) on your phone or computer browser to make a secure payment.',
      footer: 'Your app will automatically unlock once the payment is completed.',
      badge: 'Secure Verification System'
    }
  };

  const currentText = instructions[locale as keyof typeof instructions] || instructions.en;

  // 1. Premium Pricing Packages (Standard Tier)
  const premiumPlans = {
    ETB: [
      { id: '1m', name: t('plan1m'), price: 149.99, originalPrice: 149.99, period: t('periodMonthly'), discount: 0 },
      { id: '3m', name: t('plan3m'), price: 379.99, originalPrice: 449.97, period: t('periodQuarterly'), discount: 15 },
      { id: '6m', name: t('plan6m'), price: 649.99, originalPrice: 899.94, period: t('periodSemiAnnual'), discount: 28, popular: true },
      { id: '12m', name: t('plan12m'), price: 999.99, originalPrice: 1799.88, period: t('periodYearly'), discount: 44 },
      { id: 'lifetime', name: t('planLifetime'), price: 1499.99, originalPrice: 1499.99, period: t('periodLifetime'), discount: 0 }
    ],
    USD: [
      { id: '1m', name: '1 Month', price: 7.99, originalPrice: 7.99, period: 'monthly', discount: 0 },
      { id: '3m', name: '3 Months (17% Off)', price: 19.99, originalPrice: 23.97, period: 'quarterly', discount: 17 },
      { id: '6m', name: '6 Months (29% Off)', price: 33.99, originalPrice: 47.94, period: 'semi-annually', discount: 29, popular: true },
      { id: '12m', name: '1 Year (48% Off)', price: 49.99, originalPrice: 95.88, period: 'yearly', discount: 48 },
      { id: 'lifetime', name: 'Lifetime Access', price: 74.99, originalPrice: 74.99, period: 'lifetime', discount: 0 }
    ]
  };

  // 2. VIP Pricing Packages (2x Standard Tier)
  const vipPlans = {
    ETB: [
      { id: 'vip_1m', name: t('plan1mVip'), price: 299.98, originalPrice: 299.98, period: t('periodMonthly'), discount: 0 },
      { id: 'vip_3m', name: t('plan3mVip'), price: 759.98, originalPrice: 899.94, period: t('periodQuarterly'), discount: 15 },
      { id: 'vip_6m', name: t('plan6mVip'), price: 1299.98, originalPrice: 1799.88, period: t('periodSemiAnnual'), discount: 28, popular: true },
      { id: 'vip_12m', name: t('plan12mVip'), price: 1999.98, originalPrice: 3599.76, period: t('periodYearly'), discount: 44 },
      { id: 'vip_lifetime', name: t('planLifetimeVip'), price: 2999.98, originalPrice: 2999.98, period: t('periodLifetime'), discount: 0 }
    ],
    USD: [
      { id: 'vip_1m', name: '1 Month VIP', price: 15.98, originalPrice: 15.98, period: 'monthly', discount: 0 },
      { id: 'vip_3m', name: '3 Months VIP (17% Off)', price: 39.98, originalPrice: 47.94, period: 'quarterly', discount: 17 },
      { id: 'vip_6m', name: '6 Months VIP (29% Off)', price: 67.98, originalPrice: 95.88, period: 'semi-annually', discount: 29, popular: true },
      { id: 'vip_12m', name: '1 Year VIP (48% Off)', price: 99.98, originalPrice: 191.76, period: 'yearly', discount: 48 },
      { id: 'vip_lifetime', name: 'Lifetime VIP', price: 149.98, originalPrice: 149.98, period: 'lifetime', discount: 0 }
    ]
  };

  const currentPlans = activePlanType === 'premium' 
    ? (isEthiopia ? premiumPlans.ETB : premiumPlans.USD)
    : (isEthiopia ? vipPlans.ETB : vipPlans.USD);

  // Sync state values when activePlanType changes
  useEffect(() => {
    const isVip = activePlanType === 'vip';
    if (isVip) {
      setSelectedDuration('vip_6m');
    } else {
      setSelectedDuration('6m');
    }
  }, [activePlanType]);

  // Sync activePlanType when defaultTab changes
  useEffect(() => {
    setActivePlanType(defaultTab);
  }, [defaultTab]);

  const handleCheckout = async () => {
    if (!profile?.id || !selectedDuration) return;
    setIsProcessing(true);

    const plan = currentPlans.find(p => p.id === selectedDuration);
    if (!plan) {
      setIsProcessing(false);
      return;
    }

    // On native app: redirect to website for payment (avoids Google Play Billing policy)
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      const locale_param = locale || 'am';
      const url = `https://beteseb1.online/${locale_param}/dashboard?tab=payments`;
      window.open(url, '_blank');
      setIsProcessing(false);
      return;
    }

    try {
      const email = profile?.email || '';
      const nameParts = (profile?.full_name || 'Beteseb User').split(' ');
      const firstName = nameParts[0] || 'Beteseb';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Initialize Chapa gateway (supports ETB and USD / International Cards)
      const txRef = generateChapaTxRef(profile.id, selectedDuration);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://beteseb1.online';
      const response = await fetch('/api/payments/chapa/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: currency,
          email,
          first_name: firstName,
          last_name: lastName,
          tx_ref: txRef,
          callback_url: `${origin}/api/payments/chapa/webhook`,
          return_url: `${origin}/${locale}/dashboard?tab=payments&tx_ref=${txRef}`
        })
      });

      const data = await response.json();
      if (data.status === 'success' && data.data?.checkout_url) {
        if (onPaymentStarted) onPaymentStarted();
        if (typeof window !== 'undefined' && window.top) {
          window.top.location.href = data.data.checkout_url;
        } else if (typeof window !== 'undefined') {
          window.location.href = data.data.checkout_url;
        }
        return;
      }

      const errStr = typeof data.message === 'string' ? data.message : (data.message ? JSON.stringify(data.message) : 'Chapa initialization failed');
      throw new Error(errStr);
    } catch (err: any) {
      const rawMsg = err?.message || err;
      const displayMsg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
      showAlert(displayMsg, 'error', t('paymentFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLocationVerified) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto">
        <LocationGate 
          locale={locale} 
          onVerified={(isEth) => {
            setIsEthiopiaVerified(isEth);
            setIsLocationVerified(true);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      
      {/* ── HEADER SECTION ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest">
          <Sparkles size={14} className="fill-primary/20 animate-pulse" />
          {t('hub')}
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-accent italic uppercase tracking-tighter leading-none">
          {activePlanType === 'vip' ? t('welcomeVip') : t('welcomeDiamond')}
        </h2>
        <p className="text-gray-500 font-medium italic text-sm md:text-base leading-relaxed">
          {activePlanType === 'vip' ? t('descVip') : t('descDiamond')}
        </p>
      </div>

      {/* ── TAB SELECTOR ──────────────────────────────────────────────────── */}
      <div className="flex bg-[#F1F5F9] p-1.5 rounded-[2rem] w-fit border border-gray-200/50 shadow-sm mx-auto">
        <button 
          onClick={() => setActivePlanType('premium')}
          className={`flex items-center gap-2 px-8 py-4 rounded-[1.7rem] text-xs font-black uppercase tracking-widest transition-all ${activePlanType === 'premium' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-accent'}`}
        >
          <Zap size={14} className={activePlanType === 'premium' ? 'fill-white' : ''} />
          {t('diamondPlans')}
        </button>
        <button 
          onClick={() => setActivePlanType('vip')}
          className={`flex items-center gap-2 px-8 py-4 rounded-[1.7rem] text-xs font-black uppercase tracking-widest transition-all ${activePlanType === 'vip' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-accent'}`}
        >
          <Crown size={14} className={activePlanType === 'vip' ? 'fill-white text-yellow-300' : ''} />
          {t('vipPlans')}
        </button>
      </div>

      {/* ── BENEFITS GRID ─────────────────────────────────────────────────── */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-primary/10 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-accent uppercase tracking-tight italic flex items-center gap-2">
            {activePlanType === 'vip' ? <Crown className="text-amber-500 fill-amber-100" /> : <Zap className="text-primary fill-primary/10" />}
            {t('keyFeatures')}
          </h3>
          
          <div className="space-y-4">
            {activePlanType === 'premium' ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat1Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat2Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat3Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat3Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat4Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat4Desc')}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><Crown size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat5Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat5Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><EyeOff size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat6Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat6Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><UserCheck size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat7Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat7Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><Award size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{t('feat8Title')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{t('feat8Desc')}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {isNative ? (
          <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20 space-y-6 text-center">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-primary uppercase tracking-widest">
                {currentText.title}
              </h4>
              <p className="text-2xl font-black text-accent italic uppercase tracking-tighter">
                {activePlanType === 'vip' ? 'Beteseb VIP Status' : 'Beteseb Premium'}
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-150 shadow-inner flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
              <span className="text-xs font-bold text-gray-500 leading-relaxed text-center">
                {currentText.desc}
              </span>
              <div className="w-full p-4 bg-[#F8FAFC] border border-border rounded-2xl select-all font-black text-primary text-sm tracking-wider text-center cursor-pointer active:scale-95 transition-all">
                beteseb1.online
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase italic text-center">
                {currentText.footer}
              </span>
            </div>

            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              {currentText.badge}
            </p>
          </div>
        ) : (
          <div className="p-8 bg-[#F8FAFC] rounded-[2.5rem] border border-border space-y-6 text-center">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {t('selectedCategory')}
              </h4>
              <p className="text-2xl font-black text-accent italic uppercase tracking-tighter">
                {activePlanType === 'vip' ? 'Beteseb VIP Status' : 'Beteseb Premium'}
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-150 shadow-inner flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {t('totalAmount')}
              </span>
              <div className="flex items-baseline gap-1 text-accent italic font-black">
                <span className="text-4xl">
                  {currency === 'ETB' ? 'ብር ' : '$'}
                  {currentPlans.find(p => p.id === selectedDuration)?.price || 0}
                </span>
                <span className="text-[10px] text-primary font-bold uppercase">{currency}</span>
              </div>
              {currentPlans.find(p => p.id === selectedDuration)?.discount ? (
                <span className="text-[10px] bg-red-500 text-white font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  {currentPlans.find(p => p.id === selectedDuration)?.discount}% {t('discountApplied')}
                </span>
              ) : null}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${activePlanType === 'vip' ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' : 'bg-primary text-white shadow-primary/20 hover:bg-primary-hover'}`}
            >
              {isProcessing ? <Loader2 className="animate-spin text-white" /> : <CreditCard size={16} />}
              {t('completeUpgrade')}
            </button>

            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              {t('secureGateway')}
            </p>
          </div>
        )}
      </div>

      {/* ── CARD PLAN LIST ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {currentPlans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedDuration(plan.id)}
            className={`relative p-8 rounded-[2.5rem] border-2 bg-white flex flex-col justify-between items-center text-center transition-all duration-300 cursor-pointer group ${selectedDuration === plan.id ? (activePlanType === 'vip' ? 'border-amber-500 bg-amber-50/5 shadow-2xl scale-105' : 'border-primary bg-primary/5 shadow-2xl scale-105') : 'border-border hover:border-gray-300'}`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5">
                <Star size={10} fill="white" /> {t('bestOffer')}
              </div>
            )}

            <div className="space-y-4 w-full">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                {plan.name}
              </span>
              
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1 font-black text-accent italic">
                  <span className="text-3xl">{currency === 'ETB' ? 'ብር ' : '$'}{plan.price}</span>
                  <span className="text-[9px] font-bold text-gray-400">/ {plan.period}</span>
                </div>
                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <span className="text-[10px] font-bold text-red-500 line-through opacity-50 block">
                    {currency === 'ETB' ? 'ብር ' : '$'}{plan.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-6 w-full">
              <div className={`w-10 h-10 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${selectedDuration === plan.id ? (activePlanType === 'vip' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-primary border-primary text-white shadow-lg shadow-primary/20') : 'border-border text-gray-300 group-hover:border-gray-400'}`}>
                <Check size={16} className={selectedDuration === plan.id ? 'opacity-100' : 'opacity-0'} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Claim Link */}
      <div className="pt-8 text-center">
        <button
          onClick={() => setShowClaimModal(true)}
          className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest underline decoration-primary/20 hover:text-accent transition-colors"
        >
          {t('submitClaimBtn')}
        </button>
      </div>

      {/* Payment Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-muted flex justify-between items-center bg-accent text-white">
              <h3 className="font-bold text-sm tracking-tight uppercase">{t('claimTitle')}</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('claimTxLabel')}</label>
                <input
                  type="text"
                  value={claimTxRef}
                  onChange={(e) => setClaimTxRef(e.target.value)}
                  placeholder="e.g. CHAPA-xxxx, STRIPE-xxxx, or Bank Receipt Ref"
                  className="w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white focus:border-primary transition-all text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('claimTypeLabel')}</label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white focus:border-primary transition-all text-sm font-semibold"
                >
                  <option value="subscription_vip">{t('typeVip')}</option>
                  <option value="subscription_premium">{t('typeDiamond')}</option>
                  <option value="coins">{t('typeCoins')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('claimExplainLabel')}</label>
                <textarea
                  value={claimExplanation}
                  onChange={(e) => setClaimExplanation(e.target.value)}
                  placeholder={t('claimExplainPlaceholder')}
                  className="w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white focus:border-primary transition-all text-sm font-semibold h-24 resize-none"
                />
              </div>
              {claimError && <p className="text-xs font-bold text-red-500">{claimError}</p>}
              <button
                onClick={handleSubmitClaim}
                disabled={submittingClaim}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {submittingClaim ? <Loader2 className="animate-spin" size={14} /> : null}
                {t('claimSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <SystemAlertModal 
        isOpen={alertModal.isOpen} 
        message={alertModal.message} 
        type={alertModal.type} 
        title={alertModal.title} 
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}
