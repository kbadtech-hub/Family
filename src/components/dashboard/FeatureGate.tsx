'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FeatureLockModal from '@/components/ui/FeatureLockModal';
import { Lock, Sparkles, Clock } from 'lucide-react';

interface FeatureGateProps {
  featureKey: string;
  featureTitle?: string;
  children: React.ReactNode;
  locale?: string;
}

export default function FeatureGate({
  featureKey,
  featureTitle,
  children,
  locale = 'am'
}: FeatureGateProps) {
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkLockState = async () => {
      try {
        const { data } = await supabase.from('settings').select('cms_content').limit(1).single();
        const locks = data?.cms_content?.feature_locks;
        if (locks && typeof locks[featureKey] === 'boolean') {
          setIsLocked(locks[featureKey]);
        } else {
          setIsLocked(false);
        }
      } catch (err) {
        setIsLocked(false);
      }
    };
    checkLockState();

    // Listen to settings real-time changes
    const channel = supabase
      .channel(`feature-gate-${featureKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload: any) => {
        const locks = payload.new?.cms_content?.feature_locks;
        if (locks && typeof locks[featureKey] === 'boolean') {
          setIsLocked(locks[featureKey]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [featureKey]);

  // Loading state placeholder (non-blocking)
  if (isLocked === null) {
    return <>{children}</>;
  }

  // If feature is locked by Admin, display branded Lock Card & Custom Modal
  if (isLocked) {
    const isAm = locale === 'am';
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
        <div className="bg-white rounded-[3.5rem] p-10 md:p-16 border border-primary/20 shadow-2xl text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <div className="w-24 h-24 bg-accent text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <Lock size={44} className="text-primary" />
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-widest">
              <Sparkles size={14} className="fill-primary" />
              {isAm ? 'በቅርብ ቀን ይጠብቁን' : 'Coming Soon'}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-accent italic uppercase tracking-tight">
              {isAm ? 'ይህ አገልግሎት በቅርቡ ይጀምራል!' : 'Feature Currently Locked'}
            </h2>
            {featureTitle && (
              <p className="text-sm font-black text-primary uppercase tracking-wider">
                [{featureTitle}]
              </p>
            )}
            <p className="text-gray-500 font-medium italic text-xs md:text-sm leading-relaxed">
              {isAm 
                ? 'ይህ አገልግሎት በቅርቡ የሚጀምር በመሆኑ በትግስት ጠብቁን። አድሚኑ አገልግሎቱን ሲከፍተው ወዲያውኑ ገባሪ ይሆናል።'
                : 'This service will be launching very soon. Please check back shortly!'}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary py-5 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Clock size={16} />
            {isAm ? 'ተጨማሪ መረጃ እና ማሳወቂያ' : 'View Details & Notify Me'}
          </button>
        </div>

        <FeatureLockModal
          isOpen={showModal}
          featureKey={featureKey}
          featureTitle={featureTitle}
          locale={locale}
          onClose={() => setShowModal(false)}
        />
      </div>
    );
  }

  return <>{children}</>;
}
