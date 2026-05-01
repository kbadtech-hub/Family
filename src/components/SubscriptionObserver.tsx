'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { getUserSubscriptionInfo, SubscriptionInfo } from '@/lib/subscription';
import { AlertCircle, ArrowRight, X, Lock, CreditCard } from 'lucide-react';

export default function SubscriptionObserver() {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSub() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const info = await getUserSubscriptionInfo(user.id);
      setSubInfo(info);

      // FORCE LOCK LOGIC: Redirect to payment if locked and not on dashboard
      if (info?.status === 'locked' && !pathname.includes('dashboard')) {
         router.push('/dashboard?tab=payment');
      }

      // Mock Email Notification logic (Run once per session)
      if (info?.status === 'expired' || info?.status === 'locked') {
         const lastNotified = localStorage.getItem('last_sub_notify');
         const today = new Date().toDateString();
         if (lastNotified !== today) {
            console.log(`[SIMULATED EMAIL SENT] To: user@example.com - Subject: Your Beteseb Subscription has expired! Please renew at https://beteseb1.online/dashboard?tab=payment`);
            localStorage.setItem('last_sub_notify', today);
         }
      }
    }
    checkSub();
  }, [pathname, router]);

  if (!subInfo) return null;

  // 1. LOCKED OVERLAY (Full Screen Block)
  if (subInfo.status === 'locked' && !pathname.includes('onboarding')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-accent/95 backdrop-blur-xl flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full space-y-8 animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/30">
              <Lock size={48} className="text-red-500" />
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Account Locked</h2>
              <p className="text-gray-400 font-medium italic">
                {locale === 'am' 
                  ? 'የሰብስክሪፕሽን ጊዜዎ አብቅቷል። እባክዎ ሁሉንም አገልግሎቶች ለማግኘት ክፍያዎን ያሳድጉ።' 
                  : 'Your subscription has expired and the grace period has ended. Access to all features is restricted.'}
              </p>
           </div>
           <button 
             onClick={() => router.push('/dashboard?tab=payment')}
             className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center gap-3"
           >
             <CreditCard size={20} /> {locale === 'am' ? 'ክፍያ ፈጽም' : 'Renew Subscription'} <ArrowRight size={20} />
           </button>
        </div>
      </div>
    );
  }

  // 2. EXPIRED BANNER (Floating Pop-up)
  if (subInfo.status === 'expired' && !dismissed) {
    return (
      <div className="fixed bottom-8 right-8 left-8 md:left-auto md:w-96 z-[999] animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <button 
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-accent transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
               <AlertCircle size={24} />
            </div>
            <div className="space-y-3">
               <div>
                  <h4 className="font-black text-accent italic uppercase tracking-tight leading-none text-sm">Action Required</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Subscription Expired</p>
               </div>
               <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                 {locale === 'am' 
                   ? 'የሰብስክሪፕሽን ጊዜዎ አብቅቷል፤ እባክዎ ሁሉንም አገልግሎቶች ለማግኘት ክፍያዎን ያሳድጉ።' 
                   : 'Your subscription has expired. You are in a 3-day grace period. Please renew to keep access.'}
               </p>
               <button 
                 onClick={() => router.push('/dashboard?tab=payment')}
                 className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:gap-3 transition-all"
               >
                 Renew Now <ArrowRight size={14} />
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
