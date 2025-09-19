"use client";
import React, { useEffect, useState } from "react";

interface ZodiacDisplayProps {
  zodiacSign: string;
  onComplete: () => void;
}

export default function ZodiacDisplay({ zodiacSign, onComplete }: ZodiacDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show zodiac display immediately
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-complete after showing zodiac for 1.5 seconds (much faster)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getZodiacVideo = (sign: string): string => {
    // Map zodiac signs to .gif files (all converted for web compatibility)
    const zodiacVideos: { [key: string]: string } = {
      aries: "/zodiac/aries.gif",
      taurus: "/zodiac/taurus.gif",
      gemini: "/zodiac/gemini.gif",
      cancer: "/zodiac/cancer.gif",
      leo: "/zodiac/leo.gif",
      virgo: "/zodiac/virgo.gif",
      libra: "/zodiac/libra.gif",
      scorpio: "/zodiac/scorpio.gif",
      sagittarius: "/zodiac/sagittarius.gif",
      capricorn: "/zodiac/capricorn.gif",  
      aquarius: "/zodiac/aquarius.gif",
      pisces: "/zodiac/pisces.gif"
    };
    
    return zodiacVideos[sign] || "/zodiac/aries.gif";
  };

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-[90] transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8 capitalize" style={{ fontFamily: 'VT323, monospace' }}>
          {zodiacSign}
        </h2>
        
        <div className="w-96 h-96 mx-auto">
          <video
            src={getZodiacVideo(zodiacSign)}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => console.error(`Zodiac video failed to load: ${zodiacSign}`, e)}
          />
        </div>
        
        <p className="text-xl text-white/80" style={{ fontFamily: 'VT323, monospace' }}>
          Welcome to your cosmic journey
        </p>
      </div>
    </div>
  );
}
