/**
 * BETESEB FIREBASE CRASHLYTICS SERVICE
 * Records app crashes and non-fatal errors for debugging.
 * Only active on native iOS/Android (Capacitor).
 */

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Initialize Crashlytics — call once at app startup.
 */
export async function initCrashlytics() {
  if (!isNativePlatform()) return;

  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.setEnabled({ enabled: true });
    console.log('[Crashlytics] Initialized and enabled.');
  } catch (e) {
    console.warn('[Crashlytics] Init failed:', e);
  }
}

/**
 * Set user identity in Crashlytics for crash attribution.
 */
export async function setCrashlyticsUser(userId: string) {
  if (!isNativePlatform()) return;

  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.setUserId({ userId });
  } catch (e) {
    console.warn('[Crashlytics] setUser failed:', e);
  }
}

/**
 * Log a non-fatal error to Crashlytics.
 * Use this to catch and report errors without crashing the app.
 */
export async function logCrashlyticsError(error: Error, context?: string) {
  if (!isNativePlatform()) {
    // On web, just log to console
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error.message);
    return;
  }

  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.recordException({
      message: `${context ? `[${context}] ` : ''}${error.message}`
    });
  } catch (e) {
    console.warn('[Crashlytics] recordException failed:', e);
  }
}

/**
 * Add a breadcrumb log to Crashlytics.
 * Helps trace user steps leading up to a crash.
 */
export async function addCrashlyticsLog(message: string) {
  if (!isNativePlatform()) return;

  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.log({ message });
  } catch (e) {
    // Silent fail
  }
}

/**
 * Set a custom key/value attribute in Crashlytics crash reports.
 */
export async function setCrashlyticsAttribute(key: string, value: string) {
  if (!isNativePlatform()) return;

  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.setCustomKey({ key, value, type: 'string' });
  } catch (e) {
    console.warn('[Crashlytics] setCustomKey failed:', e);
  }
}
