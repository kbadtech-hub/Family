'use client';
/**
 * BETESEB GEOLOCATION & VPN GUARD
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders an un-dismissable full-screen overlay when:
 *   1. The user denies location permission ("Do Not Allow")
 *   2. The user is detected to be using a VPN or Proxy
 *
 * HOW TO USE:
 *   Wrap your login/signup page content with this component:
 *   <GeoGuard>
 *     <LoginFormContent />
 *   </GeoGuard>
 *
 * The guard does the following on mount:
 *   Step A → Request GPS location via navigator.geolocation
 *   Step B → Simultaneously call ipinfo.io to detect VPN/Proxy
 *   Step C → If location denied OR VPN detected → show blocking modal
 *   Step D → If both checks pass → render children normally
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { ShieldAlert, MapPin, Wifi, RefreshCw, Lock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockReason = 'location_denied' | 'vpn_detected' | null;
type CheckState  = 'checking' | 'passed' | 'blocked';

// ─── IP Geolocation Check ─────────────────────────────────────────────────────

/**
 * Calls ipinfo.io to check if the user's IP is a VPN, proxy, or hosting provider.
 * ipinfo.io free tier: 50,000 requests/month — enough for early production.
 * The `privacy` object returned by ipinfo contains: vpn, proxy, tor, relay, hosting.
 *
 * NOTE: You need a FREE token from https://ipinfo.io/signup
 * Add to .env.local:  NEXT_PUBLIC_IPINFO_TOKEN=your_token_here
 */
async function checkForVPN(): Promise<{ isVPN: boolean; country?: string; city?: string }> {
  try {
    const token = process.env.NEXT_PUBLIC_IPINFO_TOKEN || '';
    const url = token
      ? `https://ipinfo.io/json?token=${token}`
      : 'https://ipinfo.io/json';

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { isVPN: false };

    const data = await res.json();

    // ipinfo.io `privacy` field (available on paid plans)
    // Fallback: check `org` field — hosting/datacenter IPs strongly suggest VPN
    const privacy  = data.privacy || {};
    const org: string = data.org || '';
    const country: string = data.country || '';
    const city: string = data.city || '';

    const isVPN = !!(
      privacy.vpn      ||
      privacy.proxy    ||
      privacy.tor      ||
      privacy.relay    ||
      // Heuristic: common VPN/datacenter ASN prefixes in the org field
      /AS(13335|20473|14061|16509|15169|8075)\b/.test(org) ||
      /vpn|proxy|hosting|datacenter|cloudflare|digitalocean|amazon|google cloud|microsoft azure/i.test(org)
    );

    return { isVPN, country, city };
  } catch {
    // Network timeout or API unavailable — fail open (don't block the user)
    return { isVPN: false };
  }
}

// ─── Geolocation Check ────────────────────────────────────────────────────────

function requestGPSLocation(): Promise<{ granted: boolean }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ granted: false });
      return;
    }

    // First check the Permissions API if available.
    // This allows an instant resolution on retry when the user has already
    // enabled location in their device settings since the last check.
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        if (permissionStatus.state === 'granted') {
          // Already granted — no need to show a prompt, resolve instantly
          resolve({ granted: true });
        } else if (permissionStatus.state === 'denied') {
          // Hard-denied — no point prompting
          resolve({ granted: false });
        } else {
          // 'prompt' — user hasn't decided yet, ask them
          navigator.geolocation.getCurrentPosition(
            () => resolve({ granted: true }),
            () => resolve({ granted: false }),
            { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
          );
        }
      }).catch(() => {
        // Permissions API failed — fall back to direct GPS request
        navigator.geolocation.getCurrentPosition(
          () => resolve({ granted: true }),
          () => resolve({ granted: false }),
          { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
        );
      });
    } else {
      // Older browsers without Permissions API
      navigator.geolocation.getCurrentPosition(
        () => resolve({ granted: true }),
        () => resolve({ granted: false }),
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    }
  });
}

// ─── Localized Strings ────────────────────────────────────────────────────────

