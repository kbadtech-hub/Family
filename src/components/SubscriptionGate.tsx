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
          Your subscription has expired and the grace period has ended. Please renew to continue.
        </p>
        <button 
          onClick={() => router.push('/dashboard?tab=payment')}
          className="btn-primary w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          {locale === 'am' ? 'ክፍያ ፈጽም' : 'Renew Now'}
        </button>
      </div>
    );
  }

  // If premium or trial, all good
  if (subInfo?.status === 'premium' || subInfo?.status === 'trial') {
    return <>{children}</>;
  }

  // If expired (in grace period) or verified (no premium)
  if (subInfo?.status === 'expired' || (subInfo?.isVerified && !allowVerifiedView)) {
     return (
       <div className="relative">
          {/* Overlay for interaction blocking if not allowed */}
          {!allowVerifiedView && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center p-8 text-center space-y-4">
               <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Sparkles size={24} />
               </div>
               <h3 className="font-black text-accent uppercase tracking-tighter italic">Unlock All Features</h3>
               <p className="text-xs text-gray-500 font-medium max-w-[200px]">
                 {locale === 'am' ? 'ሁሉንም አገልግሎቶች ለማግኘት ክፍያዎን ያሳድጉ።' : 'Please upgrade to premium to use this feature.'}
               </p>
               <button 
                 onClick={() => router.push('/dashboard?tab=payment')}
                 className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
               >
                 {locale === 'am' ? 'አሁኑኑ ይክፈቱ' : 'Unlock Now'}
               </button>
            </div>
          )}
          
          {/* Content (Blurred if interaction blocked) */}
          <div className={!allowVerifiedView ? 'blur-[1px] pointer-events-none' : ''}>
             {children}
          </div>
          
          {/* Interaction blocker popup trigger for verified users who CAN view but CAN'T interact */}
          {allowVerifiedView && (
            <div 
              className="absolute inset-0 z-0 cursor-pointer" 
              onClick={(e) => {
                e.preventDefault();
                setShowPopup(true);
              }}
            />
          )}

          {showPopup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary">
                     <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-accent italic uppercase tracking-tighter leading-none">Unlock All Features</h2>
                  <p className="text-sm text-gray-500 italic">
                    {locale === 'am' ? 'ይህንን አገልግሎት ለመጠቀም ፕሪሚየም አባል መሆን ይኖርብዎታል።' : 'Upgrade to premium to interact, chat, and access exclusive content.'}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => router.push('/dashboard?tab=payment')}
                      className="btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      {locale === 'am' ? 'ፕሪሚየም ይሁኑ' : 'Become Premium'}
                    </button>
                    <button 
                      onClick={() => setShowPopup(false)}
                      className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                    >
                      {locale === 'am' ? 'ተመለስ' : 'Maybe Later'}
                    </button>
                  </div>
               </div>
            </div>
          )}
       </div>
     );
  }

  return <>{children}</>;
}
