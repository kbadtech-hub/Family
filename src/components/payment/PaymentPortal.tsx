'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import { CreditCard, Check, Sparkles, Zap, ShieldCheck, Wallet, Loader2, Star } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

export default function PaymentPortal({ profile, onPaymentStarted }: { profile: any, onPaymentStarted: () => void }) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, [profile?.currency_locked]);

  const fetchPricing = async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).single();
    if (data) {
      const currency = profile?.currency_locked || 'USD';
      const pricing = currency === 'ETB' ? data.pricing_etb : data.pricing_usd;
      const symbol = currency === 'ETB' ? 'ብር ' : '$';
      
      const newPlans: PricingPlan[] = [
        { id: '1m', name: 'Standard Match', price: pricing['1m'], duration: '1 Month', features: ['Full Matching Access', 'Unlimited Chat', 'AI Recommendations'] },
        { id: '3m', name: 'Beteseb Premium', price: pricing['3m'], duration: '3 Months', features: ['All Standard Features', 'Priority List', 'Expert Guidance'], popular: true },
        { id: '12m', name: 'Family Plan', price: pricing['12m'], duration: '1 Year', features: ['All Premium Features', 'Offline Event Access', 'Unlimited Re-matches'] }
      ];
      setPlans(newPlans);
      setSelectedPlan('3m');
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    
    // Simulate Payment Initiation
    // In a real app, this would hit /api/payments/initiate
    const currency = profile?.currency_locked || 'USD';
    const gateway = currency === 'ETB' ? 'Chapa' : 'Stripe';
    
    console.log(`Initiating ${gateway} payment for ${selectedPlan}`);
    
    // Create a pending payment record
    const plan = plans.find(p => p.id === selectedPlan);
    if (plan && profile?.id) {
      await supabase.from('payments').insert([{
        user_id: profile.id,
        amount: plan.price,
        receipt_url: 'pending',
        status: 'pending'
      }]);
    }

    // Mock redirect to gateway
    setTimeout(() => {
      alert(`Redirecting to ${gateway} Gateway... (This is a simulation)`);
      onPaymentStarted();
      setIsProcessing(false);
    }, 2000);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-accent italic">{profile?.currency_locked === 'ETB' ? 'ብር ' : '$'}{plan.price}</span>
                <span className="text-gray-400 font-bold text-sm">/ {plan.duration}</span>
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
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5">
                <ShieldCheck size={12} className="text-primary" /> SECURE CHECKOUT
             </div>
          </div>
          <h3 className="text-3xl font-black italic tracking-tighter">Ready to start?</h3>
          <p className="text-white/60 font-medium">Paying with <span className="text-primary font-bold">{profile?.currency_locked === 'ETB' ? 'Chapa (Ethiopia)' : 'Stripe (Global)'}</span></p>
        </div>

        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="relative px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group overflow-hidden"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" /> {t('nav.processing')}
            </>
          ) : (
            <>
              <Wallet size={20} className="group-hover:translate-x-1 transition-transform" /> START PREMIUM NOW
            </>
          )}
        </button>
      </div>

      <div className="mt-12 flex justify-center gap-10 items-center opacity-40 grayscale contrast-125">
        <img src="https://chapa.co/favicon.ico" alt="Chapa" className="h-6" />
        <div className="w-px h-6 bg-gray-300" />
        <img src="https://stripe.com/favicon.ico" alt="Stripe" className="h-6" />
      </div>
    </div>
  );
}
