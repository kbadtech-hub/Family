/**
 * Location resolution utilities for Beteseb
 * Resolves coordinates (lat, lng) or IP location to Country, State/Region, and City
 */

export interface ResolvedLocation {
  country: string;
  region: string;
  city: string;
  lat?: number;
  lng?: number;
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  'ET': 'Ethiopia',
  'US': 'USA',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'SA': 'Saudi Arabia',
  'AE': 'UAE',
  'SE': 'Sweden',
  'AU': 'Australia',
  'NO': 'Norway',
  'KE': 'Kenya',
  'ZA': 'South Africa',
  'CN': 'China',
  'JP': 'Japan',
  'FR': 'France',
  'IT': 'Italy',
  'ER': 'Eritrea',
  'DJ': 'Djibouti',
  'SO': 'Somalia',
  'SD': 'Sudan'
};

export async function resolveLocationFromCoords(lat: number, lng: number): Promise<ResolvedLocation> {
  const isGpsEthiopia = lat >= 3.0 && lat <= 15.0 && lng >= 33.0 && lng <= 48.0;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url, { signal: controller?.signal });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const iso = data.countryCode || '';
      let country = COUNTRY_CODE_MAP[iso] || data.countryName || (isGpsEthiopia ? 'Ethiopia' : 'Others');

      if (country.includes('United States')) country = 'USA';
      if (country.includes('United Kingdom')) country = 'United Kingdom';

      let region = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || (isGpsEthiopia ? 'Addis Ababa' : 'Others');
      let city = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || (isGpsEthiopia ? 'Addis Ababa' : 'Others');

      // Clean region name suffix if present
      region = region.replace(/\s*(Region|State|Province|County)$/i, '').trim();

      return {
        country: country || (isGpsEthiopia ? 'Ethiopia' : 'Others'),
        region: region || (isGpsEthiopia ? 'Addis Ababa' : 'Others'),
        city: city || (isGpsEthiopia ? 'Addis Ababa' : 'Others'),
        lat,
        lng
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding lookup failed or timed out:', err);
  }

  // Fallback to IP location if coordinate lookup fails
  const ipLoc = await fetchIpLocation();
  return { ...ipLoc, lat, lng };
}

export async function fetchIpLocation(): Promise<ResolvedLocation> {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    const res = await fetch('https://ipinfo.io/json', { signal: controller?.signal });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const iso = data.country || '';
      let country = COUNTRY_CODE_MAP[iso] || data.country || 'Ethiopia';
      if (country.includes('United States')) country = 'USA';
      if (country.includes('United Kingdom')) country = 'United Kingdom';

      let region = data.region || 'Addis Ababa';
      let city = data.city || 'Addis Ababa';

      region = region.replace(/\s*(Region|State|Province|County)$/i, '').trim();

      let lat: number | undefined;
      let lng: number | undefined;
      if (data.loc && typeof data.loc === 'string') {
        const parts = data.loc.split(',');
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
        }
      }

      return {
        country: country || 'Ethiopia',
        region: region || 'Addis Ababa',
        city: city || 'Addis Ababa',
        lat,
        lng
      };
    }
  } catch (err) {
    console.warn('IP location fetch failed:', err);
  }

  return { country: 'Ethiopia', region: 'Addis Ababa', city: 'Addis Ababa' };
}

export async function detectUserLocation(): Promise<ResolvedLocation> {
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const gpsPos = await new Promise<GeolocationPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { timeout: 5000, enableHighAccuracy: false }
        );
      });

      if (gpsPos) {
        return await resolveLocationFromCoords(gpsPos.coords.latitude, gpsPos.coords.longitude);
      }
    } catch {
      // Fallthrough to IP check
    }
  }

  return await fetchIpLocation();
}
