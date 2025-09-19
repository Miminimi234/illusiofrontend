"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// EXACT same imports as main page
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });
const BackgroundVideo = dynamic(() => import("@/components/BackgroundVideo"), { ssr: false });

export default function MobilePage() {
  const [visibleButtons, setVisibleButtons] = useState<number[]>([]);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    document.title = 'Illusio - Mobile Coming Soon';
    console.log('Mobile page loaded');
    
    // Force zoom out effect on mobile by clearing the session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('geometryHasZoomed');
      // Set a custom mobile zoom level to start even smaller
      sessionStorage.setItem('mobileZoomStart', '0.1');
    }

    // Force hide cursor on mobile - AGGRESSIVE APPROACH
    const hideCursor = () => {
      document.body.style.cursor = 'none';
      document.documentElement.style.cursor = 'none';
      // Override any canvas cursor settings
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        canvas.style.cursor = 'none';
      });
    };
    
    hideCursor();
    
    // Continuously hide cursor to override RetroGeometry
    const cursorInterval = setInterval(hideCursor, 100);
    
    // Cleanup function to restore cursor when component unmounts
    return () => {
      clearInterval(cursorInterval);
      document.body.style.cursor = 'auto';
      document.documentElement.style.cursor = 'auto';
    };
  }, []);

  // Staggered appearance of buttons after zoom effect (wait 4 seconds for zoom to complete)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Start appearing buttons one by one with 400ms delay between each
      const showButtons = () => {
        setVisibleButtons(prev => {
          if (prev.length < 3) {
            return [...prev, prev.length];
          }
          return prev;
        });
      };

      // Show first button immediately, then stagger the rest
      showButtons();
      const intervalId = setInterval(() => {
        showButtons();
      }, 400);

      // Clean up interval after all buttons are shown
      setTimeout(() => {
        clearInterval(intervalId);
      }, 1200); // 3 buttons * 400ms = 1200ms
    }, 4000); // Wait 4 seconds for zoom effect to complete

    return () => clearTimeout(timer);
  }, []);

  // Glitch effect timer - triggers every 10 seconds (same as main page)
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      
      // Glitch duration - random between 200-500ms
      const glitchDuration = 200 + Math.random() * 300;
      
      setTimeout(() => {
        setIsGlitching(false);
      }, glitchDuration);
    }, 10000); // Every 10 seconds

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      touchAction: 'none',
      userSelect: 'none',
      pointerEvents: 'none',
      cursor: 'none'
    }}>
      {/* EXACT same background components as main page */}
      <RetroGeometry key="mobile-geometry" isSlow={false} isOracleOpen={false} isScopeOpen={false} />
      <BackgroundVideo key="mobile-video" isOracleOpen={false} />
      
      {/* Content overlay - PERFECTLY CENTERED */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ 
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        cursor: 'none'
      }}>
        <div className="text-center max-w-sm mx-auto px-6">
          {/* Main message */}
          <h1 
            className={`text-2xl font-bold text-white mb-4 font-mono transition-all duration-75 ${
              isGlitching ? 'illusio-glitch-effect' : ''
            }`}
            style={{ 
              fontFamily: 'VT323, monospace',
              textShadow: isGlitching 
                ? '2px 0 0 #ff0000, -2px 0 0 #00ffff, 0 2px 0 #00ff00, 0 -2px 0 #ffff00'
                : '0 0 10px rgba(255, 255, 255, 0.5)',
              filter: isGlitching 
                ? 'hue-rotate(90deg) saturate(2) contrast(1.5)'
                : 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))',
              transform: isGlitching 
                ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`
                : 'translate(0, 0)'
            }}
          >
            ILLUSIO
          </h1>
          
          <p className="text-gray-300 text-base leading-relaxed">
            Mobile version under construction. Please visit us on desktop for the full experience.
          </p>
        </div>
      </div>

      {/* Social Buttons - Animate in after zoom effect */}
      <div 
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-6"
        style={{ pointerEvents: 'auto', cursor: 'none' }}
      >
        {/* X (Twitter) Button */}
        <button
          onClick={() => window.open('https://x.com/IllusioAI', '_blank')}
          className="w-12 h-12 flex items-center justify-center hover:scale-125 hover:drop-shadow-lg transition-all duration-300"
          style={{
            opacity: visibleButtons.includes(0) ? 1 : 0,
            transform: visibleButtons.includes(0) ? 'scale(1)' : 'scale(0.8)',
          }}
        >
          <svg 
            className="w-6 h-6 text-white hover:text-white/80 transition-colors duration-300" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>

        {/* GitHub Button */}
        <button
          onClick={() => window.open('https://github.com/IllusioAI/Illusio', '_blank')}
          className="w-12 h-12 flex items-center justify-center hover:scale-125 hover:drop-shadow-lg transition-all duration-300"
          style={{
            opacity: visibleButtons.includes(1) ? 1 : 0,
            transform: visibleButtons.includes(1) ? 'scale(1)' : 'scale(0.8)',
          }}
        >
          <svg 
            className="w-6 h-6 text-white hover:text-white/80 transition-colors duration-300" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </button>

        {/* Document Button - Coming Soon */}
        <div 
          className="relative w-12 h-12 flex items-center justify-center hover:scale-125 hover:drop-shadow-lg transition-all duration-300 cursor-not-allowed group"
          style={{
            opacity: visibleButtons.includes(2) ? 1 : 0,
            transform: visibleButtons.includes(2) ? 'scale(1)' : 'scale(0.8)',
          }}
        >
          <svg 
            className="w-6 h-6 text-white/60 group-hover:text-white/40 transition-colors duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          {/* Coming Soon Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50">
            Coming soon
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>
        </div>
      </div>
    </main>
  );
}