function getStrings(locale: string) {
  const isAm = locale === 'am';
  const isOm = locale === 'om';
  const isTi = locale === 'ti';
  const isAr = locale === 'ar';
  const isSo = locale === 'so';

  if (isAm) return {
    checking: 'ቦታዎን እያረጋገጥን ነው…',
    locationTitle: 'የቦታ ፈቃድ ያስፈልጋል',
    locationBody: 'ደህንነትዎን ለመጠበቅ የቦታ ፈቃድ ያስፈልጋል። እባክዎ "Allow" ወይም "ፍቀድ" ይጫኑ ከዚያም ገጹን ዳግም ያዙ።',
    vpnTitle: 'VPN ተገኝቷል',
    vpnBody: 'VPN ወይም Proxy እየተጠቀሙ ነው። እባክዎ VPN ያጥፉ ከዚያም እንደገና ይሞክሩ።',
    retry: 'ዳግም ሞክር',
    why: 'ለምን ቦታዬ ያስፈልጋል?',
    whyBody: 'ስርዓቱ ደህንነቱ ለተጠበቀ ምዝገባ እና ለማጭበርበር መከላከያ የቦታ ፈቃድ ይጠቀማል።',
  };
  if (isOm) return {
    checking: 'Bakka kee mirkaneessaa jirra…',
    locationTitle: 'Hayyama Bakka Barbaachisa',
    locationBody: 'Nageenya keetiif hayyama bakka barbaachisa. "Allow" tuqi.',
    vpnTitle: 'VPN Argame',
    vpnBody: 'VPN ykn Proxy fayyadamaa jirta. Dhabamsiisin irra deebi\'i yaalii.',
    retry: 'Irra deebi\'i yaali',
    why: 'Maaliif bakki koo barbaachisa?',
    whyBody: 'Galmee nageenya qabu mirkaneessuuf bakka barbaachisa.',
  };
  if (isTi) return {
    checking: 'ቦታኹም ኣረጋጊጽና ኣለና…',
    locationTitle: 'ፍቓድ ቦታ የድሊ',
    locationBody: 'ንድሕንነትኹም ፍቓድ ቦታ የድሊ። "Allow" ጠቕዕ።',
    vpnTitle: 'VPN ተረኺቡ',
    vpnBody: 'VPN ወይ Proxy ትጥቀሙ ኣለኹም። VPN ኣጥፍኡ ደሓር ሃዱ።',
    retry: 'ደጊምካ ፈትን',
    why: 'ስለምንታይ ቦታይ ይደለ?',
    whyBody: 'ነቲ ዝተጠቃሕ ቦታ ናብ ዳታቤዝ ከም ምዝገባ ደሕንነት ንጥቀም።',
  };
  if (isAr) return {
    checking: 'جارٍ التحقق من موقعك…',
    locationTitle: 'إذن الموقع مطلوب',
    locationBody: 'لحماية حسابك، نحتاج إذن الموقع. يرجى الضغط على "سماح".',
    vpnTitle: 'تم اكتشاف VPN',
    vpnBody: 'أنت تستخدم VPN أو بروكسي. يرجى تعطيله والمحاولة مرة أخرى.',
    retry: 'حاول مرة أخرى',
    why: 'لماذا نحتاج موقعك؟',
    whyBody: 'نستخدم الموقع لحماية حسابك من التزوير والتسجيل المزدوج.',
  };
  if (isSo) return {
    checking: 'Goobta aad ku sugan tahay waa la hubinaynaa…',
    locationTitle: 'Oggolaanshaha Goobta Loo Baahan Yahay',
    locationBody: 'Xagga ammaanka, waxaan u baahanahay oggolaanshaha goobta. Riix "Allow".',
    vpnTitle: 'VPN Ayaa La Helay',
    vpnBody: 'Waad isticmaalaysaa VPN ama Proxy. Jooji VPN kadib isku day.',
    retry: 'Isku day mar kale',
    why: 'Maxay goobtu muhiim u tahay?',
    whyBody: 'Waxaan goobta u isticmaalnaa xagga sugnaanta xisaabkaaga.',
  };

  // Default: English
  return {
    checking: 'Verifying your location…',
    locationTitle: 'Location Permission Required',
    locationBody: 'To protect account security, we require location access. Please click "Allow" when prompted, then click Retry.',
    vpnTitle: 'VPN Detected',
    vpnBody: 'You appear to be using a VPN or Proxy. Please disable it and try again.',
    retry: 'Retry',
    why: 'Why do we need your location?',
    whyBody: 'Beteseb uses your location to prevent fraud, duplicate accounts, and unauthorized access.',
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GeoGuardProps {
  children: React.ReactNode;
}

export default function GeoGuard({ children }: GeoGuardProps) {
  const locale = useLocale();
  const str = getStrings(locale);

  const [checkState, setCheckState]     = useState<CheckState>('checking');
  const [blockReason, setBlockReason]   = useState<BlockReason>(null);
  const [showWhyInfo, setShowWhyInfo]   = useState(false);
  const [retryCount, setRetryCount]     = useState(0);

  const runChecks = useCallback(async () => {
    setCheckState('checking');

    // Run GPS and VPN checks concurrently
    const [gpsResult, vpnResult] = await Promise.all([
      requestGPSLocation(),
      checkForVPN(),
    ]);

    if (!gpsResult.granted) {
      setBlockReason('location_denied');
      setCheckState('blocked');
      return;
    }

    if (vpnResult.isVPN) {
      setBlockReason('vpn_detected');
      setCheckState('blocked');
      return;
    }

    setCheckState('passed');
  }, []);

  // Run checks on mount and on every retry
  useEffect(() => {
    runChecks();
  }, [runChecks, retryCount]);

  const handleRetry = () => {
    setBlockReason(null);
    setShowWhyInfo(false);
    setRetryCount(c => c + 1);
  };

  // ── Checking State ──────────────────────────────────────────────────────────
  if (checkState === 'checking') {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <MapPin size={32} className="text-primary" />
        </div>
        <p className="text-sm font-semibold text-gray-500 tracking-wide animate-pulse">
          {str.checking}
        </p>
      </div>
    );
  }

  // ── Blocked State ───────────────────────────────────────────────────────────
  if (checkState === 'blocked') {
    const isVPN = blockReason === 'vpn_detected';
    const Icon  = isVPN ? Wifi : Lock;

    return (
      <div
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-lg flex items-center justify-center px-6"
        // Prevent any click from passing through
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden">
          {/* Colored header band */}
          <div className={`px-8 pt-10 pb-6 flex flex-col items-center text-center ${isVPN ? 'bg-red-50' : 'bg-amber-50'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner ${isVPN ? 'bg-red-100' : 'bg-amber-100'}`}>
              <Icon size={38} className={isVPN ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <h2 className={`text-xl font-black tracking-tight ${isVPN ? 'text-red-700' : 'text-amber-700'}`}>
              {isVPN ? str.vpnTitle : str.locationTitle}
            </h2>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-5">
            <p className="text-sm text-gray-600 leading-relaxed text-center font-medium">
              {isVPN ? str.vpnBody : str.locationBody}
            </p>

            {/* Why info accordion */}
            {!isVPN && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowWhyInfo(v => !v)}
                  className="w-full text-xs font-bold text-primary/70 uppercase tracking-wider py-2 flex items-center justify-center gap-2 hover:text-primary transition-colors"
                >
                  <ShieldAlert size={14} />
                  {str.why}
                </button>
                {showWhyInfo && (
                  <p className="text-xs text-gray-400 text-center leading-relaxed px-2 pb-2">
                    {str.whyBody}
                  </p>
                )}
              </div>
            )}

            {/* Retry button */}
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              style={{ background: isVPN ? '#dc2626' : '#f59e0b' }}
            >
              <RefreshCw size={16} />
              {str.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Passed — render children normally ──────────────────────────────────────
  return <>{children}</>;
}
