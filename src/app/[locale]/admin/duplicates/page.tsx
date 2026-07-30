'use client';

import React, { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  full_name: string;
  first_name?: string;
  father_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  birth_date?: string;
  location?: { country?: string; city?: string };
  verification_status?: string;
}

interface DuplicateFlagItem {
  id: string;
  primary_user_id: string;
  flagged_user_id: string;
  similarity_score: number;
  matched_stage: string;
  status: string;
  match_details: any;
  created_at: string;
  primary_user: UserProfile;
  flagged_user: UserProfile;
}

export default function AdminDuplicatesDashboard() {
  const [flags, setFlags] = useState<DuplicateFlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_distinct' | 'merged' | 'blocked'>('pending');
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  const fetchFlags = async (statusTab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/duplicates?status=${statusTab}`);
      const data = await res.json();
      if (data.success) {
        setFlags(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch duplicate flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags(activeTab);
  }, [activeTab]);

  const handleAction = async (flagId: string, action: 'approve_distinct' | 'merge' | 'block') => {
    setActionProcessing(flagId);
    try {
      const res = await fetch('/api/admin/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId, action }),
      });

      const data = await res.json();
      if (data.success) {
        setFlags((prev) => prev.filter((f) => f.id !== flagId));
      } else {
        alert(data.error || 'Action failed.');
      }
    } catch (err) {
      alert('Network or server error.');
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                🔍
              </span>
              የዱፕሊኬት አካውንት መቆጣጠሪያ (Duplicate Flagging Dashboard)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ተመሳሳይ መረጃ ያላቸውን ተጠቃሚዎች በአይነ-መልካም ማወዳደር፣ አካውንት ማዋሃድ ወይም ማገድ።
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl text-sm font-medium">
            {(['pending', 'approved_distinct', 'merged', 'blocked'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'pending' ? 'ለእይታ የሚጠብቁ' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">መረጃ በመጫን ላይ...</p>
          </div>
        ) : flags.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              በዚህ ምድብ ምንም አይነት የተጠረጠረ አካውንት የለም።
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {flags.map((flag) => {
              const matchPercent = Math.round(flag.similarity_score * 100);
              return (
                <div
                  key={flag.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6 space-y-4"
                >
                  {/* Card Header Info */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-sm rounded-full">
                        {matchPercent}% Match
                      </span>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        Stage: {flag.matched_stage}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      የተመዘገበበት ቀን፡ {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary User Card */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={flag.primary_user?.avatar_url || '/placeholder-user.png'}
                          alt="Primary"
                          className="w-12 h-12 rounded-full object-cover border-2 border-rose-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            ቀደም ሲል የተመዘገበ አካውንት (Primary)
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {flag.primary_user?.full_name || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <div><strong>DOB:</strong> {flag.primary_user?.birth_date || 'N/A'}</div>
                        <div><strong>Phone:</strong> {flag.primary_user?.phone || 'N/A'}</div>
                        <div><strong>Email:</strong> {flag.primary_user?.email || 'N/A'}</div>
                        <div><strong>City:</strong> {flag.primary_user?.location?.city || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Flagged User Card */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={flag.flagged_user?.avatar_url || '/placeholder-user.png'}
                          alt="Flagged"
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            አዲስ የተጠረጠረ አካውንት (Flagged)
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {flag.flagged_user?.full_name || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <div><strong>DOB:</strong> {flag.flagged_user?.birth_date || 'N/A'}</div>
                        <div><strong>Phone:</strong> {flag.flagged_user?.phone || 'N/A'}</div>
                        <div><strong>Email:</strong> {flag.flagged_user?.email || 'N/A'}</div>
                        <div><strong>City:</strong> {flag.flagged_user?.location?.city || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  {flag.status === 'pending' && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleAction(flag.id, 'approve_distinct')}
                        disabled={actionProcessing === flag.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                      >
                        እንደተለየ ሰው አጽድቅ (Approve Distinct)
                      </button>

                      <button
                        onClick={() => handleAction(flag.id, 'merge')}
                        disabled={actionProcessing === flag.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                      >
                        አካውንቶችን አዋህድ (Merge Accounts)
                      </button>

                      <button
                        onClick={() => handleAction(flag.id, 'block')}
                        disabled={actionProcessing === flag.id}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                      >
                        ዱፕሊኬቱን ዝጋ (Suspend Account)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
