'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Gift,
  Sparkles, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Smartphone, 
  Layers, 
  Users, 
  ShieldCheck, 
  Award, 
  ArrowUpRight,
  HelpCircle,
  TrendingUp,
  Sliders
} from 'lucide-react';

interface RewardSettings {
  id: string;
  total_budget: number;
  distributed_coins: number;
  remaining_coins: number;
  is_active: boolean;
  google_play_url: string;
  apple_store_url: string;
}

interface TierBreakdown {
  count: number;
  coins: number;
}

export default function RewardManagement() {
  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, TierBreakdown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [totalBudgetInput, setTotalBudgetInput] = useState<number>(10000);
  const [googlePlayInput, setGooglePlayInput] = useState<string>('');
  const [appleStoreInput, setAppleStoreInput] = useState<string>('');
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true);

  const fetchRewardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rewards');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setBreakdown(data.breakdown || {});
        setTotalBudgetInput(data.settings.total_budget || 10000);
        setGooglePlayInput(data.settings.google_play_url || '');
        setAppleStoreInput(data.settings.apple_store_url || '');
        setIsActiveInput(Boolean(data.settings.is_active));
      }
    } catch (err) {
      console.error('Failed to fetch reward settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudget: totalBudgetInput,
          googlePlayUrl: googlePlayInput,
          appleStoreUrl: appleStoreInput,
          isActive: isActiveInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setMsg({ type: 'success', text: 'የኮይን በጀት እና ሊንኮች መረጃ በተሳካ ሁኔታ ተዘምኗል! ✅' });
      } else {
        setMsg({ type: 'error', text: 'መረጃውን ማዘመን አልተቻለም፦ ' + (data.error || '') });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'ስህተት ተከስቷል፦ ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRunRetroactiveSync = async () => {
    if (!confirm('ለነባር/ቀደም ሲል ለተመዘገቡ ተጠቃሚዎች ሁሉ በደረሱበት ደረጃ መሰረት አውቶማቲክ ኮይን ገቢ ማድረግ ይፈልጋሉ?')) {
      return;
    }

    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/rewards/sync-existing', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: `በተሳካ ሁኔታ ተጠናቋል! ${data.processedCount} ተጠቃሚዎች ታይተዋል፤ ${data.totalCoinsDistributed} ኮይኖች ገቢ ሆነዋል። ${data.stoppedEarly ? '(የተመደበው በጀት ስላለቀ በራስ-ሰር ቆሟል)' : ''}`
        });
        fetchRewardData();
      } else {
        setMsg({ type: 'error', text: 'ተግባሩ አልተሳካም፦ ' + (data.error || '') });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'ስህተት ተከስቷል፦ ' + err.message });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-amber-400">
        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
        <span className="text-lg font-medium">የዌልካም እና ሪዋርድ መረጃዎችን በመጫን ላይ...</span>
      </div>
    );
  }

  const isAutoStopped = (settings?.remaining_coins || 0) <= 0 || !settings?.is_active;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl shadow-amber-950/20">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <Gift className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcoming & Reward Management
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            ሙሉ በሙሉ አውቶማቲክ የሆነ የኮይን ሽልማት እና የደረጃዎች መቆጣጠሪያ ስርዓት። በጀት ሲያልቅ ሲስተሙ በራስ-ሰር ይሰራል/ያቆማል።
          </p>
        </div>

        {/* System Status Indicator */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl self-start md:self-auto">
          <div className={`w-3.5 h-3.5 rounded-full ${isAutoStopped ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">የሲስተሙ ሁኔታ (Status)</div>
            <div className={`text-sm font-extrabold ${isAutoStopped ? 'text-red-400' : 'text-emerald-400'}`}>
              {isAutoStopped ? '🛑 ቆሟል (Auto-Stopped / No Budget)' : '⚡ ንቁ እና በራስ-ሰር የሚሰራ (Active)'}
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Real-time Budget Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Budget Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
            <Coins className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">የተመደበ ጠቅላላ በጀት</span>
          <div className="text-3xl font-black text-amber-400 mt-2 mb-1">
            {settings?.total_budget?.toLocaleString()} <span className="text-sm font-bold text-amber-500/80">ኮይን</span>
          </div>
          <span className="text-xs text-slate-500">ለ ዌልካም እና ሪዋርድ የተመደበ</span>
        </div>

        {/* Distributed Coins Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
            <TrendingUp className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">የወጣ/የተከፋፈለ ኮይን</span>
          <div className="text-3xl font-black text-blue-400 mt-2 mb-1">
            {settings?.distributed_coins?.toLocaleString()} <span className="text-sm font-bold text-blue-500/80">ኮይን</span>
          </div>
          <span className="text-xs text-slate-500">ለተጠቃሚዎች ገቢ የተደረገ</span>
        </div>

        {/* Remaining Coins Card */}
        <div className={`bg-slate-900/90 border rounded-3xl p-6 relative overflow-hidden group ${isAutoStopped ? 'border-red-500/40 bg-red-950/10' : 'border-emerald-500/30'}`}>
          <div className="absolute top-0 right-0 p-6 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <Sparkles className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">የቀረ በጀት (Real-Time)</span>
          <div className={`text-3xl font-black mt-2 mb-1 ${isAutoStopped ? 'text-red-400' : 'text-emerald-400'}`}>
            {settings?.remaining_coins?.toLocaleString()} <span className="text-sm font-bold opacity-80">ኮይን</span>
          </div>
          <span className="text-xs text-slate-500">በራስ-ሰር ለመስጠት የቀረ</span>
        </div>
      </div>

      {/* Configuration & App Store Links Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Sliders className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-extrabold text-white">የበጀት እና የአፕሊኬሽን ሊንክ መቆጣጠሪያ</h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Budget Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                የተመደበ በጀት መጠን (Coins)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={totalBudgetInput}
                  onChange={(e) => setTotalBudgetInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl py-3.5 pl-4 pr-12 text-white font-bold text-base focus:outline-none transition-colors"
                  required
                />
                <div className="absolute right-4 top-3.5 text-amber-400 font-bold text-sm">
                  ኮይን
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                ነባሪ በጀት 10,000 ኮይን ነው። ይህ ሲያልቅ አዲስ ተጠቃሚ ሲመዘገብ ኮይን መስጠቱ ያቆማል።
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                የሲስተም አውቶማቲክ አገልግሎት ሁኔታ
              </label>
              <button
                type="button"
                onClick={() => setIsActiveInput(!isActiveInput)}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm border flex items-center justify-between transition-colors ${isActiveInput ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-red-950/40 border-red-500/50 text-red-300'}`}
              >
                <span>{isActiveInput ? '✅ አውቶማቲክ ሲስተም ክፍት ነው (Enabled)' : '🛑 አውቶማቲክ ሲስተም ተዘግቷል (Disabled)'}</span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isActiveInput ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActiveInput ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            {/* Google Play Link */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Google Play Store Link</span>
              </label>
              <input
                type="url"
                value={googlePlayInput}
                onChange={(e) => setGooglePlayInput(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=com.beteseb.app"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Apple App Store Link */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>Apple App Store Link</span>
              </label>
              <input
                type="url"
                value={appleStoreInput}
                onChange={(e) => setAppleStoreInput(e.target.value)}
                placeholder="https://apps.apple.com/app/beteseb/id123456789"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>ማስተካከያዎችን አስቀምጥ (Save Settings)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tier Distribution Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">የደረጃዎች (Tiers) ኮይን አሰጣጥ ስታቲስቲክስ</h2>
          </div>

          {/* Retroactive Sync Button for Existing Users */}
          <button
            onClick={handleRunRetroactiveSync}
            disabled={syncing || isAutoStopped}
            className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>አሮጌ/ነባር ተጠቃሚዎችን አውቶማቲክ ኮይን ስጥ (Run Retroactive Rewards)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Bronze */}
          <div className="bg-slate-950/80 border border-amber-800/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-amber-400 text-sm">1. Bronze (Sign Up)</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full">+5 Coins</span>
            </div>
            <div className="text-2xl font-black text-white">
              {breakdown.bronze?.count || 0} <span className="text-xs font-normal text-slate-400">ተጠቃሚዎች</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ወጣ: {breakdown.bronze?.coins || 0} ኮይን
            </div>
          </div>

          {/* Silver */}
          <div className="bg-slate-950/80 border border-slate-700/60 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-300 text-sm">2. Silver (Onboarding)</span>
              <span className="px-2 py-0.5 bg-slate-500/20 text-slate-300 font-bold text-xs rounded-full">+10 Coins</span>
            </div>
            <div className="text-2xl font-black text-white">
              {breakdown.silver?.count || 0} <span className="text-xs font-normal text-slate-400">ተጠቃሚዎች</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ወጣ: {breakdown.silver?.coins || 0} ኮይን
            </div>
          </div>

          {/* Gold */}
          <div className="bg-slate-950/80 border border-yellow-500/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-yellow-400 text-sm">3. Gold (ID Verified)</span>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 font-bold text-xs rounded-full">+15 Coins</span>
            </div>
            <div className="text-2xl font-black text-white">
              {breakdown.gold?.count || 0} <span className="text-xs font-normal text-slate-400">ተጠቃሚዎች</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ወጣ: {breakdown.gold?.coins || 0} ኮይን
            </div>
          </div>

          {/* Platinum */}
          <div className="bg-slate-950/80 border border-slate-400/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-200 text-sm">4. Platinum (App Download)</span>
              <span className="px-2 py-0.5 bg-slate-400/20 text-slate-200 font-bold text-xs rounded-full">+20 Coins</span>
            </div>
            <div className="text-2xl font-black text-white">
              {breakdown.platinum?.count || 0} <span className="text-xs font-normal text-slate-400">ተጠቃሚዎች</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ወጣ: {breakdown.platinum?.coins || 0} ኮይን
            </div>
          </div>

          {/* Diamond */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-cyan-300 text-sm">5. Diamond (Tier Upgrade)</span>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold text-xs rounded-full">+30 Coins</span>
            </div>
            <div className="text-2xl font-black text-white">
              {breakdown.diamond?.count || 0} <span className="text-xs font-normal text-slate-400">ተጠቃሚዎች</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ወጣ: {breakdown.diamond?.coins || 0} ኮይን
            </div>
          </div>

          {/* VIP */}
          <div className="bg-slate-950/80 border border-purple-500/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-purple-300 text-sm">6. VIP (Subscription)</span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-full">+70 Coins</span>
            </div>
            <div className="text-2xl font-black text-white">
              {breakdown.vip?.count || 0} <span className="text-xs font-normal text-slate-400">ተጠቃሚዎች</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ወጣ: {breakdown.vip?.coins || 0} ኮይን
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
