'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getUserSubscriptionInfo, SubscriptionInfo, canUseFeature, FeatureQuota } from './subscription';

export function useSubscription() {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const info = await getUserSubscriptionInfo(user.id);
        setSubInfo(info);
      }
      setLoading(false);
    });
  }, []);

  return { subInfo, loading, isPremium: subInfo?.tier === 'premium' };
}

export function useFeatureGate(feature: keyof FeatureQuota) {
  const { subInfo, loading } = useSubscription();
  const hasAccess = !loading && canUseFeature(subInfo, feature);
  return { hasAccess, loading, subInfo };
}

/**
 * Hook to enforce audio call daily quota (120s for free users)
 * Returns: remainingSeconds, isExhausted, markSecondsUsed
 */
export function useAudioCallQuota() {
  const { subInfo, loading } = useSubscription();
  const [usedSeconds, setUsedSeconds] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Load today's usage from localStorage
    const today = new Date().toISOString().split('T')[0];
    const key = `audio_used_${today}`;
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    setUsedSeconds(stored);
    setInitialized(true);
  }, [loading]);

  const maxSeconds = subInfo?.tier === 'premium' ? Infinity : 120;
  const remainingSeconds = Math.max(0, maxSeconds - usedSeconds);
  const isExhausted = remainingSeconds <= 0 && subInfo?.tier !== 'premium';

  const markSecondsUsed = (seconds: number) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `audio_used_${today}`;
    const newTotal = usedSeconds + seconds;
    localStorage.setItem(key, newTotal.toString());
    setUsedSeconds(newTotal);
  };

  return { remainingSeconds, isExhausted, markSecondsUsed, initialized, isPremium: subInfo?.tier === 'premium' };
}

/**
 * Hook to enforce daily message quota (5 for free users)
 */
export function useDailyMessageQuota() {
  const { subInfo, loading } = useSubscription();
  const [usedToday, setUsedToday] = useState(0);

  useEffect(() => {
    if (loading) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `msg_used_${today}`;
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    setUsedToday(stored);
  }, [loading]);

  const maxMessages = subInfo?.tier === 'premium' ? Infinity : 5;
  const remainingMessages = Math.max(0, maxMessages - usedToday);
  const isExhausted = remainingMessages <= 0 && subInfo?.tier !== 'premium';

  const markMessageSent = () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `msg_used_${today}`;
    const newTotal = usedToday + 1;
    localStorage.setItem(key, newTotal.toString());
    setUsedToday(newTotal);
  };

  return { remainingMessages, isExhausted, markMessageSent, isPremium: subInfo?.tier === 'premium' };
}
