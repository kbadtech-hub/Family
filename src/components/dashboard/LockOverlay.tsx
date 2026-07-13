'use client';

import React, { useState } from 'react';
import { Lock, Sparkles, Coins, ArrowRight, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LockOverlayProps {
  targetUserId: string;
  targetUserName: string;
  currentCoins: number;
  costCoins: number;
  locale: string;
  onClose: () => void;
  onUnlockSuccess: () => void;
  onUpgrade: () => void;
}

export default function LockOverlay({
  targetUserId,
  targetUserName,
  currentCoins,
  costCoins,
  locale,
  onClose,
  onUnlockSuccess,
  onUpgrade
}: LockOverlayProps) {
  const [loading, setLoading] = useState(false);

  const handleUnlockWithCoins = async () => {
    if (currentCoins < costCoins) {
      alert(
        locale === 'am'
          ? `በቂ ሳንቲም የለዎትም። የእርስዎ ቀሪ ሳንቲም፡ ${currentCoins} ነው`
          : `Insufficient coins. Your current balance is ${currentCoins}`
      );
      return;
    }

    setLoading(true);
    try {
      // Call RPC function to deduct coins and save unlock record
      const { data, error } = await supabase.rpc('unlock_profile_with_coins', {
        target_user_id: targetUserId,
        cost_coins: costCoins
      });

      if (error) throw error;

      if (data) {
        alert(
          locale === 'am'
            ? 'መገለጫው በተሳካ ሁኔታ ተከፍቷል!'
            : 'Profile unlocked successfully!'
        );
        onUnlockSuccess();
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      alert(
        locale === 'am'
          ? `መክፈት አልተቻለም፦ ${err.message}`
          : `Failed to unlock: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const isAm = locale === 'am';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-primary/20 relative space-y-6 animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Close paywall"
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-muted rounded-xl"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-4 pt-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto animate-pulse">
            <Lock size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-accent italic tracking-tight">
              {isAm ? 'መገለጫ ተቆልፏል' : 'Profile Locked'}
            </h3>
            <p className="text-xs text-gray-500 font-bold max-w-xs mx-auto leading-relaxed">
              {isAm
                ? `የ${targetUserName} ዝርዝር መረጃዎችን፣ ባዮ እና ሌሎች ዝርዝሮችን ለማየት እባክዎ ከታች ካሉት አማራጮች አንዱን ይምረጡ።`
                : `To view the detailed bio and traits of ${targetUserName}, please choose one of the options below.`}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Option A: Premium Upgrade */}
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-primary to-orange-400 text-white p-5 rounded-2xl font-black uppercase tracking-wider text-[11px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="fill-white animate-spin-slow" />
              {isAm ? 'ፕሪሚየም ይክፈቱ (ያልተገደበ)' : 'Upgrade to Premium'}
            </span>
            <span className="flex items-center gap-1 font-bold text-[9px] bg-white/20 px-2.5 py-1 rounded-full uppercase">
              {isAm ? 'ምርጥ' : 'Unlimited'} <ArrowRight size={12} />
            </span>
          </button>

          {/* Option B: Unlock with Coins */}
          <button
            onClick={handleUnlockWithCoins}
            disabled={loading}
            className="w-full bg-white border-2 border-border text-accent p-5 rounded-2xl font-black uppercase tracking-wider text-[11px] hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="flex items-center gap-2">
              <Coins className="text-amber-500" size={16} />
              {isAm
                ? `${costCoins} ሳንቲም በመጠቀም ክፈት`
                : `Unlock with ${costCoins} Coins`}
            </span>
            <span className="flex items-center gap-1 font-bold text-[9px] text-gray-500">
              {isAm ? `ሂሳብዎ፦ ${currentCoins}` : `Balance: ${currentCoins}`}
            </span>
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
      </div>
    </div>
  );
}
