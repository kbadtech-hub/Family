'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import { CreditCard, Check, Sparkles, Zap, ShieldCheck, Wallet, Loader2, Star, Image as ImageIcon } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  originalPrice?: number;
}

export default function PaymentPortal({ profile, onPaymentStarted }: { profile: any, onPaymentStarted: () => void }) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchPricing();
  }, [profile?.currency_locked]);

  const fetchPricing = async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).single();
    if (data) {
      const isEthiopia = profile?.country?.toLowerCase() === 'ethiopia' || profile?.currency_locked === 'ETB';
      const currency = isEthiopia ? 'ETB' : 'USD';
      const pricing = isEthiopia ? data.pricing_etb : data.pricing_usd;
      const discountValue = pricing?.discount || 0;
      setDiscount(discountValue);
      
      const banks = isEthiopia ? data.bank_details?.etb : data.bank_details?.usd;
      setBankDetails(banks || []);

      const calculatePrice = (basePrice: number) => {
         if (discountValue > 0) {
            return Math.round(basePrice * (1 - discountValue / 100));
         }
         return basePrice;
      };

      const newPlans: PricingPlan[] = [
        { id: '1m', name: locale === 'am' ? 'የ1 ወር ፓኬጅ' : '1 Month Plan', originalPrice: pricing['1m'], price: calculatePrice(pricing['1m']), duration: locale === 'am' ? '1 ወር' : '1 Month', features: ['Full Matching Access', 'Unlimited Chat', 'AI Recommendations'] },
        { id: '3m', name: locale === 'am' ? 'የ3 ወር (Premium)' : '3 Months (Premium)', originalPrice: pricing['3m'], price: calculatePrice(pricing['3m']), duration: locale === 'am' ? '3 ወራት' : '3 Months', features: ['All Standard Features', 'Priority List', 'Expert Guidance'], popular: true },
        { id: '12m', name: locale === 'am' ? 'የ1 አመት (Family)' : '1 Year (Family)', originalPrice: pricing['12m'], price: calculatePrice(pricing['12m']), duration: locale === 'am' ? '1 አመት' : '1 Year', features: ['All Premium Features', 'Offline Event Access', 'Unlimited Re-matches'] },
        { id: 'lifetime', name: locale === 'am' ? 'የዘላለም (Lifetime)' : 'Lifetime Access', originalPrice: pricing['lifetime'], price: calculatePrice(pricing['lifetime']), duration: locale === 'am' ? 'ለዘላለም' : 'Lifetime', features: ['Permanent Premium Status', 'VIP Support', 'Zero Ad Experience'] }
      ];
      setPlans(newPlans);
      setSelectedPlan('3m');
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !screenshot) {
       alert(locale === 'am' ? "እባክዎ የክፍያ ስክሪንሾት ያያይዙ" : "Please upload your payment screenshot");
       return;
    }
    setIsProcessing(true);
    
    try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;

       // Upload Screenshot
       const fileExt = screenshot.name.split('.').pop();
       const fileName = `${user.id}-${Date.now()}.${fileExt}`;
       const filePath = `receipts/${fileName}`;

       const { error: uploadError } = await supabase.storage
         .from('payments')
         .upload(filePath, screenshot);

       if (uploadError) throw uploadError;

       const { data: { publicUrl } } = supabase.storage
         .from('payments')
         .getPublicUrl(filePath);

       // Create payment record
       const plan = plans.find(p => p.id === selectedPlan);
       const { error: insertError } = await supabase.from('payments').insert([{
          user_id: user.id,
          amount: plan?.price,
          plan_type: selectedPlan,
          receipt_url: publicUrl,
          status: 'pending',
          currency: profile?.country?.toLowerCase() === 'ethiopia' ? 'ETB' : 'USD'
       }]);

       if (insertError) throw insertError;

       alert(locale === 'am' ? "ክፍያዎ ለምርመራ ተልኳል። አድሚኑ ሲያጸድቀው ፕሪሚየም ይሆናሉ!" : "Payment submitted for review. You will be premium once approved!");
       onPaymentStarted();
    } catch (err: any) {
       alert("Error: " + err.message);
    } finally {
       setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="text-center space-y-4 mb-16 animate-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest">
           <Zap size={14} /> {t('premium.unlock')}
        </div>
        <h2 className="text-5xl font-black text-accent italic tracking-tight italic">Find Your Life Partner.</h2>
        <p className="text-gray-500 max-w-xl mx-auto font-medium">Join thousands of verified Ethiopians globally. Choose a plan that fits your journey.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-10 rounded-[3.5rem] border-2 transition-all duration-500 cursor-pointer group ${selectedPlan === plan.id ? 'border-primary bg-white shadow-2xl scale-105' : 'border-border bg-white/50 hover:border-primary/50'}`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                <Star size={12} fill="white" /> Most Popular
              </div>
            )}

            <div className="space-y-6">
               <h3 className="text-xl font-black text-accent uppercase tracking-tighter">{plan.name}</h3>
               <div className="flex flex-col">
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-accent italic">{profile?.country?.toLowerCase() === 'ethiopia' ? 'ብር ' : '$'}{plan.price}</span>
                    <span className="text-gray-400 font-bold text-sm">/ {plan.duration}</span>
                 </div>
                 {plan.originalPrice && plan.originalPrice > plan.price && (
                    <span className="text-xs font-bold text-red-500 line-through opacity-50">
                       {profile?.country?.toLowerCase() === 'ethiopia' ? 'ብር ' : '$'}{plan.originalPrice}
                    </span>
                 )}
               </div>

              <div className="space-y-4 py-6 border-y border-border">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Check size={12} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <div className={`w-full h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-border text-gray-400 group-hover:border-primary/50 group-hover:text-primary'}`}>
                 <Check className={selectedPlan === plan.id ? 'opacity-100' : 'opacity-0'} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-accent text-white p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
        
         <div className="relative space-y-6 w-full md:w-2/3">
           <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 text-primary">
                 <ShieldCheck size={12} /> SECURE MANUAL PAYMENT
              </div>
              {discount > 0 && (
                 <div className="px-3 py-1 bg-primary rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <Star size={12} fill="white" /> {discount}% HOLIDAY DISCOUNT ACTIVE
                 </div>
              )}
           </div>
           
           <div className="space-y-4">
              <h3 className="text-2xl font-black italic tracking-tighter">Bank Details (Deposit/Transfer)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {bankDetails.map((bank, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                       <p className="text-[10px] font-black text-primary uppercase tracking-widest">{bank.bank_name}</p>
                       <p className="text-lg font-black tracking-widest">{bank.account_number}</p>
                       <p className="text-[10px] font-bold text-white/40 uppercase">{bank.account_holder}</p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary">Upload Payment Screenshot (Required)</h4>
              <div className="flex items-center gap-4">
                 <label className="flex-1 cursor-pointer group">
                    <div className="flex items-center gap-4 p-4 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl group-hover:border-primary/50 transition-all">
                       <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <ImageIcon size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{screenshot ? screenshot.name : 'Choose receipt image...'}</p>
                          <p className="text-[10px] text-white/40 uppercase font-black">JPG, PNG allowed</p>
                       </div>
                    </div>
                    <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             setScreenshot(file);
                             setScreenshotUrl(URL.createObjectURL(file));
                          }
                       }}
                    />
                 </label>
                 {screenshotUrl && (
                    <div className="w-16 h-16 rounded-xl border border-white/20 overflow-hidden shrink-0">
                       <img src={screenshotUrl} className="w-full h-full object-cover" />
                    </div>
                 )}
              </div>
           </div>
         </div>

         <div className="w-full md:w-1/3 flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Amount</p>
               <h4 className="text-4xl font-black italic tracking-tighter">
                  {profile?.country?.toLowerCase() === 'ethiopia' ? 'ብር ' : '$'}
                  {plans.find(p => p.id === selectedPlan)?.price || 0}
               </h4>
            </div>
            <button 
              onClick={handlePayment}
              disabled={isProcessing || !screenshot}
              className="w-full px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden disabled:opacity-30"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" /> SUBMITTING...
                </>
              ) : (
                <>
                  <Wallet size={20} className="group-hover:translate-x-1 transition-transform" /> COMPLETE PAYMENT
                </>
              )}
            </button>
            <p className="text-[10px] text-white/30 text-center font-bold uppercase tracking-widest leading-relaxed">
               By clicking complete, you agree to our terms. <br/> Approval typically takes 2-6 hours.
            </p>
         </div>
      </div>

      <div className="mt-12 flex justify-center gap-10 items-center opacity-40 grayscale contrast-125">
        <img src="https://chapa.co/favicon.ico" alt="Chapa" className="h-6" />
        <div className="w-px h-6 bg-gray-300" />
        <img src="https://stripe.com/favicon.ico" alt="Stripe" className="h-6" />
      </div>
    </div>
  );
}
