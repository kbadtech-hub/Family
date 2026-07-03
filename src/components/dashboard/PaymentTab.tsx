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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Check current location from profile
        supabase.from('profiles').select('location').eq('id', user.id).single().then(({ data }) => {
          if (data?.location) {
             const loc = typeof data.location === 'string' ? data.location : data.location.country;
             setUserLocation(loc || 'Ethiopia');
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

  if (success || pendingPayment) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500">
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
                   <div key={i} className="p-4 bg-muted rounded-2xl space-y-1">
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
  );
}
