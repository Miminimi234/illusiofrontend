"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface RadialVideoButtonsProps {
  isNavigationHubOpen: boolean;
  setIsNavigationHubOpen: (open: boolean) => void;
  isScopeOpen: boolean;
  setIsScopeOpen: (open: boolean) => void;
  isOracleHubOpen: boolean;
  setIsOracleHubOpen: (open: boolean) => void;
  isManifestoOpen: boolean;
  setIsManifestoOpen: (open: boolean) => void;
}

export default function RadialVideoButtons({ isNavigationHubOpen, setIsNavigationHubOpen, isScopeOpen, setIsScopeOpen, isOracleHubOpen, setIsOracleHubOpen, isManifestoOpen, setIsManifestoOpen }: RadialVideoButtonsProps) {
  const router = useRouter();
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [visibleButtons, setVisibleButtons] = useState<number[]>([]);
  const [hasButtonsAppeared, setHasButtonsAppeared] = useState(false);

  // Debug: Log when buttons are rendered (but only when state changes to avoid infinite loops)
  useEffect(() => {
    // Button states updated
  }, [isScopeOpen, isNavigationHubOpen, isOracleHubOpen, isManifestoOpen]);



  // Smooth hover handling without jumping
  const handleMouseEnter = (pos: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set hover state immediately but smoothly
    setHoveredButton(pos);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clear hover state immediately
    setHoveredButton(null);
  };

  const BUTTONS = [
    { pos: "navigation", color: "#FF6B6B", alt: "Navigation", onClick: () => router.push('/navigation'), video: "/1.webm", type: "webm" },
    { pos: "oracle", color: "#96CEB4", alt: "Oracle", onClick: () => router.push('/oracle'), video: "/4.webm", type: "webm" },
    { pos: "scope", color: "#45B7D1", alt: "Scope", onClick: () => {
      try {
        router.push('/scope');
      } catch (error) {
        console.error("Error in scope button click handler:", error);
      }
    }, video: "/3.webm", type: "webm" },
    { pos: "manifesto", color: "#4ECDC4", alt: "Manifesto", onClick: () => router.push('/manifesto'), video: "/2.webm", type: "webm" },
  ];

  // Check if buttons have appeared before on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const buttonsAppeared = sessionStorage.getItem('buttonsHaveAppeared');
      setHasButtonsAppeared(buttonsAppeared === 'true');
    }
  }, []);

  // Smooth appearance of all buttons after zoom animation, or show all immediately if any hub is open
  useEffect(() => {
    // If any hub is open, show all buttons immediately
    if (isNavigationHubOpen || isScopeOpen || isOracleHubOpen || isManifestoOpen) {
      setVisibleButtons([0, 1, 2, 3]);
      return;
    }

    // If buttons have appeared before, show them immediately
    if (hasButtonsAppeared) {
      setVisibleButtons([0, 1, 2, 3]);
      return;
    }
    
    const timer = setTimeout(() => {
      // Show all buttons at once with smooth fade-in
      setVisibleButtons([0, 1, 2, 3]);
      setHasButtonsAppeared(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buttonsHaveAppeared', 'true');
      }
    }, 3500); // Wait for zoom animation to fully complete (zoom takes ~3.5 seconds)

    return () => {
      clearTimeout(timer);
    };
  }, [isNavigationHubOpen, isScopeOpen, isOracleHubOpen, isManifestoOpen, hasButtonsAppeared]);




  return (
    <>
      <div className="fixed inset-0 z-[30] pointer-events-none radial-video-buttons">
        <div 
          className={`absolute top-6 right-6 pointer-events-auto transition-all duration-500 ease-out ${
            isOracleHubOpen || isScopeOpen || isManifestoOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
        >
          {/* Container for all buttons arranged horizontally */}
          <div className="flex items-center gap-2">
            {BUTTONS.map(({ pos, color, alt, onClick, video, type }, index) => (
              <div
                key={pos}
                className="w-12 h-12 rounded-full pointer-events-auto cursor-pointer overflow-hidden webm-button"
                style={{
                  backgroundColor: type === "icon" ? color : "transparent",
                  opacity: visibleButtons.includes(index) ? 1 : 0,
                  transition: 'opacity 0.5s ease-out',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                onMouseEnter={(e) => handleMouseEnter(pos, e)}
                onMouseLeave={(e) => handleMouseLeave(e)}
              >
                <div 
                  className="w-full h-full rounded-full overflow-hidden transition-all duration-300 ease-out flex items-center justify-center"
                  style={{ 
                    animation: 'pulse 2s infinite',
                    opacity: hoveredButton === pos ? 1 : 0.85,
                    filter: hoveredButton === pos ? 'brightness(1.3) saturate(1.1)' : 'brightness(1) saturate(1)',
                    transform: hoveredButton === pos ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <video
                    src={video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tooltip for Navigation Hub */}
      {hoveredButton === "navigation" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            right: '24px',
            top: '80px',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Retrocausal Lab</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Wallet movements, buyer and seller volume, and trading patterns all feed into one predictive model — explained through the retrocausal lens of the quantum eraser.
          </div>
        </div>
      )}
      
      {/* Tooltip for Scope */}
      {hoveredButton === "scope" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            right: '24px',
            top: '80px',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Scope</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Watch new tokens emerge in real time. Predictions are drawn from wallet flows, trading volume, and zodiac patterns, modeled through retrocausal logic of the quantum eraser.
          </div>
        </div>
      )}
      
      {/* Tooltip for Oracle */}
      {hoveredButton === "oracle" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            right: '24px',
            top: '80px',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Oracle</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Retrocausality made conversational. AI agents debate trades as if tomorrow already happened, weaving time-bent insights into a market outlook.
          </div>
        </div>
      )}
      
      {/* Tooltip for Manifesto */}
      {hoveredButton === "manifesto" && (
        <div 
          className="fixed z-[60] bg-black/90 border border-white/20 rounded-lg p-4 text-white max-w-xs pointer-events-none"
          style={{
            right: '24px',
            top: '80px',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div className="text-lg font-bold mb-2">Manifesto</div>
          <div className="text-sm text-white/80 leading-relaxed">
            Our philosophy on markets, simulation, and the tools we build to cut through the noise and find the truth.
          </div>
        </div>
      )}

      
    </>
  );
}
