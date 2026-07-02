'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, BANK_DETAILS, getUserSubscriptionInfo, SubscriptionInfo } from '@/lib/subscription';
import {
  CreditCard, Upload, CheckCircle2, Clock, Landmark, Loader2,
  Camera, ShieldCheck, Crown, ExternalLink, Smartphone, X, ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

/** Detect if running inside Capacitor native app */
function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export default function PaymentTab() {
  const locale = useLocale();
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Proof upload (for ETB manual transfer)
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chapa flow
  const [chapaLoading, setChapaLoading] = useState(false);

  // PayPal flow
  const [paypalStep, setPaypalStep] = useState<'select' | 'pending' | 'submitted'>('select');
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalLink, setPaypalLink] = useState('');
  const [paypalTxId, setPaypalTxId] = useState('');

  // Native modal
  const [showNativeModal, setShowNativeModal] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const native = isNativeApp();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const info = await getUserSubscriptionInfo(user.id);
        setSubInfo(info);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  const isLocal = subInfo?.currency === 'ETB';
  const currency = isLocal ? 'ETB' : 'USD';
  const plans = SUBSCRIPTION_PLANS[currency];
  const banks = BANK_DETAILS[currency];
  const selectedPlanObj = plans.find(p => p.id === selectedPlan);

  // ── Chapa (ETB) ──────────────────────────────────────────
  const handleChapaPayment = async () => {
    if (!selectedPlan || native) return;
    setChapaLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/payments/chapa/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, currency: 'ETB' })
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
      } else {
        alert(data.error || locale === 'am' ? 'ክፍያ ማስጀመር አልተቻለም' : 'Failed to start payment.');
      }
    } catch {
      alert(locale === 'am' ? 'ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ' : 'Payment failed. Please try again.');
    } finally {
      setChapaLoading(false);
    }
  };

  // ── PayPal (USD) ─────────────────────────────────────────
  const handlePaypalPayment = async () => {
    if (!selectedPlan || !selectedPlanObj || native) return;
    setPaypalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/payments/paypal/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, amount: selectedPlanObj.price, currency: 'USD' })
      });
      const data = await res.json();
      if (data.paypalLink) {
        setPaypalLink(data.paypalLink);
        setPaypalStep('pending');
      } else {
        alert(data.error || 'Failed to start PayPal payment.');
      }
    } catch {
      alert('Payment initialization failed.');
    } finally {
      setPaypalLoading(false);
    }
  };

  const handlePaypalVerify = async () => {
    if (!paypalTxId.trim()) { alert('Please enter your PayPal Transaction ID'); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/payments/paypal/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalTransactionId: paypalTxId, planId: selectedPlan })
      });
      setPaypalStep('submitted');
      setSuccessMsg(locale === 'am' ? '✅ ክፍያ ተደርጓል። ፕሪሚየምዎ ይፈቃ።' : '✅ Payment submitted for review. Premium will be activated within 24 hours.');
    } catch {
      alert('Submission failed. Please try again.');
    }
  };

  // ── Manual proof upload (ETB fallback) ───────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!file || !user) return;
    setIsUploading(true);
    const fileName = `${user.id}/payment-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
      setProofUrl(publicUrl);
    }
    setIsUploading(false);
  };

  const handleManualSubmit = async () => {
    if (!selectedPlan || !proofUrl) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setIsSubmitting(true);
    await supabase.from('payments').insert({
      user_id: user.id,
      amount: selectedPlanObj?.price,
      currency,
      plan_type: selectedPlan,
      receipt_url: proofUrl,
      status: 'pending'
    });
    setSuccessMsg(locale === 'am' ? '✅ ማስረጃዎ ደርሶናል። አድሚኑ ሲያረጋግጠው ፕሪሚየምዎ ይከፈትለዎታል።' : '✅ Receipt received. Premium will be activated after admin review.');
    setIsSubmitting(false);
  };

  // ── Success / Submitted state ─────────────────────────────
  if (successMsg) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 p-12 bg-white rounded-[3rem] shadow-2xl border border-primary/10 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-yellow-500 animate-pulse">
          <Clock size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-accent italic uppercase tracking-tighter leading-none">
            {locale === 'am' ? 'ክፍያ ጠብቋል' : 'Payment Pending'}
          </h2>
          <p className="text-gray-500 font-medium italic">{successMsg}</p>
        </div>
        <div className="p-4 bg-muted rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {locale === 'am' ? 'ሁኔታ፡ ለፍተሻ ጠብቋል' : 'Status: Pending Review'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary">
          <Crown size={32} />
        </div>
        <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter leading-none">
          {locale === 'am' ? 'ፕሪሚየም አባልነት' : 'Go Premium'}
        </h1>
        <p className="text-gray-500 font-medium">
          {locale === 'am' ? 'ሙሉ ተደራሽነት ያግኙ — ምንም ገደብ አለ' : 'Unlock everything — no limits'}
        </p>
        {subInfo?.tier === 'premium' && (
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            {locale === 'am' ? 'ፕሪሚየም ገባሪ ነዎት' : 'Premium Active'}
          </div>
        )}
      </div>

      {/* Feature Benefits Grid */}
      <div className="bg-muted rounded-[2rem] p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {(locale === 'am' ? [
          { icon: '📞', label: 'ያልተወሰነ የድምጽ ጥሪ' },
          { icon: '📹', label: 'ቪዲዮ ጥሪ' },
          { icon: '💬', label: 'ያልተወሰነ መልዕክት' },
          { icon: '👥', label: 'የወዳጅነት ጥያቄ ላክ' },
          { icon: '🌍', label: 'የኮሚኒቲ ፖስቶች' },
          { icon: '🖼️', label: 'ፕሮፋይሎችን በቅጡ ይመልከቱ' },
        ] : [
          { icon: '📞', label: 'Unlimited Audio Calls' },
          { icon: '📹', label: 'Video Calling' },
          { icon: '💬', label: 'Unlimited Messaging' },
          { icon: '👥', label: 'Send Friend Requests' },
          { icon: '🌍', label: 'Community Posting' },
          { icon: '🖼️', label: 'Full Profile Photos' },
        ]).map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold text-accent">
            <span className="text-lg">{b.icon}</span>
            {b.label}
          </div>
        ))}
      </div>

      {/* Region Badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isLocal ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          {isLocal ? '🇪🇹 Ethiopia — Pricing in ETB' : '🌍 Global — Pricing in USD'}
        </div>
      </div>

      {/* Plan Selection */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          {locale === 'am' ? 'ፕላን ይምረጡ' : 'Choose Your Plan'}
        </h2>
        <div className="space-y-3">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan.id); setPaypalStep('select'); setProofUrl(null); }}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-white hover:border-primary/40'
              }`}
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-accent text-sm">
                    {locale === 'am' ? (plan as any).nameAm || plan.name : plan.name}
                  </span>
                  {plan.id === '1y' && (
                    <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {locale === 'am' ? 'የተሻለ' : 'Best Value'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-medium capitalize">{plan.period}</p>
              </div>
              <div className="text-right">
                <div className="font-black text-primary text-xl">
                  {currency === 'ETB' ? `${plan.price} ብር` : `$${plan.price}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Action Area */}
      {selectedPlan && (
        <div className="space-y-4 animate-in slide-in-from-bottom duration-400">

          {/* ── NATIVE APP: Informational only ── */}
          {native ? (
            <div className="bg-muted rounded-2xl p-6 space-y-4 border border-primary/10">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-primary" />
                <h3 className="text-xs font-black text-accent uppercase tracking-widest">
                  {locale === 'am' ? 'እንዴት ለመክፈል' : 'How to Subscribe'}
                </h3>
              </div>
              {isLocal ? (
                <div className="space-y-2 text-xs text-gray-600 font-medium">
                  <p>1. {locale === 'am' ? 'TeleBirr ወይም CBE ቢሮ ወደ +251946414018 ይላኩ' : 'Send payment via TeleBirr or CBE to +251946414018'}</p>
                  <p>2. {locale === 'am' ? 'ደረሰኙን ስክሪን ሾት ያቆዩ' : 'Screenshot your receipt'}</p>
                  <p>3. {locale === 'am' ? 'ወደ betesebhub@gmail.com ይላኩ' : 'Send it to betesebhub@gmail.com'}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-gray-600 font-medium">
                  <p>1. {locale === 'am' ? 'ኢሜይል ያድርጉ፡ betesebhub@gmail.com' : 'Email: betesebhub@gmail.com'}</p>
                  <p>2. {locale === 'am' ? 'ፕላን እና PayPal ዝርዝር ይላኩ' : 'Include your plan and PayPal details'}</p>
                  <p>3. {locale === 'am' ? 'ፕሪሚየም ከ24 ሰዓት ውስጥ' : 'Premium activated within 24 hours'}</p>
                </div>
              )}
              <div className="text-center bg-primary/10 rounded-xl p-3 text-xs font-black text-primary">
                📧 betesebhub@gmail.com
              </div>
            </div>

          ) : isLocal ? (
            /* ── CHAPA (ETB Web) ── */
            <div className="space-y-4">
              <button
                onClick={handleChapaPayment}
                disabled={chapaLoading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {chapaLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {locale === 'am' ? 'በChapa ይክፈሉ' : 'Pay via Chapa'}
              </button>

              <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                — {locale === 'am' ? 'ወይም የሚቀጥለውን ያሉ ማስረጃ ያስቀምጡ' : 'or upload manual payment proof below'} —
              </div>

              {/* Manual proof upload fallback */}
              <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="text-primary" />
                  <h3 className="text-xs font-black text-accent uppercase tracking-widest">
                    {locale === 'am' ? 'ቀጥታ ዝውውር' : 'Bank Transfer'}
                  </h3>
                </div>
                {(banks as any[]).map((bank: any, i: number) => (
                  <div key={i} className="p-4 bg-muted rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{bank.bank || bank.method}</p>
                    <p className="text-sm font-black text-accent">{bank.account || bank.link}</p>
                    {bank.name && <p className="text-[10px] text-gray-400">{bank.name}</p>}
                  </div>
                ))}

                <label className="block w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer relative overflow-hidden group transition-all">
                  {proofUrl ? (
                    <Image src={proofUrl} fill className="object-cover rounded-2xl" alt="Payment proof" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      {isUploading ? <Loader2 className="animate-spin text-primary" size={28} /> : <Camera className="text-gray-300 group-hover:text-primary transition-colors" size={28} />}
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {locale === 'am' ? 'ደረሰኝ ስዕል ያስቀምጡ' : 'Upload Payment Screenshot'}
                      </span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  disabled={!proofUrl || isSubmitting}
                  onClick={handleManualSubmit}
                  className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {locale === 'am' ? 'ለፍተሻ ያስቀምጡ' : 'Submit for Verification'}
                </button>
              </div>
            </div>

          ) : paypalStep === 'select' ? (
            /* ── PAYPAL (USD Web) ── */
            <button
              onClick={handlePaypalPayment}
              disabled={paypalLoading}
              className="w-full py-5 bg-[#0070BA] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#005ea6] transition-all disabled:opacity-60"
            >
              {paypalLoading ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
              {locale === 'am' ? 'በPayPal ይክፈሉ' : 'Pay with PayPal'}
            </button>

          ) : paypalStep === 'pending' ? (
            /* ── PAYPAL PENDING: Enter TX ID ── */
            <div className="bg-blue-50 rounded-2xl p-6 space-y-4 border border-blue-100">
              <p className="text-sm font-bold text-blue-800">
                {locale === 'am' ? 'ክፍያውን PayPal ላይ ጨርሱ፣ ከዚያ TX ID ያስቀምጡ።' : 'Complete your payment on PayPal, then enter your Transaction ID below.'}
              </p>
              <a
                href={paypalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#0070BA] text-white rounded-xl font-black text-xs uppercase tracking-widest"
              >
                <ExternalLink size={14} />
                {locale === 'am' ? 'PayPal ይክፈቱ' : 'Open PayPal'}
              </a>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {locale === 'am' ? 'የProperty ID ያስቀምጡ' : 'Enter PayPal Transaction ID'}
                </label>
                <input
                  type="text"
                  value={paypalTxId}
                  onChange={e => setPaypalTxId(e.target.value)}
                  placeholder="e.g. 5TY05013RG015352P"
                  className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl font-mono text-sm outline-none focus:border-blue-500"
                />
                <button
                  onClick={handlePaypalVerify}
                  className="w-full py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {locale === 'am' ? 'ክፍያ አረጋግጥ' : 'Confirm Payment'}
                </button>
              </div>
            </div>

          ) : null}
        </div>
      )}

      {/* 3-Day Refund Policy */}
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
        <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">
            {locale === 'am' ? '3 ቀን የገንዘብ ተመላሽ ፖሊሲ' : '3-Day Refund Policy'}
          </p>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            {locale === 'am'
              ? 'ክፍያ ከፈጸሙ በ3 ቀናት ውስጥ ካልረኩ ሙሉ ክፍያዎ ይመለሳል።'
              : 'Not satisfied within 3 days of payment? We offer a full refund, no questions asked.'}
          </p>
        </div>
      </div>

    </div>
  );
}
