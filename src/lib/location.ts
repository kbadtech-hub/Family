/**
 * High-Accuracy Location Resolution Utilities for Beteseb
 * Resolves exact GPS coordinates (lat, lng) to Country, State/Region, and City
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

export function mapEthiopianRegionAndCity(
  rawState: string,
  rawCity: string,
  rawCounty: string = ''
): { region: string; city: string } {
  const s = (rawState + ' ' + rawCounty).toLowerCase();
  const c = rawCity.toLowerCase();

  // Harar
  if (s.includes('harar') || s.includes('harer') || c.includes('harar') || c.includes('harer')) {
    return { region: 'Harar', city: 'Harar' };
  }

  // Dire Dawa
  if (s.includes('dire dawa') || c.includes('dire dawa')) {
    return { region: 'Dire Dawa', city: 'Dire Dawa' };
  }

  // Oromia
  if (s.includes('oromi') || c.includes('adama') || c.includes('jimma') || c.includes('bishoftu') || c.includes('debre zeit')) {
    let city = 'Adama';
    if (c.includes('jimma')) city = 'Jimma';
    if (c.includes('bishoftu') || c.includes('debre zeit')) city = 'Bishoftu';
    if (c.includes('adama') || c.includes('nazret') || c.includes('nazareth')) city = 'Adama';
    return { region: 'Oromia', city };
  }

  // Amhara
  if (s.includes('amhara') || c.includes('bahir dar') || c.includes('gondar') || c.includes('dessie') || c.includes('gojjam') || c.includes('wollo')) {
    let city = 'Bahir Dar';
    if (c.includes('gondar') || c.includes('gonder')) city = 'Gondar';
    if (c.includes('dessie') || c.includes('desie')) city = 'Dessie';
    if (c.includes('bahir dar') || c.includes('bahirdar')) city = 'Bahir Dar';
    return { region: 'Amhara', city };
  }

  // Tigray
  if (s.includes('tigray') || s.includes('tigrai') || c.includes('mekelle') || c.includes('adigrat') || c.includes('axum')) {
    let city = 'Mekelle';
    if (c.includes('adigrat')) city = 'Adigrat';
    if (c.includes('axum') || c.includes('aksum')) city = 'Axum';
    if (c.includes('mekelle') || c.includes('mekele')) city = 'Mekelle';
    return { region: 'Tigray', city };
  }

  // Sidama
  if (s.includes('sidama') || c.includes('hawassa') || c.includes('yirgalem')) {
    let city = 'Hawassa';
    if (c.includes('yirgalem')) city = 'Yirgalem';
    return { region: 'Sidama', city };
  }

  // South Ethiopia
  if (s.includes('south') || s.includes('snnpr') || c.includes('arba minch') || c.includes('dila')) {
    let city = 'Arba Minch';
    if (c.includes('dila') || c.includes('dilla')) city = 'Dila';
    return { region: 'South Ethiopia', city };
  }

  // Somali
  if (s.includes('somali') || c.includes('jijiga') || c.includes('gode')) {
    let city = 'Jijiga';
    if (c.includes('gode')) city = 'Gode';
    return { region: 'Somali', city };
  }

  // Afar
  if (s.includes('afar') || c.includes('semera') || c.includes('logia')) {
    let city = 'Semera';
    if (c.includes('logia')) city = 'Logia';
    return { region: 'Afar', city };
  }

  // Benishangul-Gumuz
  if (s.includes('benishangul') || c.includes('asosa')) {
    return { region: 'Benishangul-Gumuz', city: 'Asosa' };
  }

  // Gambela
  if (s.includes('gambela') || c.includes('gambela')) {
    return { region: 'Gambela', city: 'Gambela' };
  }

  // Addis Ababa
  if (s.includes('addis ababa') || s.includes('finfinnee') || c.includes('addis ababa')) {
    return { region: 'Addis Ababa', city: 'Addis Ababa' };
  }

  // Fallback cleanup
  const cleanRegion = rawState.replace(/\s*(Region|State|Province|County|People's)$/i, '').trim() || 'Addis Ababa';
  const cleanCity = rawCity.trim() || 'Addis Ababa';
  return { region: cleanRegion, city: cleanCity };
}

export async function resolveLocationFromCoords(lat: number, lng: number): Promise<ResolvedLocation> {
  const isGpsEthiopia = lat >= 3.0 && lat <= 15.0 && lng >= 33.0 && lng <= 48.0;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

    const [nomRes, bdcRes] = await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`, {
        headers: { 'User-Agent': 'BetesebApp/1.0' },
        signal: controller?.signal
      }).catch(() => null),
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
        signal: controller?.signal
      }).catch(() => null)
    ]);

    if (timeoutId) clearTimeout(timeoutId);

    let nomData: any = null;
    let bdcData: any = null;

    if (nomRes && nomRes.ok) nomData = await nomRes.json();
    if (bdcRes && bdcRes.ok) bdcData = await bdcRes.json();

    const countryCode = (bdcData?.countryCode || nomData?.address?.country_code || '').toUpperCase();
    let country = COUNTRY_CODE_MAP[countryCode] || bdcData?.countryName || nomData?.address?.country || (isGpsEthiopia ? 'Ethiopia' : 'Others');

    if (country.includes('United States')) country = 'USA';
    if (country.includes('United Kingdom')) country = 'United Kingdom';

    const rawState = nomData?.address?.state || nomData?.address?.state_district || bdcData?.principalSubdivision || '';
    const rawCity = nomData?.address?.city || nomData?.address?.town || nomData?.address?.village || nomData?.address?.municipality || bdcData?.city || bdcData?.locality || '';
    const rawCounty = nomData?.address?.county || nomData?.address?.suburb || '';

    if (isGpsEthiopia || country === 'Ethiopia') {
      const mapped = mapEthiopianRegionAndCity(rawState, rawCity, rawCounty);
      return {
        country: 'Ethiopia',
        region: mapped.region,
        city: mapped.city,
        lat,
        lng
      };
    }

    const cleanRegion = rawState.replace(/\s*(State|Province|County|Region)$/i, '').trim() || 'Others';
    const cleanCity = rawCity.trim() || 'Others';

    return {
      country: country || 'Others',
      region: cleanRegion,
      city: cleanCity,
      lat,
      lng
    };
  } catch (err) {
    console.warn('High-accuracy reverse geocoding failed:', err);
  }

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

      let lat: number | undefined;
      let lng: number | undefined;
      if (data.loc && typeof data.loc === 'string') {
        const parts = data.loc.split(',');
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
        }
      }

      if (country === 'Ethiopia' || iso === 'ET') {
        const mapped = mapEthiopianRegionAndCity(region, city);
        return {
          country: 'Ethiopia',
          region: mapped.region,
          city: mapped.city,
          lat,
          lng
        };
      }

      region = region.replace(/\s*(Region|State|Province|County)$/i, '').trim();

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
          { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
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
