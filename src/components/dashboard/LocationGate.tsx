'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ShieldAlert, Loader2, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LocationGateProps {
  locale: string;
  onVerified: (isEthiopia: boolean) => void;
}

const translations = {
  am: {
    title: 'የአካባቢ ማረጋገጫ ግዴታ ነው',
    desc: 'ለክልላዊ የክፍያ ደንቦች ተገዢ ለመሆን እና ስህተቶችን ለመከላከል እባክዎ የስልክዎን ወይም የብሮውዘርዎን ሎኬሽን (GPS) ያብሩ።',
    button: 'አካባቢን አረጋግጥ',
    checking: 'አካባቢዎን እያረጋገጥን ነው...',
    gpsError: 'የሎኬሽን አገልግሎት ማግኘት አልተቻለም። እባክዎ የጂፒኤስ (GPS) ፈቃድ መስጠትዎን ያረጋግጡ።',
    vpnTitle: 'የቪፒኤን (VPN) ግንኙነት ተገኝቷል',
    vpnDesc: 'የቪፒኤን (VPN) ወይም ፕሮክሲ ግንኙነት በመጠቀም መክፈል አይቻልም። እባክዎ ቪፒኤንዎን አጥፍተው እንደገና ይሞክሩ።',
    retry: 'እንደገና ሞክር',
    verified: 'አካባቢዎ በተሳካ ሁኔታ ተረጋግጧል!'
  },
  om: {
    title: 'Mirkaneessa Bakkaa Dirqama',
    desc: 'Seera kafaltii naannoo kabajuufii dogoggora ittisuuf maaloo bakka (GPS) bilbila ykn broowzerii keessanii banuun mirkaneessaa.',
    button: 'Bakka Mirkaneessi',
    checking: 'Bakka keessan mirkaneessaa jirra...',
    gpsError: "Tajaajila bakkaa argachuun hin danda'amne. Maaloo eeyyama GPS mirkaneessaa.",
    vpnTitle: 'Gargari Bahiinsa VPN Argameera',
    vpnDesc: "Kafaltii raawwachuuf VPN ykn Proxy fayyadamuun dhorgaadha. Maaloo VPN keessan cufuun irra deebi'anii yaalaa.",
    retry: "Irra Deebi'i Yaali",
    verified: 'Bakki keessan mirkanaa\'eera!'
  },
  ti: {
    title: 'ናይ ቦታ ምርግጋጽ ግዴታ እዩ',
    desc: 'ሕግጋት ክፍሊት ንምኽባርን ጌጋታት ን ምክልኻልን በጃኹም ናይ ሞባይልኩም ወይ ብሮውዘርኩም ሎኬሽን (GPS) የብርሁ።',
    button: 'ቦታ አረጋግጥ',
    checking: 'ቦታኹም ነረጋግጽ ኣለና...',
    gpsError: 'ናይ ቦታ ኣገልግሎት ምርካብ ኣይተኻእለን። በጃኹም ፍቓድ GPS ምሃብኩም ኣረጋግጹ።',
    vpnTitle: 'ናይ ቪፒኤን (VPN) ምትእስሳር ተረኺቡ',
    vpnDesc: 'ቪፒኤን (VPN) ወይ ፕሮክሲ ብምጥቃም ክፍሊት ምፍጻም ኣይፍቀድን። በጃኹም ቪፒኤንኩም ኣጥፊእኩም እንደገና ፈትኑ።',
    retry: 'እንደገና ፈትን',
    verified: 'ቦታኹም ብዓወት ተረጋጊጹ ኣሎ!'
  },
  so: {
    title: 'Xaqiijinta Goobta waa Khasab',
    desc: 'Si loo raaco shuruucda lacag bixinta ee gobolka loona kaftamo khaladaadka, fadlan shid adeega goobta (GPS) ee aaladaada.',
    button: 'Xaqiiji Goobta',
    checking: 'Xaqiijinta goobtaada ayaa socota...',
    gpsError: 'Lama heli karo adeega goobta. Fadlan xaqiiji inaad ogolaatay GPS-ka.',
    vpnTitle: 'Waxaa la Helay VPN Adeegsanaya',
    vpnDesc: 'Lama ogola in lacag lagu bixiyo VPN ama Proxy. Fadlan dami VPN-kaaga kadibna isku day mar kale.',
    retry: 'Isku day Mar Kale',
    verified: 'Goobtaada si guul leh ayaa loo xaqiijiyey!'
  },
  ar: {
    title: 'تأكيد الموقع الجغرافي إلزامي',
    desc: 'للامتثال للوائح الدفع الإقليمية ومنع الأخطاء الجغرافية، يرجى تفعيل خدمة تحديد الموقع (GPS) على جهازك.',
    button: 'تأكيد الموقع الآن',
    checking: 'جاري التحقق من موقعك الجغرافي...',
    gpsError: 'تعذر الوصول إلى الموقع الجغرافي. يرجى التأكد من منح إذن الـ GPS.',
    vpnTitle: 'تم اكتشاف اتصال VPN / Proxy',
    vpnDesc: 'غير مسموح بإتمام الدفع أثناء تفعيل اتصال VPN أو بروكسي. يرجى إيقاف تشغيل الـ VPN والمحاولة مجدداً.',
    retry: 'إعادة المحاولة',
    verified: 'تم تأكيد موقعك الجغرافي بنجاح!'
  },
  en: {
    title: 'Location Access Required',
    desc: 'To comply with regional payment regulations and prevent currency errors, you must share your device location (GPS).',
    button: 'Verify My Location',
    checking: 'Verifying your location...',
    gpsError: 'Unable to retrieve location. Please check your browser location permissions.',
    vpnTitle: 'VPN/Proxy Detected',
    vpnDesc: 'VPN and Proxy networks are restricted during checkout. Please disable your VPN and try again.',
    retry: 'Try Again',
    verified: 'Location verified successfully!'
  }
};

