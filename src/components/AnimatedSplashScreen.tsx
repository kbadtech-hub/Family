'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

export default function AnimatedSplashScreen() {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(0.9);
  const [opacity, setOpacity] = useState(1);

  // Localized Header above the greeting
  const getPortalHeader = (lang: string) => {
    switch (lang) {
      case 'am': return 'የቤተሰብ ደህንነቱ የተጠበቀ መግቢያ';
      case 'om': return 'PORTALII MAATII DEEBANEE CAME';
      case 'ti': return 'ናይ ቤተሰብ ድሕንነቱ ዝተሓለወ መእተዊ';
      case 'ar': return 'بوابة بيتسيب الآمنة';
      case 'so': return 'MINTIDKA AL-AMIN E QOYSKA';
      default: return 'BETESEB SECURE PORTAL';
    }
  };

  // Localized Greeting
  const getGreeting = (lang: string) => {
    switch (lang) {
      case 'am': return 'እንኳን ወደ ቤተሰብ በደህና መጡ!';
      case 'om': return 'Baga gara Beteseb nagaan dhuftan!';
      case 'ti': return 'እንቋዕ ናብ ቤተሰብ ብደሓን መጻእኩም!';
      case 'ar': return 'مرحباً بكم في بيتسيب!';
      case 'so': return 'Ku soo dhowaada Beteseb!';
      default: return 'Welcome to Beteseb!';
    }
  };

  // Localized Slogan Slogan
  const getSlogan = (lang: string) => {
    switch (lang) {
      case 'am': return 'ቤተሰብን ማገናኘት፣ እሴቶችን ማክበር፣ አስተማማኝ የወደፊት ሕይወትን መገንባት።';
      case 'om': return 'Maatii walitti fiduu, qulqullina kabajuu, fuuldura amansiisaa ijaaruu.';
      case 'ti': return 'ስድራቤታት ምትእስሳር፡ እሴታት ምኽባር፡ ድሕንነቱ ዝተሓለወ መጻኢ ምህናፅ።';
      case 'ar': return 'ربط العائلات، تكريم القيم، بناء مستقبل آمن.';
      case 'so': return 'Isku xirka qoysaska, dhowridda qiyamka, dhisidda mustaqbal aamin ah.';
      default: return 'Connecting families, honoring values, building secure futures.';
    }
  };

  useEffect(() => {
    // Check if splash was already shown in this session
    const hasShown = sessionStorage.getItem('beteseb_splash_shown');
    if (hasShown) {
      return;
    }
    
    setIsVisible(true);
    
    // Zoom in shortly after mounting
    const scaleUpTimer = setTimeout(() => setScale(1.15), 100);
    
    // Breathing zoom effect cycle (synchronized for smooth pulsing)
    const zoomCycle = setInterval(() => {
      setScale(s => (s === 1.15 ? 0.95 : 1.15));
    }, 1200);

    // Fade out start at 3.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 3500);

    // Unmount and finish at 4 seconds
    const endTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('beteseb_splash_shown', 'true');
    }, 4000);

    return () => {
      clearTimeout(scaleUpTimer);
      clearInterval(zoomCycle);
      clearTimeout(fadeOutTimer);
      clearTimeout(endTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#0F172A] z-[9999] flex flex-col items-center justify-center p-6 text-white transition-opacity duration-500 select-none pointer-events-none"
      style={{ opacity }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_65%)] opacity-20" />
      
      <div className="relative flex flex-col items-center space-y-10 text-center max-w-md">
        {/* Animated Logo Container */}
        <div 
          className="w-44 h-44 rounded-[3rem] bg-white p-4 shadow-2xl flex items-center justify-center transition-transform duration-[1200ms] ease-in-out"
          style={{ transform: `scale(${scale})` }}
        >
          <Image 
            src="/logo.png" 
            alt="Beteseb Logo" 
            width={140} 
            height={140} 
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
            {getPortalHeader(locale)}
          </p>
          <h1 
            className="text-lg md:text-xl font-black min-h-[44px] tracking-tight italic transition-all duration-300 text-white/95 leading-relaxed"
          >
            {getGreeting(locale)}
          </h1>
          <p className="text-[9px] text-gray-500 font-bold max-w-[320px] mx-auto leading-relaxed uppercase tracking-wider">
            {getSlogan(locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
