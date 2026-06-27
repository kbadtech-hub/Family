'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

export default function AnimatedSplashScreen() {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(0.9);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const greetings = [
    "እንኳን ወደ ቤተሰብ በደህና መጡ!", // Amharic
    "Welcome to Beteseb!", // English
    "Baga gara Beteseb nagaan dhuftan!", // Oromo
    "እንቋዕ ናብ ቤተሰብ ብደሓን መጻእኩም!", // Tigrinya
    "مرحباً بكم في بيتسيب!", // Arabic
    "Ku soo dhowaada Beteseb!" // Somali
  ];

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
    
    // Breathing zoom effect cycle (cycles every 2 seconds to match greeting rate)
    const zoomCycle = setInterval(() => {
      setScale(s => (s === 1.15 ? 0.95 : 1.15));
    }, 2000);

    // Multilingual greeting cycle (stays 2 seconds for each language: 12 seconds total)
    const greetingCycle = setInterval(() => {
      setGreetingIndex(idx => (idx + 1) % greetings.length);
    }, 2000);

    // Fade out start at 11.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 11500);

    // Unmount and finish at 12 seconds
    const endTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('beteseb_splash_shown', 'true');
    }, 12000);

    return () => {
      clearTimeout(scaleUpTimer);
      clearInterval(zoomCycle);
      clearInterval(greetingCycle);
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
          className="w-44 h-44 rounded-[3rem] bg-white p-4 shadow-2xl flex items-center justify-center transition-transform duration-[2000ms] ease-in-out"
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
            BETESEB SECURE PORTAL
          </p>
          <h1 
            className="text-lg md:text-xl font-black min-h-[44px] tracking-tight italic transition-all duration-300 text-white/95 leading-relaxed"
          >
            {greetings[greetingIndex]}
          </h1>
          <p className="text-[9px] text-gray-500 font-bold max-w-[320px] mx-auto leading-relaxed uppercase tracking-wider">
            {getSlogan(locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
