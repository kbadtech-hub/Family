/**
 * BETESEB ADVERTISING AND REWARDED ADS SERVICE
 * Configures AdMob / Google Mobile Ads settings for mature demographics (18+)
 * and handles native Rewarded Video Ads for Android/iOS, with a simulated web fallback.
 */

import { supabase } from './supabase';

export interface AdConfiguration {
  maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
  tagForChildDirectedTreatment: boolean;
  tagForUnderAgeOfConsent: boolean;
  nonPersonalizedAdsOnly: boolean;
  blockedCategories: string[];
}

export const SECURE_AD_CONFIG: AdConfiguration = {
  // Enforce PG ad rating maximum to keep ads clean and family-friendly
  maxAdContentRating: 'PG',
  // Users are strictly 18+, so child-directed tags are false
  tagForChildDirectedTreatment: false,
  tagForUnderAgeOfConsent: false,
  nonPersonalizedAdsOnly: true, // Enforce strict privacy compliance
  blockedCategories: [
    'Dating & Relationships (Competitors)',
    'Gambling & Betting',
    'Sensual/Suggestive content',
    'Weapons & Firearms',
    'Alcohol & Tobacco',
    'Social Casino Games'
  ]
};

// ── Utility: Detect Native Platform ──────────────────────────────────────────
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Initialize AdMob SDK at App Launch (Native only)
 */
export async function initializeAdMob() {
  if (!isNativePlatform()) return;

  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [], // Add developer device IDs here if needed
      initializeForTesting: true, // Set true to load test ads during development
    });
    console.log('[AdMob] Native AdMob SDK initialized.');
  } catch (e) {
    console.warn('[AdMob] Native initialization failed:', e);
  }
}

/**
 * Show a native Rewarded Video Ad to grant the user a reward.
 * If the user completes the video, the callback `onRewardGranted` is triggered.
 * Web environment runs a simulated countdown mockup.
 */
export async function showRewardedAd(
  userId: string,
  onRewardGranted: (rewardAmount: number) => void,
  onAdClosedOrFailed?: () => void
): Promise<void> {
  if (isNativePlatform()) {
    await showNativeRewardedAd(userId, onRewardGranted, onAdClosedOrFailed);
  } else {
    await showWebSimulatedRewardedAd(userId, onRewardGranted, onAdClosedOrFailed);
  }
}

// ── NATIVE ADMOB REWARDED AD FLOW ───────────────────────────────────────────
async function showNativeRewardedAd(
  userId: string,
  onRewardGranted: (rewardAmount: number) => void,
  onAdClosedOrFailed?: () => void
) {
  try {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');

    // Test Ad Unit IDs provided by Google for development:
    // Android: ca-app-pub-3940256099942544/5224354917
    // iOS: ca-app-pub-3940256099942544/1712485313
    const adId = (window as any).Capacitor.getPlatform() === 'ios'
      ? 'ca-app-pub-3940256099942544/1712485313'
      : 'ca-app-pub-3940256099942544/5224354917';

    // Prepare Ad
    await AdMob.prepareRewardVideoAd({
      adId,
      isTesting: true,
      ssv: {
        userId, // Server-Side Verification payload
      }
    });

    let rewardEarned = false;

    // Listen for completion / reward event
    const rewardListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
      console.log('[AdMob] Native reward earned:', reward);
      rewardEarned = true;
      onRewardGranted(reward.amount || 1);
    });

    // Listen for ad dismissal / close
    const dismissListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] Native ad dismissed.');
      rewardListener.remove();
      dismissListener.remove();
      if (!rewardEarned && onAdClosedOrFailed) {
        onAdClosedOrFailed();
      }
    });

    // Listen for failure to show
    const failedListener = AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
      console.warn('[AdMob] Native ad failed to show.');
      rewardListener.remove();
      dismissListener.remove();
      failedListener.remove();
      if (onAdClosedOrFailed) onAdClosedOrFailed();
    });

    // Show Ad
    await AdMob.showRewardVideoAd();

  } catch (e) {
    console.error('[AdMob] Native Rewarded Ad failure:', e);
    if (onAdClosedOrFailed) onAdClosedOrFailed();
  }
}

// ── WEB SIMULATED REWARDED AD FLOW (MOCKUP) ──────────────────────────────────
function showWebSimulatedRewardedAd(
  userId: string,
  onRewardGranted: (rewardAmount: number) => void,
  onAdClosedOrFailed?: () => void
) {
  console.log('[AdMob] Web environment detected. Launching simulated reward ad overlay...');

  // Create temporary fullscreen overlay to simulate watching a video ad
  const overlay = document.createElement('div');
  overlay.id = 'beteseb-ad-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = '#fff';
  overlay.style.fontFamily = 'var(--font-poppins), sans-serif';

  let timeLeft = 5; // 5-second simulated ad duration for fast dev testing

  overlay.innerHTML = `
    <div style="text-align: center; max-width: 400px; padding: 20px; border-radius: 12px; background: #1e1e1e; border: 1px solid #333;">
      <div style="font-size: 40px; margin-bottom: 15px;">🪙</div>
      <h3 style="margin: 0 0 10px 0; font-size: 20px;">Watching Sponsored Ad</h3>
      <p style="color: #888; font-size: 14px; margin-bottom: 20px;">Keep watching to earn 2 free messages / 1 minute call limit break!</p>
      <div id="ad-timer" style="font-size: 24px; font-weight: bold; color: #ff6b6b; margin-bottom: 20px;">
        Ad closes in ${timeLeft}s
      </div>
      <button id="ad-skip-btn" style="background: transparent; border: none; color: #666; font-size: 12px; cursor: pointer; text-decoration: underline;" disabled>
        Skip Ad (No Reward)
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const timerEl = document.getElementById('ad-timer');
  const skipBtn = document.getElementById('ad-skip-btn') as HTMLButtonElement;

  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.innerText = `Ad closes in ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      // Automatically close and award
      document.body.removeChild(overlay);
      console.log('[AdMob] Web reward simulation complete.');
      onRewardGranted(1); // Standard ad unit reward
    }
  }, 1000);

  // Enable skip after 2 seconds
  setTimeout(() => {
    if (skipBtn) {
      skipBtn.disabled = false;
      skipBtn.style.color = '#ff6b6b';
      skipBtn.onclick = () => {
        clearInterval(interval);
        document.body.removeChild(overlay);
        console.log('[AdMob] Web ad simulation skipped.');
        if (onAdClosedOrFailed) onAdClosedOrFailed();
      };
    }
  }, 2000);
}
