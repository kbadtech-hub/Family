'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserTier, TrustTier } from '@/lib/tiers';
import {
  Users,
  ShieldCheck,
  Globe,
  Award,
  TrendingUp,
  UserPlus,
  FileCheck,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Sparkles,
  Crown,
  PieChart,
  ChevronRight
} from 'lucide-react';

interface UserProfileAnalytics {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  onboarding_step: number;
  onboarding_completed: boolean;
  is_verified: boolean;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  premium_until?: string | null;
  is_vip_member?: boolean;
  location?: any;
  created_at: string;
  has_vouched?: boolean;
}

export default function UserAnalytics() {
  const [profiles, setProfiles] = useState<UserProfileAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();

    // Live WebSockets Real-Time Channel for instant user onboarding & KYC updates
    const channel = supabase
      .channel('user-analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchAnalyticsData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => {
        fetchAnalyticsData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vouch_records' }, () => {
        fetchAnalyticsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // 1. Attempt to fetch via Service Role API endpoint (bypasses RLS)
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        if (json.profiles && Array.isArray(json.profiles)) {
          const vouchedUserIds = new Set(json.vouchedUserIds || []);
          const enrichedProfiles: UserProfileAnalytics[] = json.profiles.map((p: any) => ({
            ...p,
            has_vouched: vouchedUserIds.has(p.id)
          }));
          setProfiles(enrichedProfiles);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to direct client-side Supabase query
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: vouches } = await supabase
        .from('vouch_records')
        .select('user_id');

      const vouchedUserIds = new Set((vouches || []).map((v: any) => v.user_id));

      const enrichedProfiles: UserProfileAnalytics[] = (profs || []).map((p: any) => ({
        ...p,
        has_vouched: vouchedUserIds.has(p.id)
      }));

      setProfiles(enrichedProfiles);
    } catch (err) {
      console.error('Error fetching user analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalUsers = profiles.length;

    let silverCount = 0;
    let goldCount = 0;
    let platinumCount = 0;
    let diamondCount = 0;
    let vipCount = 0;

    let totalRegisteredOnly = 0; // onboarding_completed === false
    let onboardingCompleted = 0; // onboarding_completed === true
    let idSubmitted = 0; // verification_status === 'pending'
    let fullyVerified = 0; // verification_status === 'verified'

    let domesticCount = 0; // In Ethiopia
    let diasporaCount = 0; // Outside Ethiopia
    const countryCounts: Record<string, number> = {};

    profiles.forEach((p) => {
      // 1. Tiers Breakdown
      const tier = getUserTier(p as any, Boolean(p.has_vouched));
      if (tier === 'silver') silverCount++;
      if (tier === 'gold') goldCount++;
      if (tier === 'platinum') platinumCount++;
      if (tier === 'diamond') diamondCount++;
      if (p.is_vip_member) vipCount++;

      // 2. Onboarding & KYC Funnel
      if (!p.onboarding_completed) {
        totalRegisteredOnly++;
      } else {
        onboardingCompleted++;
      }

      if (p.verification_status === 'pending') {
        idSubmitted++;
      } else if (p.verification_status === 'verified') {
        fullyVerified++;
      }

      // 3. Location & Country Breakdown
      let country = '';
      if (p.location) {
        const loc = typeof p.location === 'string' ? JSON.parse(p.location) : p.location;
        country = loc?.country || loc?.country_code || '';
      }

      const isEth = !country || country.toLowerCase() === 'ethiopia' || country.toLowerCase() === 'et';
      if (isEth) {
        domesticCount++;
        countryCounts['Ethiopia'] = (countryCounts['Ethiopia'] || 0) + 1;
      } else {
        diasporaCount++;
        const normalizedCountry = country.charAt(0).toUpperCase() + country.slice(1);
        countryCounts[normalizedCountry] = (countryCounts[normalizedCountry] || 0) + 1;
      }
    });

    const sortedCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count, percentage: Math.round((count / Math.max(1, totalUsers)) * 100) }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUsers,
      silverCount,
      goldCount,
      platinumCount,
      diamondCount,
      vipCount,
      totalRegisteredOnly,
      onboardingCompleted,
      idSubmitted,
      fullyVerified,
      domesticCount,
      diasporaCount,
      sortedCountries
    };
  }, [profiles]);

  // Filtered dataset for table
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.id.toLowerCase().includes(query) ||
        (p.full_name && p.full_name.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.phone && p.phone.toLowerCase().includes(query));

      const tier = getUserTier(p as any, Boolean(p.has_vouched));
      const matchesTier =
        tierFilter === 'all' ||
        (tierFilter === 'vip' ? p.is_vip_member : tier === tierFilter);

      const matchesKyc =
        kycFilter === 'all' ||
        (kycFilter === 'registered' && !p.onboarding_completed) ||
        (kycFilter === 'onboarded' && p.onboarding_completed) ||
        (kycFilter === 'pending_kyc' && p.verification_status === 'pending') ||
        (kycFilter === 'verified' && p.verification_status === 'verified');

      let country = '';
      if (p.location) {
        const loc = typeof p.location === 'string' ? JSON.parse(p.location) : p.location;
        country = loc?.country || '';
      }
      const isEth = !country || country.toLowerCase() === 'ethiopia' || country.toLowerCase() === 'et';
      const matchesLocation =
        locationFilter === 'all' ||
        (locationFilter === 'domestic' && isEth) ||
        (locationFilter === 'diaspora' && !isEth);

      return matchesSearch && matchesTier && matchesKyc && matchesLocation;
    });
  }, [profiles, searchQuery, tierFilter, kycFilter, locationFilter]);

  const renderTierBadge = (profile: UserProfileAnalytics) => {
    const tier = getUserTier(profile as any, Boolean(profile.has_vouched));
    if (profile.is_vip_member) {
      return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">👑 VIP Tier</span>;
    }
    switch (tier) {
      case 'diamond':
        return <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">💎 Diamond</span>;
      case 'platinum':
        return <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🛡️ Platinum</span>;
      case 'gold':
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🥇 Gold</span>;
      case 'silver':
        return <span className="px-3 py-1 bg-slate-400/10 text-slate-300 border border-slate-400/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🥈 Silver</span>;
      default:
        return <span className="px-3 py-1 bg-amber-800/10 text-amber-600 border border-amber-800/20 rounded-full text-[10px] font-bold uppercase">🥉 Bronze</span>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black italic tracking-tight text-accent">ገፅ ሁለት፡ የተጠቃሚዎች እና ኦንቦርዲንግ አናሊቲክስ</h2>
            <p className="text-xs text-gray-400 font-medium">User Tiers (Silver to Diamond/VIP), Onboarding/KYC Funnel & Geographic Diaspora Distribution</p>
          </div>
        </div>

        <button
          onClick={fetchAnalyticsData}
          className="px-5 py-3 bg-card hover:bg-white/10 border border-border text-foreground rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
        </button>
      </header>

      {/* SECTION 1: User Tiers & Levels Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Award className="text-primary" size={24} />
          <h3 className="text-xl font-bold uppercase tracking-wider text-accent">1. የተጠቃሚዎች ደረጃ (User Tiers & Levels Breakdown)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Silver Level */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Silver Level</span>
              <span className="text-xl">🥈</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.silverCount}</h4>
            <p className="text-[11px] text-gray-400 font-bold mt-1">
              {Math.round((metrics.silverCount / Math.max(1, metrics.totalUsers)) * 100)}% of total users
            </p>
            <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-slate-300 h-full rounded-full" style={{ width: `${Math.round((metrics.silverCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
            </div>
          </div>

          {/* Gold Level */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Gold Level</span>
              <span className="text-xl">🥇</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.goldCount}</h4>
            <p className="text-[11px] text-yellow-400 font-bold mt-1">
              {Math.round((metrics.goldCount / Math.max(1, metrics.totalUsers)) * 100)}% ID Verified
            </p>
            <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${Math.round((metrics.goldCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
            </div>
          </div>

          {/* Platinum Level */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Platinum Level</span>
              <span className="text-xl">🛡️</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.platinumCount}</h4>
            <p className="text-[11px] text-indigo-400 font-bold mt-1">
              {Math.round((metrics.platinumCount / Math.max(1, metrics.totalUsers)) * 100)}% Verified + Vouched
            </p>
            <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.round((metrics.platinumCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
            </div>
          </div>

          {/* Diamond Level */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Diamond Level</span>
              <span className="text-xl">💎</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.diamondCount}</h4>
            <p className="text-[11px] text-cyan-400 font-bold mt-1">
              {Math.round((metrics.diamondCount / Math.max(1, metrics.totalUsers)) * 100)}% Premium Members
            </p>
            <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.round((metrics.diamondCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
            </div>
          </div>

          {/* VIP Level */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">VIP Level</span>
              <span className="text-xl">👑</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.vipCount}</h4>
            <p className="text-[11px] text-amber-400 font-bold mt-1">
              {Math.round((metrics.vipCount / Math.max(1, metrics.totalUsers)) * 100)}% Exclusive VIP
            </p>
            <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.round((metrics.vipCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Onboarding & KYC Verification Funnel */}
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary" size={24} />
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-accent">2. የምዝገባ እና የኦንቦርዲንግ ሁኔታ (Onboarding & KYC Funnel)</h3>
            <p className="text-xs text-gray-400 font-medium">Conversion pipeline from initial registration to admin identity approval</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1: Registered */}
          <div className="p-6 bg-background rounded-3xl border border-border space-y-2 relative">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span>Stage 1</span>
              <span>Account Opened</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.totalUsers}</h4>
            <p className="text-xs text-gray-400 font-bold">Total Registered Users</p>
            <div className="text-[10px] text-amber-400 font-extrabold mt-2">
              {metrics.totalRegisteredOnly} users in incomplete onboarding
            </div>
          </div>

          {/* Step 2: Onboarding Completed */}
          <div className="p-6 bg-background rounded-3xl border border-border space-y-2 relative">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-primary">
              <span>Stage 2</span>
              <span>Profile Complete</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.onboardingCompleted}</h4>
            <p className="text-xs text-primary font-bold">Onboarding Completed</p>
            <div className="text-[10px] text-gray-400 font-extrabold mt-2">
              {Math.round((metrics.onboardingCompleted / Math.max(1, metrics.totalUsers)) * 100)}% Onboarding conversion
            </div>
          </div>

          {/* Step 3: ID & Selfie Submitted */}
          <div className="p-6 bg-background rounded-3xl border border-border space-y-2 relative">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-yellow-400">
              <span>Stage 3</span>
              <span>KYC Submitted</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.idSubmitted}</h4>
            <p className="text-xs text-yellow-400 font-bold">ID & Selfie Submitted</p>
            <div className="text-[10px] text-yellow-400 font-extrabold mt-2">
              Pending Admin Review
            </div>
          </div>

          {/* Step 4: Fully Verified */}
          <div className="p-6 bg-background rounded-3xl border border-emerald-800/30 space-y-2 relative">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-emerald-400">
              <span>Stage 4</span>
              <span>Verified Member</span>
            </div>
            <h4 className="text-3xl font-black text-foreground">{metrics.fullyVerified}</h4>
            <p className="text-xs text-emerald-400 font-bold">Fully Verified Users</p>
            <div className="text-[10px] text-emerald-400 font-extrabold mt-2">
              {Math.round((metrics.fullyVerified / Math.max(1, metrics.totalUsers)) * 100)}% Fully Verified Ratio
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Geographic & Country Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Domestic vs Diaspora Overview */}
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="text-primary" size={24} />
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-accent">3. የጂኦግራፊ አናሊሲስ (Location Split)</h3>
              <p className="text-xs text-gray-400 font-medium">Domestic Ethiopia vs Foreign Diaspora</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Domestic */}
            <div className="p-6 bg-background rounded-3xl border border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">🇪🇹 የሀገር ውስጥ (Domestic)</span>
                <span className="text-xs font-black text-foreground">{metrics.domesticCount} users</span>
              </div>
              <div className="w-full bg-card rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.round((metrics.domesticCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 text-right font-bold">
                {Math.round((metrics.domesticCount / Math.max(1, metrics.totalUsers)) * 100)}% of total platform users
              </p>
            </div>

            {/* Diaspora */}
            <div className="p-6 bg-background rounded-3xl border border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-sky-400 tracking-wider">🌍 የውጭ ሀገር (Diaspora)</span>
                <span className="text-xs font-black text-foreground">{metrics.diasporaCount} users</span>
              </div>
              <div className="w-full bg-card rounded-full h-3 overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.round((metrics.diasporaCount / Math.max(1, metrics.totalUsers)) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 text-right font-bold">
                {Math.round((metrics.diasporaCount / Math.max(1, metrics.totalUsers)) * 100)}% of total platform users
              </p>
            </div>
          </div>
        </div>

        {/* Diaspora Country Breakdown Table */}
        <div className="lg:col-span-2 bg-card p-8 rounded-[3rem] border border-border shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-accent">Diaspora Country Breakdown</h3>
              <p className="text-xs text-gray-400 font-medium">Distribution across international countries</p>
            </div>
            <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-xs font-black uppercase">
              {metrics.sortedCountries.length} Countries Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  <th className="p-4">Country Name</th>
                  <th className="p-4">User Count</th>
                  <th className="p-4">Platform Share</th>
                  <th className="p-4 text-right">Distribution Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {metrics.sortedCountries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400 italic">No country data recorded yet.</td>
                  </tr>
                ) : (
                  metrics.sortedCountries.map(({ country, count, percentage }) => (
                    <tr key={country} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-foreground flex items-center gap-2">
                        <MapPin size={14} className="text-primary" /> {country}
                      </td>
                      <td className="p-4 font-black text-foreground">{count}</td>
                      <td className="p-4 text-gray-300 font-bold">{percentage}%</td>
                      <td className="p-4 text-right">
                        <div className="w-32 bg-background rounded-full h-2 ml-auto overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(5, percentage)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Records Table with Filters */}
      <div className="bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden space-y-4">
        <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-accent">User Membership & Onboarding Records</h3>
            <p className="text-xs text-gray-400 font-medium">Showing {filteredProfiles.length} of {profiles.length} total user accounts</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user..."
                className="pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
            >
              <option value="all">All Tiers</option>
              <option value="silver">Silver Tier</option>
              <option value="gold">Gold Tier</option>
              <option value="platinum">Platinum Tier</option>
              <option value="diamond">Diamond Tier</option>
              <option value="vip">VIP Member</option>
            </select>

            {/* KYC Filter */}
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
            >
              <option value="all">All Onboarding Statuses</option>
              <option value="registered">Registered Only</option>
              <option value="onboarded">Onboarding Completed</option>
              <option value="pending_kyc">ID Submitted (Pending)</option>
              <option value="verified">Fully Verified</option>
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
            >
              <option value="all">All Locations</option>
              <option value="domestic">Domestic (Ethiopia)</option>
              <option value="diaspora">Diaspora (Foreign)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <th className="p-5">User Profile</th>
                <th className="p-5">Tier Level</th>
                <th className="p-5">Onboarding Step</th>
                <th className="p-5">KYC Verification</th>
                <th className="p-5">Location</th>
                <th className="p-5">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-400 italic">Loading analytics records...</td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-400 italic">No user accounts found matching your filters.</td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  let locStr = 'Ethiopia 🇪🇹';
                  if (p.location) {
                    const loc = typeof p.location === 'string' ? JSON.parse(p.location) : p.location;
                    if (loc?.country && loc.country.toLowerCase() !== 'ethiopia') {
                      locStr = `${loc.country} 🌍`;
                    }
                  }

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{p.full_name || 'Anonymous User'}</span>
                          <span className="text-[10px] text-gray-400">{p.email || p.phone || p.id}</span>
                        </div>
                      </td>
                      <td className="p-5">{renderTierBadge(p)}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.onboarding_completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          Step {p.onboarding_step || 1} {p.onboarding_completed ? '(Complete)' : '(Pending)'}
                        </span>
                      </td>
                      <td className="p-5">
                        {p.verification_status === 'verified' ? (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase">Verified</span>
                        ) : p.verification_status === 'pending' ? (
                          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-[10px] font-black uppercase">Pending Approval</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-[10px] font-bold uppercase">Unverified</span>
                        )}
                      </td>
                      <td className="p-5 font-bold text-gray-300">{locStr}</td>
                      <td className="p-5 text-gray-400">
                        {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
