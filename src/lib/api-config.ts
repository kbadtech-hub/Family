/**
 * Helper to resolve absolute API URL for Capacitor / Mobile WebViews.
 * Relative URLs like `/api/auth/firebase-sync` throw "Failed to fetch" on mobile apps.
 */
export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    const isCapacitor =
      !!(window as any).Capacitor?.isNativePlatform?.() ||
      window.location.origin.includes('localhost') ||
      window.location.origin.includes('capacitor');

    if (isCapacitor && !cleanPath.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beteseb1.online';
      return `${baseUrl.replace(/\/$/, '')}${cleanPath}`;
    }
  }

  return cleanPath;
}
