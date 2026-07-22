'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Gift,
  Coins,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  DollarSign,
  Users,
  ShieldCheck,
  HelpCircle,
  Send,
  Loader2,
  RefreshCw,
  Award,
  ArrowUpRight
} from 'lucide-react';

export default function ReferralWithdrawalManagement() {
  const [loading, setLoading] = useState(true);
  const [exchangeRateInput, setExchangeRateInput] = useState<number>(500); // 10,000 coins = X ETB
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateNotice, setRateNotice] = useState<string | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalRegistrations: 0,
    goldUsers: 0,
    subscribedUsers: 0,
    appActiveUsers: 0,
    totalCoinsIssued: 0,
    totalApprovedPayoutsEtb: 0,
    pendingPayoutsEtb: 0
  });

  // Data lists
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Modal / Action states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAdminReferralData();
  }, []);

  const fetchAdminReferralData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Dynamic Exchange Rate
      const { data: setRes } = await supabase.from('settings').select('cms_content').limit(1).single();
      if (setRes?.cms_content?.coin_exchange_rate_etb) {
        setExchangeRateInput(Number(setRes.cms_content.coin_exchange_rate_etb));
      }

      // 2. Fetch Referrals & Metrics
      const { data: allRefs } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles!referrals_referrer_id_fkey(full_name, email, avatar_url),
          referee:profiles!referrals_referee_id_fkey(full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (allRefs) {
        const totalReg = allRefs.length;
        const goldCount = allRefs.filter((r) => r.gold_reward_given).length;
        const subCount = allRefs.filter((r) => r.sub_reward_given).length;
        const appCount = allRefs.filter((r) => r.app_reward_given).length;
        const totalCoins = allRefs.reduce((acc, r) => acc + Number(r.total_coins_earned || 0), 0);

        setMetrics((prev) => ({
          ...prev,
          totalRegistrations: totalReg,
          goldUsers: goldCount,
          subscribedUsers: subCount,
          appActiveUsers: appCount,
          totalCoinsIssued: totalCoins
        }));

        // Group by Referrer for Leaderboard
        const referrerMap: Record<string, { referrer: any; totalRefs: number; totalCoins: number }> = {};
        allRefs.forEach((r) => {
          const rId = r.referrer_id;
          if (!referrerMap[rId]) {
            referrerMap[rId] = {
              referrer: r.referrer || { full_name: 'Unknown User' },
              totalRefs: 0,
              totalCoins: 0
            };
          }
          referrerMap[rId].totalRefs += 1;
          referrerMap[rId].totalCoins += Number(r.total_coins_earned || 0);
        });

        const leaderboard = Object.values(referrerMap).sort((a, b) => b.totalCoins - a.totalCoins);
        setTopReferrers(leaderboard.slice(0, 10));
      }

      // 3. Fetch Withdrawal Requests
      const { data: withdrawData } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:profiles(full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (withdrawData) {
        setWithdrawals(withdrawData);
        const approvedSum = withdrawData
          .filter((w) => w.status === 'approved')
          .reduce((acc, w) => acc + Number(w.net_etb || 0), 0);
        const pendingSum = withdrawData
          .filter((w) => w.status === 'pending')
          .reduce((acc, w) => acc + Number(w.net_etb || 0), 0);

        setMetrics((prev) => ({
          ...prev,
          totalApprovedPayoutsEtb: approvedSum,
          pendingPayoutsEtb: pendingSum
        }));
      }

      // 4. Fetch Disputes
      const { data: disputesData } = await supabase
        .from('referral_disputes')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (disputesData) setDisputes(disputesData);
    } catch (err) {
      console.error('Error fetching admin referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRate = async () => {
    setIsSavingRate(true);
    setRateNotice(null);
    try {
      const res = await fetch('/api/admin/referrals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_exchange_rate',
          rateEtb: exchangeRateInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rate');
      setRateNotice(`Exchange rate updated: 10,000 Coins = ${exchangeRateInput} ETB`);
    } catch (err: any) {
      setRateNotice(err.message || 'Failed to update rate');
    } finally {
      setIsSavingRate(false);
    }
  };

  const handleWithdrawalAction = async (actionType: 'approve_withdrawal' | 'reject_withdrawal', reqId: string) => {
    setIsProcessingAction(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/referrals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          requestId: reqId,
          reason: actionReason,
          proofUrl: proofUrlInput
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setActionMessage({
        type: 'success',
        text: actionType === 'approve_withdrawal' ? 'Withdrawal request approved!' : 'Withdrawal rejected and coins refunded.'
      });

      setSelectedWithdrawal(null);
      setActionReason('');
      setProofUrlInput('');
      fetchAdminReferralData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDisputeAction = async (actionType: 'resolve_dispute' | 'reject_dispute', disputeId: string) => {
    setIsProcessingAction(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/referrals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          disputeId,
          reason: actionReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setActionMessage({
        type: 'success',
        text: actionType === 'resolve_dispute' ? 'Dispute resolved & referral coins credited!' : 'Dispute claim rejected.'
      });

      setActionReason('');
      fetchAdminReferralData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

  return (
    <div className="space-y-8 p-6 bg-slate-950 text-white rounded-3xl min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30 mb-2">
            <Gift size={14} /> Referral & Withdrawal Portal
          </div>
          <h2 className="text-2xl font-black italic tracking-tight text-white">
            Referral Analytics & Financial Management
          </h2>
        </div>

        <button
          onClick={fetchAdminReferralData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-gray-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${actionMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
          {actionMessage.text}
        </div>
      )}

      {/* ── 1. Top Metrics Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Referred Users</span>
          <div className="text-2xl font-black text-white">{metrics.totalRegistrations.toLocaleString()}</div>
          <span className="text-[10px] text-amber-400 font-bold block">{metrics.goldUsers} Gold Verified</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subscribed & App Active</span>
          <div className="text-2xl font-black text-emerald-400">{metrics.subscribedUsers} Subscribed</div>
          <span className="text-[10px] text-gray-400 font-bold block">{metrics.appActiveUsers} Mobile App Users</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Coins Issued</span>
          <div className="text-2xl font-black text-amber-400">{metrics.totalCoinsIssued.toLocaleString()} Coins</div>
          <span className="text-[10px] text-gray-400 font-bold block">≈ ETB {Math.round(metrics.totalCoinsIssued * (exchangeRateInput / 10000)).toLocaleString()} Value</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Net Cash Paid Out</span>
          <div className="text-2xl font-black text-emerald-400">ETB {metrics.totalApprovedPayoutsEtb.toLocaleString()}</div>
          <span className="text-[10px] text-amber-400 font-bold block">Pending: ETB {metrics.pendingPayoutsEtb.toLocaleString()}</span>
        </div>
      </div>

      {/* ── 2. Dynamic Exchange Rate Config ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <DollarSign size={16} /> Dynamic Coin Exchange Rate Configuration
          </h3>
          {rateNotice && <span className="text-xs font-bold text-emerald-400">{rateNotice}</span>}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              ETB Payout Rate for 10,000 Coins (Dynamic Exchange Rate)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={exchangeRateInput}
                onChange={(e) => setExchangeRateInput(Number(e.target.value))}
                className="px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono font-black text-white text-sm focus:outline-none focus:border-amber-500 w-48"
              />
              <span className="text-xs text-gray-400 font-bold">ETB per 10,000 Coins (Default 500 ETB)</span>
            </div>
          </div>

          <button
            onClick={handleSaveRate}
            disabled={isSavingRate}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
          >
            {isSavingRate ? 'Saving...' : 'Save Exchange Rate'}
          </button>
        </div>
      </div>

      {/* ── 3. Top Referrers Leaderboard ───────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Award size={18} className="text-amber-400" /> Top Referrers Leaderboard
        </h3>

        {topReferrers.length === 0 ? (
          <p className="text-xs text-gray-500 font-bold py-4 text-center">No referrers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Referrer</th>
                  <th className="pb-3">Total Referred Users</th>
                  <th className="pb-3 text-right">Total Coins Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {topReferrers.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="py-3 font-black text-amber-400">#{idx + 1}</td>
                    <td className="py-3 font-bold text-white">
                      {item.referrer?.full_name || 'User'} ({item.referrer?.email || 'N/A'})
                    </td>
                    <td className="py-3 text-gray-300 font-bold">{item.totalRefs} Users</td>
                    <td className="py-3 text-right font-black text-amber-400 font-mono">
                      +{item.totalCoins.toLocaleString()} Coins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. Withdrawal Requests Management Table ─────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Building2 size={18} className="text-emerald-400" /> Withdrawal Requests (10,000+ Coins)
          </h3>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setWithdrawalFilter(st)}
                className={`px-3 py-1.5 rounded-xl uppercase text-[10px] transition-all ${
                  withdrawalFilter === st ? 'bg-amber-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <p className="text-xs text-gray-500 font-bold py-8 text-center">No withdrawal requests found for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Bank Details</th>
                  <th className="pb-3">Coins</th>
                  <th className="pb-3">Gross ETB</th>
                  <th className="pb-3 text-red-400">30% Fee</th>
                  <th className="pb-3 text-emerald-400">70% Net Payout</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium text-gray-300">
                {filteredWithdrawals.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-850">
                    <td className="py-3 font-bold text-white">
                      {req.user?.full_name || 'User'} <span className="text-gray-500 font-normal block text-[10px]">{req.user?.email}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-white">{req.bank_name}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">Acc: {req.account_number} ({req.account_name})</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">{Number(req.coins_amount).toLocaleString()}</td>
                    <td className="py-3 font-mono">ETB {Number(req.gross_etb).toLocaleString()}</td>
                    <td className="py-3 font-mono text-red-400">- ETB {Number(req.fee_etb).toLocaleString()}</td>
                    <td className="py-3 font-mono font-black text-emerald-400">ETB {Number(req.net_etb).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                        req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        req.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleWithdrawalAction('approve_withdrawal', req.id)}
                            disabled={isProcessingAction}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction('reject_withdrawal', req.id)}
                            disabled={isProcessingAction}
                            className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider transition-all"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-bold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Manual Dispute & Verification Fix Section ─────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
          <HelpCircle size={18} className="text-amber-400" /> Manual Dispute Claims & Referral Rewards Fix
        </h3>

        {disputes.length === 0 ? (
          <p className="text-xs text-gray-500 font-bold py-4 text-center">No active referral claim tickets.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="pb-3">Claimant</th>
                  <th className="pb-3">Referee Email</th>
                  <th className="pb-3">Reason / Details</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium text-gray-300">
                {disputes.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-850">
                    <td className="py-3 font-bold text-white">
                      {disp.user?.full_name || 'User'} <span className="text-gray-500 block text-[10px]">{disp.user?.email}</span>
                    </td>
                    <td className="py-3 font-mono text-amber-300">{disp.referee_email}</td>
                    <td className="py-3 max-w-xs text-gray-400 truncate">{disp.claim_reason}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                        disp.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        disp.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {disp.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {disp.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDisputeAction('resolve_dispute', disp.id)}
                            disabled={isProcessingAction}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all"
                          >
                            Approve & Credit
                          </button>
                          <button
                            onClick={() => handleDisputeAction('reject_dispute', disp.id)}
                            disabled={isProcessingAction}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-wider transition-all"
                          >
                            Reject Claim
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-bold">{disp.admin_notes || 'Resolved'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
