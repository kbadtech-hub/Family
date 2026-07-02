'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { getUserSubscriptionInfo } from '@/lib/subscription';
import { registerPushNotifications } from '@/lib/push-notifications';

/**
 * SubscriptionObserver — background listener.
 * Checks tier on mount and redirects locked accounts to the payment tab.
 * No longer shows expired banners (trial model removed).
 */
export default function SubscriptionObserver() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSub() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Register push notifications for native platforms
      registerPushNotifications();

      const info = await getUserSubscriptionInfo(user.id);

      // FORCE LOCK LOGIC: Redirect locked accounts to payment
      if (info?.tier === 'locked' && !pathname.includes('dashboard')) {
        router.push('/dashboard?tab=payment');
      }
    }
    checkSub();
  }, [pathname, router]);

  // No persistent UI — gating is handled by SubscriptionGate + useFeatureGate
  return null;
}
