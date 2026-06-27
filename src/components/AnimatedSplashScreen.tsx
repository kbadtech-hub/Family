'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AnimatedSplashScreen() {
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

  useEffect(() => {
    // Check if splash was already shown in this session
    const hasShown = sessionStorage.getItem('beteseb_splash_shown');
    if (hasShown) {
      return;
    }
    
    setIsVisible(true);
    
    // Zoom in shortly after mounting
    const scaleUpTimer = setTimeout(() => setScale(1.15), 100);
    
    // Breathing zoom effect cycle (Zoom in / Zoom out)
    const zoomCycle = setInterval(() => {
      setScale(s => (s === 1.15 ? 0.95 : 1.15));
    }, 1200);

    // Fast greeting cycle (cycles every 550ms through 6 languages)
    const greetingCycle = setInterval(() => {
      setGreetingIndex(idx => (idx + 1) % greetings.length);
    }, 550);

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
        {/* Animated Logo inside white background rounded container */}
        <div 
          className="w-44 h-44 rounded-[3rem] bg-white p-4 shadow-2xl flex items-center justify-center transition-transform duration-1000 ease-in-out"
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

        {/* Multilingual Text Section */}
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
            BETESEB SECURE PORTAL
          </p>
          <h1 
            className="text-lg md:text-xl font-black min-h-[44px] tracking-tight italic transition-all duration-300 text-white/95 leading-relaxed"
          >
            {greetings[greetingIndex]}
          </h1>
          <p className="text-[9px] text-gray-500 font-bold max-w-[240px] mx-auto leading-relaxed uppercase tracking-wider">
            Connecting families, honoring values, building secure futures.
          </p>
        </div>
      </div>
    </div>
  );
}
