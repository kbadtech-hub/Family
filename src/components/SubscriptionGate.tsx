'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { getUserSubscriptionInfo, SubscriptionInfo } from '@/lib/subscription';
import { ShieldCheck, Sparkles, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  allowVerifiedView?: boolean; // If true, verified users can see children but not interact
}

export default function SubscriptionGate({ children, allowVerifiedView = false }: SubscriptionGateProps) {
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    async function checkSub() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const info = await getUserSubscriptionInfo(user.id);
        setSubInfo(info);
      }
      setLoading(false);
    }
    checkSub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If locked, redirect to payment
  if (subInfo?.status === 'locked') {
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-red-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
           <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-accent">Account Locked (አካውንት ተቆልፏል)</h2>
        <p className="text-gray-500 italic">
          Your account has been locked. Please contact support or renew your subscription to continue.
        </p>
        <button 
          onClick={() => router.push('/dashboard?tab=payments')}
          className="btn-primary w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          {locale === 'am' ? 'ክፍያ ፈጽም' : 'Renew Now'}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
