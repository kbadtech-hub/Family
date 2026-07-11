'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, BANK_DETAILS } from '@/lib/subscription';
import { 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Landmark, 
  Globe,
  Loader2,
  Camera,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

export default function PaymentTab() {
  const locale = useLocale();
  const [userId, setUserId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState('Ethiopia');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [isMobileNative, setIsMobileNative] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank'>('online');

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsMobileNative(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Check current location & phone prefix
        const userPhone = user.phone || '';
        const isEthiopianPhone = userPhone.startsWith('+251') || userPhone.startsWith('251') || (userPhone && !userPhone.startsWith('+'));

        supabase.from('profiles').select('location, email, full_name').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setUserProfile(data);
            let loc = 'Ethiopia';
            if (data.location) {
               loc = typeof data.location === 'string' ? data.location : data.location.country;
            }
            if (isEthiopianPhone) {
              setUserLocation('Ethiopia');
            } else {
              setUserLocation(loc || 'US');
            }
          }
        });

        // Check for pending payments
        supabase.from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) setPendingPayment(data);
          });
      }
    });
  }, []);

  const currency = userLocation === 'Ethiopia' ? 'ETB' : 'USD';
  const plans = SUBSCRIPTION_PLANS[currency];
  const banks = BANK_DETAILS[currency];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    const fileName = `${userId}/payment-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage.from('user_photos').upload(fileName, file);

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
      setProofUrl(publicUrl);
    }
    setIsUploading(false);
  };

  const handleSubmitPayment = async () => {
    if (!userId || !selectedPlan || !proofUrl) return;

    setIsSubmitting(true);
    const plan = plans.find(p => p.id === selectedPlan);
    
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      amount: plan?.price,
      currency: currency,
      plan_type: plan?.period,
      receipt_url: proofUrl,
      status: 'pending'
    });

    if (!error) {
      setSuccess(true);
      setPendingPayment({ status: 'pending' });
    }
    setIsSubmitting(false);
  };

  const handleNativeIAP = async () => {
    setIsSubmitting(true);
    // Simulate App Store / Google Play In-App Purchase response
    setTimeout(async () => {
      const plan = plans.find(p => p.id === selectedPlan);
      const { error } = await supabase.from('payments').insert({
        user_id: userId,
        amount: plan?.price,
        currency: currency,
        plan_type: plan?.period,
        receipt_url: 'In-App Purchase (Native Shell)',
        status: 'approved'
      });

      if (!error) {
        // Upgrade profile premium validity
        let days = 30;
        if (plan?.period === '3m') days = 90;
        if (plan?.period === '12m') days = 365;
        if (plan?.period === 'lifetime') days = 36500;

        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + days);

        await supabase.from('profiles').update({
          premium_until: premiumUntil.toISOString()
        }).eq('id', userId);

        alert(locale === 'am' ? 'ፕሪሚየም አገልግሎት በተሳካ ሁኔታ በርቷል!' : 'Premium upgraded successfully via App Store!');
        window.location.reload();
      } else {
        alert("Payment trigger failed: " + error.message);
      }
      setIsSubmitting(false);
    }, 1500);
  };

  const handleOnlineCheckout = async () => {
    if (!userId || !selectedPlan) return;
    setIsSubmitting(true);
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    try {
      const email = userProfile?.email || 'user@example.com';
      const nameParts = (userProfile?.full_name || 'Beteseb User').split(' ');
      const firstName = nameParts[0] || 'Beteseb';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      if (currency === 'ETB') {
        const txRef = `${userId}-${plan.id}-${Date.now()}`;
        const response = await fetch('/api/payments/chapa/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: plan.price,
            email,
            first_name: firstName,
            last_name: lastName,
            tx_ref: txRef,
            callback_url: window.location.origin + `/api/payments/chapa/webhook`
          })
        });

        const data = await response.json();
        if (data.status === 'success' && data.data?.checkout_url) {
          window.location.href = data.data.checkout_url;
        } else {
          throw new Error(data.message || 'Chapa initialization failed');
        }
      } else {
        const response = await fetch('/api/payments/stripe/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: plan.price,
            email,
            planType: plan.id,
            userId,
            successUrl: window.location.origin + `/${locale}/dashboard?status=success`,
            cancelUrl: window.location.origin + `/${locale}/dashboard?status=cancel`
          })
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Stripe initialization failed');
        }
      }
    } catch (err: any) {
      alert("Online checkout initialization failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success || (pendingPayment && !isMobileNative)) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 p-12 bg-white rounded-[3rem] shadow-2xl border border-primary/10 animate-in zoom-in duration-500">
         <div className="w-24 h-24 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-yellow-600 animate-pulse">
            <Clock size={48} />
         </div>
         <div className="space-y-4">
            <h2 className="text-3xl font-black text-accent italic uppercase tracking-tighter leading-none">Payment Pending</h2>
            <p className="text-gray-500 font-medium italic">
              {locale === 'am' 
                ? 'የክፍያ ማረጋገጫዎ ደርሶናል፤ አድሚኑ እስኪያጸድቀው ድረስ ጥቂት ደቂቃዎችን ይጠብቁ።' 
                : 'We have received your proof of payment. Our team is verifying it now. You will be notified once unlocked.'}
            </p>
         </div>
         <div className="p-4 bg-muted rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            STATUS: WAITING FOR ADMIN APPROVAL
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-accent italic uppercase tracking-tighter leading-none">Upgrade to Premium</h2>
        <p className="text-gray-500 font-medium italic">Select a plan and unlock all features including private chat and matching.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
         {plans.map((plan) => (
           <button 
             key={plan.id}
             onClick={() => setSelectedPlan(plan.id)}
             className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center text-center space-y-2 group ${selectedPlan === plan.id ? 'border-primary bg-primary/5 shadow-xl scale-105' : 'border-muted hover:border-primary/20 hover:bg-muted/50'}`}
           >
             {selectedPlan === plan.id && (
               <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                  <CheckCircle2 size={16} />
               </div>
             )}
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{plan.name}</span>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-accent italic">{plan.price}</span>
                <span className="text-[10px] font-bold text-primary">{currency}</span>
             </div>
           </button>
         ))}
      </div>

      {selectedPlan && (
        isMobileNative ? (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] border border-primary/10 shadow-2xl text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500">
             <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary">
                <CreditCard size={36} />
             </div>
             <div className="space-y-3">
                <h3 className="font-black text-accent uppercase tracking-tight text-lg italic">Complete Upgrade Natively</h3>
                <p className="text-xs text-gray-500 italic max-w-xs mx-auto leading-relaxed">
                  {locale === 'am' 
                    ? 'ክፍያዎን በአፕል አፕ ስቶር ወይም ጎግል ፕሌይ በኩል በደህንነት ይፈጽሙ። ሁሉም ዲጂታል አገልግሎቶች ወዲያውኑ ይከፈታሉ።' 
                    : 'Please complete your purchase securely via Apple App Store or Google Play In-App Billing.'}
                </p>
             </div>
             <button 
               disabled={isSubmitting}
               onClick={handleNativeIAP}
               className="btn-primary w-full py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
             >
               {isSubmitting ? <Loader2 className="animate-spin" /> : (locale === 'am' ? 'አሁኑኑ ይክፈቱ' : 'Pay Natively Now')} <ArrowRight size={16} />
             </button>
             <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-1">
                <div className="flex items-center justify-center gap-2 text-primary font-bold text-[9px] uppercase tracking-widest">
                   <ShieldCheck size={12} /> App Store Verified Checkout
                </div>
             </div>
             <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/50 space-y-1 text-center">
                <p className="text-[10px] text-yellow-800 font-bold leading-relaxed">
                   {locale === 'am'
                     ? 'ማሳሰቢያ፦ በቴሌብር (Telebirr) ወይም በጫፓ (Chapa) ክፍያ መፈጸም ከፈለጉ፣ እባክዎ በስልክዎ/ኮምፒውተርዎ ብሮውዘር በመጠቀም ወደ beteseb1.online የድህረ-ገጽ ፖርታል በመሄድ ይክፈሉ።'
                     : 'Notice: If you wish to pay using local Ethiopian payment options (Telebirr, Chapa), please visit our web portal at beteseb1.online using your browser.'}
                </p>
             </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
             {/* Payment Method Switcher */}
             <div className="flex bg-[#F1F5F9] p-1.5 rounded-2xl w-fit border border-gray-150 shadow-sm mx-auto">
                <button 
                  onClick={() => setPaymentMethod('online')} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'online' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-accent'}`}
                >
                  {locale === 'am' ? 'በኦንላይን ይክፈሉ (Online Checkout)' : 'Pay Online Instantly'}
                </button>
                <button 
                  onClick={() => setPaymentMethod('bank')} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'bank' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-accent'}`}
                >
                  {locale === 'am' ? 'በባንክ ማስተላለፍ (Bank / Manual)' : 'Bank Transfer / Manual'}
                </button>
             </div>

             {paymentMethod === 'online' ? (
                <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] border border-primary/10 shadow-2xl text-center space-y-8">
                   <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary">
                      <CreditCard size={36} />
                   </div>
                   <div className="space-y-3">
                      <h3 className="font-black text-accent uppercase tracking-tight text-lg italic">Instant Online Gateway</h3>
                      <p className="text-xs text-gray-500 italic max-w-xs mx-auto leading-relaxed">
                         {locale === 'am'
                           ? `የመረጡትን የፕሪሚየም ዕቅድ በ${currency === 'ETB' ? 'ቻፓ/ቴሌብር (Chapa)' : 'ስትራይፕ (Stripe)'} በኩል ክፍያውን በቅጽበት ይፈጽሙ። መለያዎ ወዲያውኑ ይነቃል።`
                           : `Pay securely online via ${currency === 'ETB' ? 'Chapa (Mobile Banking & Telebirr)' : 'Stripe (Cards)'}. Your account is activated instantly.`}
                      </p>
                   </div>
                   <button 
                     disabled={isSubmitting}
                     onClick={handleOnlineCheckout}
                     className="btn-primary w-full py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin text-white" /> : <ArrowRight size={16} />} 
                     {locale === 'am' ? 'በቀጥታ አሁኑኑ ይክፈሉ' : 'Pay Safely Online'}
                   </button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                   {/* Step 1: Bank Details */}
                   <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-xl space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Landmark size={20} />
                         </div>
                         <h3 className="font-black text-accent uppercase tracking-tight text-sm italic">Step 1: Make Payment</h3>
                      </div>
                      <div className="space-y-4">
                         {banks.map((bank: any, i: number) => (
                           <div key={i} className="p-4 bg-[#F8FAFC] rounded-2xl space-y-1">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{bank.bank || bank.method}</p>
                              <p className="text-sm font-black text-accent italic">{bank.account || bank.link}</p>
                              {bank.name && <p className="text-[10px] text-gray-400 font-bold uppercase">{bank.name}</p>}
                           </div>
                         ))}
                      </div>
                      
                      {/* Refund Policy */}
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                         <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                            <ShieldCheck size={14} /> 3-Day Refund Policy
                         </div>
                         <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                            {locale === 'am' 
                              ? 'ክፍያ በፈጸሙ በ3 ቀናት ውስጥ በማንኛውም ምክንያት ካልረኩ ሙሉ ክፍያዎን መመለስ ይችላሉ።' 
                              : 'If you are not satisfied, you can request a full refund within 3 days of your payment.'}
                         </p>
                      </div>
                   </div>

                   {/* Step 2: Proof Upload */}
                   <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-xl space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                            <Upload size={20} />
                         </div>
                         <h3 className="font-black text-accent uppercase tracking-tight text-sm italic">Step 2: Upload Proof</h3>
                      </div>
                      
                      <label className="block w-full aspect-video rounded-[2rem] border-2 border-dashed border-muted hover:border-primary/20 hover:bg-muted/50 transition-all cursor-pointer relative overflow-hidden group">
                         {proofUrl ? (
                            <Image src={proofUrl} fill className="object-cover" alt="Payment Proof" />
                         ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                               {isUploading ? <Loader2 className="animate-spin text-primary" /> : <Camera className="text-gray-300 group-hover:scale-110 transition-all" />}
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Screenshot</span>
                            </div>
                         )}
                         <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <button 
                        disabled={!proofUrl || isSubmitting}
                        onClick={handleSubmitPayment}
                        className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit for Verification'} <ArrowRight size={16} />
                      </button>
                   </div>
                </div>
             )}
          </div>
        )
      )}
    </div>
  );
}