export default function LocationGate({ locale, onVerified }: LocationGateProps) {
  const t = translations[locale as keyof typeof translations] || translations.en;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'none' | 'checking' | 'vpn_detected' | 'error' | 'success'>('none');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto check session storage to bypass if already verified in this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedIsEthiopia = sessionStorage.getItem('verified_is_ethiopia');
      if (cachedIsEthiopia !== null) {
        setStatus('success');
        onVerified(cachedIsEthiopia === 'true');
      }
    }
  }, [onVerified]);

  const verifyLocation = async () => {
    setLoading(true);
    setStatus('checking');
    setErrorMessage('');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage(t.gpsError);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 1. GPS Geofencing for Ethiopia
        // Bound checks: Latitude roughly 3° N to 15° N, Longitude 33° E to 48° E
        const isGpsEthiopia = latitude >= 3.0 && latitude <= 15.0 && longitude >= 33.0 && longitude <= 48.0;

        try {
          // 2. IP Location Lookup (VPN detection cross-check)
          // Using a fast, lightweight country API
          const ipResponse = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(5000) });
          const ipData = await ipResponse.json();
          const isIpEthiopia = ipData?.country === 'ET';

          // 3. VPN Validation Check
          // If GPS is inside Ethiopia but IP claims outside, or vice-versa
          if (isGpsEthiopia !== isIpEthiopia) {
            setStatus('vpn_detected');
            setLoading(false);
            return;
          }

          // Complete verification
          setStatus('success');
          sessionStorage.setItem('verified_is_ethiopia', isGpsEthiopia ? 'true' : 'false');
          onVerified(isGpsEthiopia);
        } catch (ipErr) {
          console.warn('IP verification timed out or failed, falling back to GPS check:', ipErr);
          
          // Fallback: If IP lookup fails, trust GPS boundaries (failsafe)
          setStatus('success');
          sessionStorage.setItem('verified_is_ethiopia', isGpsEthiopia ? 'true' : 'false');
          onVerified(isGpsEthiopia);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setStatus('error');
        setErrorMessage(t.gpsError);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (status === 'success') return null;

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-gray-150 shadow-xl max-w-md mx-auto text-center space-y-8 animate-in fade-in duration-300">
      {status === 'vpn_detected' ? (
        <>
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-100">
            <ShieldAlert size={32} className="animate-pulse" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black text-accent uppercase tracking-tight italic">{t.vpnTitle}</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              {t.vpnDesc}
            </p>
          </div>
          <button
            onClick={verifyLocation}
            className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            {t.retry}
          </button>
        </>
      ) : status === 'checking' ? (
        <>
          <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Loader2 size={32} className="animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-accent uppercase tracking-tight italic">{t.checking}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">
              Security Cross-Check Active
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <MapPin size={32} className="animate-bounce" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight italic">{t.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              {t.desc}
            </p>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold leading-normal">
              {errorMessage}
            </div>
          )}

          <button
            disabled={loading}
            onClick={verifyLocation}
            className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all"
          >
            <ShieldCheck size={14} />
            {t.button}
          </button>
        </>
      )}
    </div>
  );
}
