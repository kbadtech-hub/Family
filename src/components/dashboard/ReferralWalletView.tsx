'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Share2,
  Copy,
  Check,
  Coins,
  Wallet,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
  Send,
  Loader2,
  Lock,
  FileText
} from 'lucide-react';
import Image from 'next/image';

interface ReferralWalletViewProps {
  profile: any;
  locale: string;
}

export default function ReferralWalletView({ profile, locale }: ReferralWalletViewProps) {
  const isAm = locale === 'am';

  // Referral & Wallet States
  const [referralCode, setReferralCode] = useState<string>(profile?.referral_code || '');
  const [copied, setCopied] = useState(false);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(profile?.coins || 0);
  const [totalEarnedCoins, setTotalEarnedCoins] = useState<number>(0);
  const [exchangeRateEtb, setExchangeRateEtb] = useState<number>(500); // 10,000 Coins = 500 ETB default
  const [loading, setLoading] = useState(true);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10000);
  const [selectedBank, setSelectedBank] = useState<string>('Commercial Bank of Ethiopia (CBE)');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dispute / Claim Support Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeEmail, setDisputeEmail] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ethiopianBanks = [
    { id: 'cbe', name: isAm ? 'የኢትዮጵያ ንግድ ባንክ (CBE)' : 'Commercial Bank of Ethiopia (CBE)' },
    { id: 'telebirr', name: isAm ? 'ቴሌብር (Telebirr)' : 'Telebirr' },
    { id: 'cbe_birr', name: isAm ? 'ሲቢኢ ብር (CBE Birr)' : 'CBE Birr' },
    { id: 'abyssinia', name: isAm ? 'አቢሲኒያ ባንክ (Bank of Abyssinia)' : 'Bank of Abyssinia' },
    { id: 'awash', name: isAm ? 'አዋሽ ባንክ (Awash Bank)' : 'Awash Bank' },
    { id: 'dashen', name: isAm ? 'ዳሽን ባንክ (Dashen Bank)' : 'Dashen Bank' },
    { id: 'hibret', name: isAm ? 'ኅብረት ባንክ (Hibret Bank)' : 'Hibret Bank' },
    { id: 'nib', name: isAm ? 'እናት / ንብ ባንክ (Nib International Bank)' : 'Nib International Bank' },
    { id: 'zemen', name: isAm ? 'ዘመን ባንክ (Zemen Bank)' : 'Zemen Bank' },
    { id: 'coop', name: isAm ? 'የኦሮሚያ ህብረት ስራ ባንክ (Coop Bank of Oromia)' : 'Cooperative Bank of Oromia' }
  ];

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : `https://beteseb.com/signup?ref=${referralCode}`;

  useEffect(() => {
    fetchReferralData();
  }, [profile?.id]);

  const fetchReferralData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Fetch profile referral_code if missing
      if (!referralCode) {
        const { data: pData } = await supabase.from('profiles').select('referral_code').eq('id', profile.id).single();
        if (pData?.referral_code) setReferralCode(pData.referral_code);
      }

      // 2. Fetch current wallet balance
      const { data: walletData } = await supabase.from('user_wallets').select('coin_balance').eq('id', profile.id).single();
      if (walletData) setCoinBalance(Number(walletData.coin_balance || 0));

      // 3. Fetch referrals list for user
      const { data: refData } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:profiles!referrals_referee_id_fkey(full_name, avatar_url, email, created_at)
        `)
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      if (refData) {
        setReferralsList(refData);
        const total = refData.reduce((acc: number, curr: any) => acc + Number(curr.total_coins_earned || 0), 0);
        setTotalEarnedCoins(total);
      }

      // 4. Fetch withdrawal requests list
      const { data: withdrawData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (withdrawData) setWithdrawalsList(withdrawData);

      // 5. Fetch disputes list
      const { data: dispData } = await supabase
        .from('referral_disputes')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (dispData) setDisputesList(dispData);

      // 6. Fetch dynamic exchange rate from settings
      const { data: setRes } = await supabase.from('settings').select('cms_content').limit(1).single();
      if (setRes?.cms_content?.coin_exchange_rate_etb) {
        const rate = Number(setRes.cms_content.coin_exchange_rate_etb);
        if (!isNaN(rate) && rate > 0) setExchangeRateEtb(rate);
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Beteseb Platform',
          text: isAm ? 'በ "ቤተሰቤ" አፕሊኬሽን ተመዝግበው የህይወት አጋርዎን ያግኙ!' : 'Join me on Beteseb and find your ideal life partner!',
          url: referralLink
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Dynamic calculations for withdrawal
  const ratePerCoin = exchangeRateEtb / 10000;
  const grossEtb = Math.round(withdrawAmount * ratePerCoin * 100) / 100;
  const feeEtb = Math.round(grossEtb * 0.30 * 100) / 100;
  const netEtb = Math.round((grossEtb - feeEtb) * 100) / 100;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalMessage(null);

    if (coinBalance < 10000) {
      setWithdrawalMessage({
        type: 'error',
        text: isAm ? 'ለገንዘብ ማውጣት ጥያቄ ቢያንስ 10,000 ኮይን ሊኖርዎት ይገባል።' : 'Minimum withdrawal requirement is 10,000 coins.'
      });
      return;
    }

    if (!accountNumber.trim() || !accountName.trim()) {
      setWithdrawalMessage({
        type: 'error',
        text: isAm ? 'እባክዎ የባንክ አካውንት ቁጥር እና ስም ያስገቡ።' : 'Please provide bank account number and holder name.'
      });
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      const res = await fetch('/api/referrals/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          coinsAmount: withdrawAmount,
          bankName: selectedBank,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process withdrawal request');
      }

      setWithdrawalMessage({
        type: 'success',
        text: isAm ? 'የገንዘብ ማውጣት ጥያቄዎ በተሳካ ሁኔታ ቀርቧል! በአስተዳዳሪ ተገምግሞ ይከፈላል።' : 'Withdrawal request submitted successfully! Pending admin approval.'
      });
      setAccountNumber('');
      setAccountName('');
      fetchReferralData();
    } catch (err: any) {
      setWithdrawalMessage({
        type: 'error',
        text: err.message || (isAm ? 'ጥያቄውን ማቅረብ አልተቻለም።' : 'Submission failed')
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeMessage(null);

    if (!disputeEmail.trim() || !disputeReason.trim()) {
      setDisputeMessage({
        type: 'error',
        text: isAm ? 'እባክዎ የተጋባዡን ኢሜይል እና አቤቱታዎን ያስገቡ።' : 'Please provide referee email and details.'
      });
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const res = await fetch('/api/referrals/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          refereeEmail: disputeEmail.trim(),
          claimReason: disputeReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit claim');

      setDisputeMessage({
        type: 'success',
        text: isAm ? 'አቤቱታዎ ለሲስተም አስተዳዳሪ ተልኳል! አጣርተን መልስ እንሰጣለን።' : 'Dispute claim submitted successfully for admin review.'
      });
      setDisputeEmail('');
      setDisputeReason('');
      fetchReferralData();
      setTimeout(() => setShowDisputeModal(false), 2000);
    } catch (err: any) {
      setDisputeMessage({
        type: 'error',
        text: err.message || (isAm ? 'አቤቱታ ማቅረብ አልተቻለም።' : 'Failed to submit claim.')
      });
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-300">
      
      {/* ── Top Hero & Referral Link Section ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-8 md:p-12 text-white shadow-2xl border border-amber-500/20">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-500/30">
                <Sparkles size={14} />
                {isAm ? 'የሪፈራል እና የወሌት ፕሮግራም' : 'Referral & Wallet Program'}
              </div>
              <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white">
                {isAm ? 'ሰው ይጋብዙ፣ እስከ 100 ኮይን ያግኙ!' : 'Invite Friends, Earn Up to 100 Coins!'}
              </h2>
              <p className="max-w-2xl text-xs md:text-sm text-gray-300 leading-relaxed font-medium">
                {isAm
                  ? 'በእርስዎ ሪፈራል ሊንክ ለሚመዘገብ ለእያንዳንዱ ሰው በ3 ደረጃዎች እስከ 100 ኮይን በነፃ ያግኙ፦ Gold Verification (30 Coins) + Subscription Payment (30 Coins) + Mobile App Login (40 Coins)።'
                  : 'Earn up to 100 free coins for each friend who signs up using your referral link across 3 real-time milestones: Gold Verification (30 Coins) + Subscription (30 Coins) + Mobile App Login (40 Coins).'}
              </p>
            </div>

            {/* Quick Balance Counter */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/15 shrink-0 flex flex-col items-center justify-center min-w-[200px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 mb-1">
                {isAm ? 'ያለዎት የኮይን ሂሳብ' : 'Current Coin Balance'}
              </span>
              <div className="flex items-center gap-2 text-3xl font-black text-amber-400">
                <Coins size={28} className="text-amber-400 fill-amber-400/30" />
                <span className="tabular-nums">{coinBalance.toLocaleString()}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold mt-1">
                {isAm ? `≈ ETB ${netEtb.toLocaleString()} Net Payout` : `≈ ETB ${netEtb.toLocaleString()} Net Cash`}
              </span>
            </div>
          </div>

          {/* Referral Link Copy Bar */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl w-full sm:w-auto font-mono text-xs text-amber-300 shrink-0 font-bold">
              <span>{referralCode || 'BET-000000'}</span>
            </div>
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full bg-transparent px-3 text-xs text-white font-medium focus:outline-none select-all truncate"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? (isAm ? 'ተኮርጇል!' : 'Copied!') : (isAm ? 'ኮፒ አድርግ' : 'Copy Link')}</span>
              </button>
              <button
                onClick={handleShareLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-wider transition-all border border-white/20 active:scale-95"
              >
                <Share2 size={16} />
                <span>{isAm ? 'ሼር አድርግ' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reward Milestones Explanation Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
            1
          </div>
          <h4 className="text-sm font-black text-accent uppercase tracking-tight">
            {isAm ? '1. Gold Verification (30 Coins)' : '1. Gold Verification (30 Coins)'}
          </h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {isAm
              ? 'ተጋባዡ የ ID/Selfie ማረጋገጫ አልፎ Gold ደረጃ ሲደርስ አውቶማቲካሊ 30 ኮይን ያገኛሉ።'
              : 'Automatically credited when your referred friend completes Gold ID/Selfie verification.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-sm">
            2
          </div>
          <h4 className="text-sm font-black text-accent uppercase tracking-tight">
            {isAm ? '2. First Subscription (+30 Coins)' : '2. First Subscription (+30 Coins)'}
          </h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {isAm
              ? 'ተጋባዡ የመጀመሪያ አባልነቱን ሲከፍል አውቶማቲካሊ ተጨማሪ 30 ኮይን ያገኛሉ (ድምር 60)።'
              : 'Automatically credited when your referred friend completes their first plan payment (Total 60 Coins).'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
            3
          </div>
          <h4 className="text-sm font-black text-accent uppercase tracking-tight">
            {isAm ? '3. Mobile App Login (+40 Coins)' : '3. Mobile App Login (+40 Coins)'}
          </h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {isAm
              ? 'ተጋባዡ የሞባይል አፑን አውርዶ በዚያው ኢሜይል ሲገባ ተጨማሪ 40 ኮይን ያገኛሉ (ድምር 100 ኮይን)።'
              : 'Automatically credited when referee logs in via Mobile App (Total 100 Coins).'}
          </p>
        </div>
      </div>

      {/* ── Convert to Coins Info Banner (0% Fee) ───────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Coins size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-accent uppercase tracking-tight flex items-center gap-2">
              {isAm ? 'የሪፈራል ኮይኖችን ወደ አፕ አገልግሎት መቀየር (0% System Fee)' : 'Use Coins Inside App (0% System Fee)'}
              <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">100% FREE</span>
            </h4>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              {isAm
                ? 'ያገኟቸውን የሪፈራል ኮይኖች በአፑ ውስጥ ቻት ለማድረግ፣ ስጦታ ለመላክ እና ፕሮፋይል ለመክፈት ያለ ምንም ክፍያ 100% መጠቀም ይችላሉ።'
                : 'Referral rewards credited to your wallet carry 0% system fee when spent inside Beteseb for chats, gifts & unlocks.'}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
            {isAm ? 'ጠቅላላ በሪፈራል የተገኘ' : 'Total Referral Earnings'}
          </span>
          <div className="text-xl font-black text-amber-600 tabular-nums">
            {totalEarnedCoins.toLocaleString()} Coins
          </div>
        </div>
      </div>

      {/* ── Live Referred Users Status Table ───────────────────────────── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-primary" />
            <h3 className="text-lg font-black text-accent uppercase tracking-tight">
              {isAm ? 'በእርስዎ ሊንክ የመጡ አባላት ደረጃ' : 'Live Referred Users Status'}
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {referralsList.length} {isAm ? 'አባላት' : 'Users Referred'}
          </span>
        </div>

        {referralsList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-bold text-xs uppercase tracking-widest space-y-2">
            <Users size={36} className="mx-auto opacity-30" />
            <p>{isAm ? 'እስካሁን በእርስዎ ሊንክ የተመዘገበ ሰው የለም። ሊንክዎን ሼር ያድርጉ!' : 'No referred users yet. Share your link to start earning!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="pb-4">{isAm ? 'ተጠቃሚ' : 'User'}</th>
                  <th className="pb-4">{isAm ? 'የተመዘገበበት ቀን' : 'Joined Date'}</th>
                  <th className="pb-4">{isAm ? 'Gold Verification' : 'Gold Verified'}</th>
                  <th className="pb-4">{isAm ? 'Subscription' : 'Subscribed'}</th>
                  <th className="pb-4">{isAm ? 'Mobile App Active' : 'App Active'}</th>
                  <th className="pb-4 text-right">{isAm ? 'የተገኘ ኮይን' : 'Coins Earned'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {referralsList.map((ref) => {
                  const referee = ref.referee || {};
                  return (
                    <tr key={ref.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden relative border border-gray-200 shrink-0">
                          {referee.avatar_url ? (
                            <Image src={referee.avatar_url} alt="" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-gray-400">
                              {(referee.full_name || 'U')[0]}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-accent">{referee.full_name || 'User'}</span>
                      </td>
                      <td className="py-4 text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        {ref.gold_reward_given ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black">
                            <Check size={12} /> Gold (+30)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold">Pending</span>
                        )}
                      </td>
                      <td className="py-4">
                        {ref.sub_reward_given ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black">
                            <Check size={12} /> Subscribed (+30)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold">Pending</span>
                        )}
                      </td>
                      <td className="py-4">
                        {ref.app_reward_given ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black">
                            <Check size={12} /> App Active (+40)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold">Pending</span>
                        )}
                      </td>
                      <td className="py-4 text-right font-black text-amber-600 tabular-nums">
                        +{ref.total_coins_earned || 0} Coins
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Withdrawal Section (Bank Withdrawal Form) ───────────────────── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
          <div>
            <h3 className="text-lg font-black text-accent uppercase tracking-tight flex items-center gap-2">
              <Building2 size={20} className="text-emerald-600" />
              {isAm ? 'ወደ ባንክ ሂሳብ ገንዘብ ማውጫ ፎርም' : 'Bank Cash Withdrawal Form'}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {isAm ? 'ያሉዎትን ኮይኖች ወደ ኢትዮጵያ ብር (ETB) ቀይረው ወደ ባንክ አካውንትዎ ገቢ ያድርጉ።' : 'Convert earned coins into ETB cash transferred directly to your bank account.'}
            </p>
          </div>

          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-black border border-emerald-100 flex items-center gap-2">
            <Coins size={16} className="text-emerald-600" />
            <span>{isAm ? 'ዝቅተኛ ማውጫ፦ 10,000 ኮይን' : 'Min Withdrawal: 10,000 Coins'}</span>
          </div>
        </div>

        {withdrawalMessage && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${withdrawalMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertCircle size={16} />
            <span>{withdrawalMessage.text}</span>
          </div>
        )}

        {/* Balance Check Guard */}
        {coinBalance < 10000 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-accent tracking-wider">
                {isAm ? 'የገንዘብ ማውጫው አልተከፈተም' : 'Withdrawal Section Locked'}
              </h4>
              <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
                {isAm
                  ? `ለገንዘብ ማውጣት ቢያንስ 10,000 ኮይን ያስፈልጋል። በአሁኑ ሰዓት ${coinBalance.toLocaleString()} ኮይን አለዎት።`
                  : `You need at least 10,000 coins to initiate a cash withdrawal. Current balance: ${coinBalance.toLocaleString()} coins.`}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-1.5">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (coinBalance / 10000) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-gray-400">
                <span>{coinBalance.toLocaleString()} Coins</span>
                <span>10,000 Coins</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coins Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-accent uppercase tracking-wider">
                  {isAm ? 'የሚወጣው ኮይን መጠን (ቢያንስ 10,000)' : 'Coins Amount to Withdraw (Min 10,000)'}
                </label>
                <input
                  type="number"
                  min={10000}
                  max={coinBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Math.max(10000, Number(e.target.value)))}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-border font-black text-accent focus:outline-none focus:border-emerald-500 transition-all text-sm"
                />
              </div>

              {/* Bank Selection Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-black text-accent uppercase tracking-wider">
                  {isAm ? 'ባንክ / የሞባይል ባንኪንግ ይምረጡ' : 'Select Bank / Mobile Money Option'}
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-border font-bold text-accent focus:outline-none focus:border-emerald-500 transition-all text-xs"
                >
                  {ethiopianBanks.map((bank) => (
                    <option key={bank.id} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <label className="text-xs font-black text-accent uppercase tracking-wider">
                  {isAm ? 'የባንክ ሂሳብ (አካውንት) ቁጥር' : 'Bank Account Number'}
                </label>
                <input
                  type="text"
                  placeholder="1000XXXXXXXXX"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-border font-bold text-accent focus:outline-none focus:border-emerald-500 transition-all text-xs"
                />
              </div>

              {/* Account Holder Name */}
              <div className="space-y-2">
                <label className="text-xs font-black text-accent uppercase tracking-wider">
                  {isAm ? 'የባንክ አካውንቱ ባለቤት ሙሉ ስም' : 'Bank Account Holder Full Name'}
                </label>
                <input
                  type="text"
                  placeholder="Abebe Bikila"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-border font-bold text-accent focus:outline-none focus:border-emerald-500 transition-all text-xs"
                />
              </div>
            </div>

            {/* Dynamic Calculation Box */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 border border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold border-b border-white/10 pb-3">
                <span className="text-gray-400">{isAm ? 'ጠቅላላ የብር ስሌት (Gross ETB Value):' : 'Gross Calculated ETB Value:'}</span>
                <span className="text-white font-mono text-sm">ETB {grossEtb.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-white/10 pb-3 text-red-400">
                <span>{isAm ? 'የሲስተም ክፍያ (30% System Fee):' : 'System Fee Deduction (30%):'}</span>
                <span className="font-mono">- ETB {feeEtb.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                    {isAm ? 'ወደ ባንክ የሚከፈለው የተጣራ ገንዘብ (70% Net Payout):' : 'Net Cash Payout (70%):'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {isAm ? 'በአድሚን የውዝድሮው ተመን መሰረት የተሰላ' : 'Calculated at dynamic admin rate'}
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  ETB {netEtb.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingWithdrawal}
              className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmittingWithdrawal ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isAm ? 'በማስገባት ላይ...' : 'Submitting Request...'}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{isAm ? 'የውዝድሮው ጥያቄ ያስገቡ' : 'Submit Withdrawal Request'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Withdrawal History */}
        {withdrawalsList.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase text-accent tracking-wider">
              {isAm ? 'ያለፉ የውዝድሮው ጥያቄዎች ታሪክ' : 'Withdrawal Request History'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-3">{isAm ? 'ቀን' : 'Date'}</th>
                    <th className="pb-3">{isAm ? 'ባንክ' : 'Bank'}</th>
                    <th className="pb-3">{isAm ? 'የወጣ ኮይን' : 'Coins'}</th>
                    <th className="pb-3">{isAm ? 'የተጣራ ክፍያ (70%)' : 'Net Payout (70%)'}</th>
                    <th className="pb-3">{isAm ? 'ሁኔታ' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {withdrawalsList.map((req) => (
                    <tr key={req.id}>
                      <td className="py-3 text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-bold text-accent">{req.bank_name} ({req.account_number})</td>
                      <td className="py-3 font-bold text-amber-600">{Number(req.coins_amount).toLocaleString()}</td>
                      <td className="py-3 font-black text-emerald-600 font-mono">ETB {Number(req.net_etb).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Dispute / Claim Support Section ────────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
            <HelpCircle size={20} className="text-amber-400" />
            {isAm ? 'ያልተቆጠሩ ሪፈራሎች አሉዎት? (Claim Support)' : 'Missing Referral Coins? (Claim Support)'}
          </h3>
          <p className="text-xs text-gray-400 font-medium max-w-xl">
            {isAm
              ? 'በሲስተም መዘግየት ወይም ክፍተት ምክንያት ሳይቆጠሩ የቀሩ ሪፈራሎች ካሉዎት፣ የአቤቱታ ፎርሙን በመሙላት ለአስተዳዳሪ ልከው በ24 ሰዓት ውስጥ ማስቆጠር ይችላሉ።'
              : 'If any of your referred friends were not properly credited due to system delays, submit a claim support ticket for manual verification.'}
          </p>
        </div>

        <button
          onClick={() => setShowDisputeModal(true)}
          className="px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
        >
          {isAm ? 'አቤቱታ አቅርብ (Claim Support)' : 'Submit Dispute Claim'}
        </button>
      </div>

      {/* ── Claim Support Modal ─────────────────────────────────────────── */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-base font-black text-accent uppercase tracking-tight">
                {isAm ? 'ያልተቆጠሩ ሪፈራሎች አቤቱታ ማቅረቢያ' : 'Submit Missing Referral Claim'}
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {disputeMessage && (
              <div className={`p-4 rounded-2xl text-xs font-bold ${disputeMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {disputeMessage.text}
              </div>
            )}

            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-accent uppercase tracking-wider">
                  {isAm ? 'የተጋባዡ ኢሜይል' : 'Referee Registered Email'}
                </label>
                <input
                  type="email"
                  placeholder="friend@gmail.com"
                  value={disputeEmail}
                  onChange={(e) => setDisputeEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-border font-bold text-accent text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-accent uppercase tracking-wider">
                  {isAm ? 'የአቤቱታው ዝርዝር ምክንያት' : 'Claim Details & Reason'}
                </label>
                <textarea
                  rows={4}
                  placeholder={isAm ? 'ተጋባዡ በኔ ሊንክ ተመዝግቦ Gold Verification አጠናቋል ነገር ግን 30 ኮይኑ አልተቆጠረልኝም...' : 'Explain claim details...'}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-border font-bold text-accent text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingDispute}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmittingDispute ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>{isAm ? 'አቤቱታውን ላክ' : 'Send Claim Ticket'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
