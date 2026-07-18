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
  Award
} from 'lucide-react';
import { useLocale } from 'next-intl';

interface SubscriptionPlansPageProps {
  profile: any;
  defaultTab?: 'premium' | 'vip';
  onPaymentStarted?: () => void;
}

export default function SubscriptionPlansPage({ profile, defaultTab = 'premium', onPaymentStarted }: SubscriptionPlansPageProps) {
  const locale = useLocale();
  const isAm = locale === 'am';
  const [activePlanType, setActivePlanType] = useState<'premium' | 'vip'>(defaultTab);
  const [selectedDuration, setSelectedDuration] = useState<string>('3m');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Enforce strict country location rules
  const isEthiopia = profile?.location?.country?.toLowerCase() === 'ethiopia' || profile?.currency_locked === 'ETB';
  const currency = isEthiopia ? 'ETB' : 'USD';

  // 1. Premium Pricing Packages
  const premiumPlans = {
    ETB: [
      { id: '1m', name: isAm ? '1 ወር' : '1 Month', price: 700, originalPrice: 700, period: isAm ? 'በወር' : 'monthly', discount: 0 },
      { id: '3m', name: isAm ? '3 ወር (10% ቅናሽ)' : '3 Months (10% Off)', price: 1890, originalPrice: 2100, period: isAm ? 'በ3 ወር' : 'quarterly', discount: 10, popular: true },
      { id: '6m', name: isAm ? '6 ወር (20% ቅናሽ)' : '6 Months (20% Off)', price: 3360, originalPrice: 4200, period: isAm ? 'በ6 ወር' : 'semi-annually', discount: 20 },
      { id: '12m', name: isAm ? '1 ዓመት (35% ቅናሽ)' : '1 Year (35% Off)', price: 5460, originalPrice: 8400, period: isAm ? 'በዓመት' : 'yearly', discount: 35 },
      { id: 'lifetime', name: isAm ? 'የዕድሜ ልክ (በ3 እጥፍ)' : 'Lifetime (3x 1yr)', price: 16380, originalPrice: 16380, period: isAm ? 'ቋሚ' : 'lifetime', discount: 0 }
    ],
    USD: [
      { id: '1m', name: '1 Month', price: 7.99, originalPrice: 7.99, period: 'monthly', discount: 0 },
      { id: '3m', name: '3 Months (10% Off)', price: 21.57, originalPrice: 23.97, period: 'quarterly', discount: 10, popular: true },
      { id: '6m', name: '6 Months (20% Off)', price: 38.35, originalPrice: 47.94, period: 'semi-annually', discount: 20 },
      { id: '12m', name: '1 Year (35% Off)', price: 62.32, originalPrice: 95.88, period: 'yearly', discount: 35 },
      { id: 'lifetime', name: 'Lifetime (3x 1yr)', price: 186.95, originalPrice: 186.95, period: 'lifetime', discount: 0 }
    ]
  };

  // 2. VIP Pricing Packages
  const vipPlans = {
    ETB: [
      { id: 'vip_1m', name: isAm ? '1 ወር VIP' : '1 Month VIP', price: 1500, originalPrice: 1500, period: isAm ? 'በወር' : 'monthly', discount: 0 },
      { id: 'vip_3m', name: isAm ? '3 ወር VIP (10% ቅናሽ)' : '3 Months VIP (10% Off)', price: 4050, originalPrice: 4500, period: isAm ? 'በ3 ወር' : 'quarterly', discount: 10, popular: true },
      { id: 'vip_6m', name: isAm ? '6 ወር VIP (20% ቅናሽ)' : '6 Months VIP (20% Off)', price: 7200, originalPrice: 9000, period: isAm ? 'በ6 ወር' : 'semi-annually', discount: 20 },
      { id: 'vip_12m', name: isAm ? '1 ዓመት VIP (35% ቅናሽ)' : '1 Year VIP (35% Off)', price: 11700, originalPrice: 18000, period: isAm ? 'በዓመት' : 'yearly', discount: 35 },
      { id: 'vip_lifetime', name: isAm ? 'የዕድሜ ልክ VIP (በ3 እጥፍ)' : 'Lifetime VIP (3x 1yr)', price: 35100, originalPrice: 35100, period: isAm ? 'ቋሚ' : 'lifetime', discount: 0 }
    ],
    USD: [
      { id: 'vip_1m', name: '1 Month VIP', price: 12.99, originalPrice: 12.99, period: 'monthly', discount: 0 },
      { id: 'vip_3m', name: '3 Months VIP (10% Off)', price: 35.07, originalPrice: 38.97, period: 'quarterly', discount: 10, popular: true },
      { id: 'vip_6m', name: '6 Months VIP (20% Off)', price: 62.35, originalPrice: 77.94, period: 'semi-annually', discount: 20 },
      { id: 'vip_12m', name: '1 Year VIP (35% Off)', price: 101.32, originalPrice: 155.88, period: 'yearly', discount: 35 },
      { id: 'vip_lifetime', name: 'Lifetime VIP (3x 1yr)', price: 303.95, originalPrice: 303.95, period: 'lifetime', discount: 0 }
    ]
  };

  const currentPlans = activePlanType === 'premium' 
    ? (isEthiopia ? premiumPlans.ETB : premiumPlans.USD)
    : (isEthiopia ? vipPlans.ETB : vipPlans.USD);

  // Sync state values when activePlanType changes
  useEffect(() => {
    const isVip = activePlanType === 'vip';
    if (isVip) {
      setSelectedDuration('vip_3m');
    } else {
      setSelectedDuration('3m');
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

    // Check if running inside native shell (Capacitor)
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
        const productId = `com.beteseb.app.${selectedDuration}`;
        
        // Trigger native purchases billing sheet
        const transaction = await NativePurchases.purchaseProduct({
          productIdentifier: productId,
          productType: selectedDuration.endsWith('lifetime') ? PURCHASE_TYPE.INAPP : PURCHASE_TYPE.SUBS,
          quantity: 1
        });

        if (!transaction || !transaction.transactionId) {
          throw new Error("No transaction ID returned from native purchase.");
        }

        const isAndroid = (window as any).Capacitor.getPlatform() === 'android';
        
        if (isAndroid) {
          // Verify with Google Play Developer backend API
          const verifyResponse = await fetch('/api/payments/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              purchaseToken: transaction.transactionId,
              productId: productId,
              userId: profile.id,
              planType: selectedDuration
            })
          });

          const verifyData = await verifyResponse.json();
          if (verifyData.status === 'success') {
            alert(locale === 'am' ? 'የፕሌይ ስቶር ክፍያ በተሳካ ሁኔታ ተጠናቋል!' : 'Upgrade via Play Store completed successfully!');
            window.location.reload();
          } else {
            throw new Error(verifyData.message || 'Google Play validation failed on server.');
          }
        } else {
          // Verify with Apple App Store backend API
          const verifyResponse = await fetch('/api/payments/apple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiptData: transaction.transactionId,
              userId: profile.id,
              planType: selectedDuration
            })
          });

          const verifyData = await verifyResponse.json();
          if (verifyData.status === 'success') {
            alert(locale === 'am' ? 'የአፕል ስቶር ክፍያ በተሳካ ሁኔታ ተጠናቋል!' : 'Upgrade via App Store completed successfully!');
            window.location.reload();
          } else {
            throw new Error(verifyData.message || 'Apple receipt validation failed on server.');
          }
        }
      } catch (err: any) {
        console.error("Native Purchase error details:", err);
        alert(locale === 'am' ? `ክፍያው አልተሳካም፦ ${err.message}` : `Purchase failed: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const email = profile?.email || 'user@example.com';
      const nameParts = (profile?.full_name || 'Beteseb User').split(' ');
      const firstName = nameParts[0] || 'Beteseb';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      if (currency === 'ETB') {
        // Initialize Chapa online gateway
        const txRef = `${profile.id}-${selectedDuration}-${Date.now()}`;
        const response = await fetch('/api/payments/chapa/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: plan.price,
            email,
            first_name: firstName,
            last_name: lastName,
            tx_ref: txRef,
            callback_url: window.location.origin + `/${locale}/dashboard?tab=payments&tx_ref=${txRef}`
          })
        });

        const data = await response.json();
        if (data.status === 'success' && data.data?.checkout_url) {
          if (onPaymentStarted) onPaymentStarted();
          window.location.href = data.data.checkout_url;
        } else {
          throw new Error(data.message || 'Chapa initialization failed');
        }
      } else {
        // Initialize Stripe online gateway
        const response = await fetch('/api/payments/stripe/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: plan.price,
            email,
            planType: selectedDuration,
            userId: profile.id,
            successUrl: window.location.origin + `/${locale}/dashboard?status=success`,
            cancelUrl: window.location.origin + `/${locale}/dashboard?status=cancel`
          })
        });

        const data = await response.json();
        if (data.url) {
          if (onPaymentStarted) onPaymentStarted();
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Stripe initialization failed');
        }
      }
    } catch (err: any) {
      alert("Checkout initialization failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      
      {/* ── HEADER SECTION ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest">
          <Sparkles size={14} className="fill-primary/20 animate-pulse" />
          {isAm ? 'ቤተሰብ ፕሪሚየም እና ቪአይፒ' : 'Beteseb Premium & VIP Hub'}
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-accent italic uppercase tracking-tighter leading-none">
          {activePlanType === 'vip' 
            ? (isAm ? 'እንኳን ወደ ቪአይፒ አገልግሎት በደህና መጡ' : 'Welcome to VIP Status')
            : (isAm ? 'እንኳን ወደ ፕሪሚየም አገልግሎት በደህና መጡ' : 'Upgrade to Premium')}
        </h2>
        <p className="text-gray-500 font-medium italic text-sm md:text-base leading-relaxed">
          {activePlanType === 'vip'
            ? (isAm ? 'የእርስዎን ግላዊነት ሙሉ በሙሉ የሚቆጣጠሩበት፣ ከፍተኛ ጥበቃ የሚደረግለት እና ልዩ የሆኑ ፊቸሮችን የሚያገኙበት የቪአይፒ ክለብ።' : 'Exquisite privacy controls, complete incognito features, and golden crown status for elite matchmaking.')
            : (isAm ? 'ያልተገደበ የጽሑፍ ውይይት፣ ሙሉ የመገለጫ መረጃዎች እና ምርጥ አማራጮችን በማግኘት የትዳር አጋርዎን በፍጥነት ያግኙ።' : 'Unlock unlimited matches, contact profiles directly, access expert classes, and find your lifetime partner today.')}
        </p>
      </div>

      {/* ── TAB SELECTOR ──────────────────────────────────────────────────── */}
      <div className="flex bg-[#F1F5F9] p-1.5 rounded-[2rem] w-fit border border-gray-200/50 shadow-sm mx-auto">
        <button 
          onClick={() => setActivePlanType('premium')}
          className={`flex items-center gap-2 px-8 py-4 rounded-[1.7rem] text-xs font-black uppercase tracking-widest transition-all ${activePlanType === 'premium' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-accent'}`}
        >
          <Zap size={14} className={activePlanType === 'premium' ? 'fill-white' : ''} />
          {isAm ? 'ፕሪሚየም አባልነት' : 'Premium Plans'}
        </button>
        <button 
          onClick={() => setActivePlanType('vip')}
          className={`flex items-center gap-2 px-8 py-4 rounded-[1.7rem] text-xs font-black uppercase tracking-widest transition-all ${activePlanType === 'vip' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-accent'}`}
        >
          <Crown size={14} className={activePlanType === 'vip' ? 'fill-white text-yellow-300' : ''} />
          {isAm ? 'ቪአይፒ አባልነት' : 'VIP Plans'}
        </button>
      </div>

      {/* ── BENEFITS GRID ─────────────────────────────────────────────────── */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-primary/10 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-accent uppercase tracking-tight italic flex items-center gap-2">
            {activePlanType === 'vip' ? <Crown className="text-amber-500 fill-amber-100" /> : <Zap className="text-primary fill-primary/10" />}
            {isAm ? 'የሚያገኟቸው ዋና ጥቅሞች' : 'Key Features & Benefits'}
          </h3>
          
          <div className="space-y-4">
            {activePlanType === 'premium' ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'ያልተገደበ የትዳር አጋር ማግኘት' : 'Unlimited Matching Feed'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'የየቀኑን ገደብ በማለፍ ሁሉንም መገለጫዎች ይጎብኙ።' : 'Bypass the trust tier daily card limits and explore profiles without restrictions.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'የቀጥታ ውይይት' : 'Direct Private Chat'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'ለሚፈልጉት ሰው ወዲያውኑ የጽሑፍ ውይይት ይጀምሩ።' : 'Start chatting with matches instantly without wait limits.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'የሰዎች ሙሉ ዝርዝር መረጃ' : 'View Full Details & Bios'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'የሰዎችን ባዮ፣ ምርጫዎች እና ዝርዝር መረጃዎች ይክፈቱ።' : 'Reveal blurred profile traits, descriptions, and user bios.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'ቅድሚያ የሚሰጠው የድጋፍ አገልግሎት' : 'Priority Customer Care'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'ማንኛውም ችግር ሲያጋጥምዎት ቅድሚያ ድጋፍ ያገኛሉ።' : 'Your support requests and verification status updates are prioritized.'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><Crown size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'የወርቅ አክሊል ባጅ (Crown Badge)' : 'Golden Crown Status'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'በሁሉም ቦታዎች ላይ የወርቅ አክሊል ባጅ መገለጫዎ ላይ ይደረጋል።' : 'Stand out with an elegant Crown Badge on your avatar and details page.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><EyeOff size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'የመደበቂያ ሁነታ (Ghost Mode)' : 'Ghost Mode & Privacy'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'ፎቶዎን መደበቅ እና ስምዎን ማደብዘዝ ይችላሉ።' : 'Completely blur your avatar image (radius=25) and hide your full name.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><UserCheck size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'የመስመር ላይ መገኘትን መደበቅ' : 'Incognito Online Controls'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'online መሆንዎን፣ የተነበበ ምልክትን መደበቅ ይችላሉ።' : 'Hide your online active indicators, typing state, and read receipts.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><Award size={16} /></div>
                  <div>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">{isAm ? 'ሁሉንም የፕሪሚየም አገልግሎት ያካትታል' : 'All Premium Benefits Included'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium italic">{isAm ? 'ያልተገደበ መገለጫ፣ የቀጥታ ቻት እና ሌሎችንም ያካትታል።' : 'Enjoy complete Premium access in addition to your exclusive VIP features.'}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-8 bg-[#F8FAFC] rounded-[2.5rem] border border-border space-y-6 text-center">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {isAm ? 'የተመረጠው አገልግሎት' : 'Selected Category'}
            </h4>
            <p className="text-2xl font-black text-accent italic uppercase tracking-tighter">
              {activePlanType === 'vip' ? 'Beteseb VIP Status' : 'Beteseb Premium'}
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-150 shadow-inner flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isAm ? 'ጠቅላላ ክፍያ' : 'Total Amount Due'}
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
                {currentPlans.find(p => p.id === selectedDuration)?.discount}% {isAm ? 'ቅናሽ ተደርጓል' : 'Discount Applied'}
              </span>
            ) : null}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={isProcessing}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${activePlanType === 'vip' ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' : 'bg-primary text-white shadow-primary/20 hover:bg-primary-hover'}`}
          >
            {isProcessing ? <Loader2 className="animate-spin text-white" /> : <CreditCard size={16} />}
            {isAm ? 'ክፍያን ፈጽም' : 'Complete Upgrade'}
          </button>

          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            {isAm ? 'አስተማማኝ ክፍያ • ወዲያውኑ ገባሪ ይሆናል' : 'Secure gateway • Activated instantly'}
          </p>
        </div>
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
                <Star size={10} fill="white" /> {isAm ? 'ተመራጭ' : 'Best Offer'}
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



    </div>
  );
}
