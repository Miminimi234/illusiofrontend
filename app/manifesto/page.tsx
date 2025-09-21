"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFirebaseWebSocket } from "@/hooks/useFirebaseWebSocket";
import { AnimatePresence } from "framer-motion";
import { websiteAnalytics } from "@/utils/analytics";

// Dynamically import components to avoid SSR issues
const BackgroundVideo = dynamic(() => import("@/components/BackgroundVideo"), { ssr: false });
const LeftTypewriter = dynamic(() => import("@/components/LeftTypewriter"), { ssr: false });
const RadialVideoButtons = dynamic(() => import("@/components/RadialVideoButtons"), { ssr: false });
const BottomNavigation = dynamic(() => import("@/components/BottomNavigation"), { ssr: false });
const Manifesto = dynamic(() => import("@/components/Manifesto"), { ssr: false });
const CornerLogo = dynamic(() => import("@/components/CornerLogo"), { ssr: false });
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });

export default function ManifestoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [cornerLogoVisible, setCornerLogoVisible] = useState(false);

  // Solana monitoring - using Firebase WebSocket
  const {
    tokens,
    connectionStatus,
    loading: solanaLoading,
    reconnect,
    addToken,
    replaceWithSearchToken,
    resetToOriginalTokens,
    isSearchMode
  } = useFirebaseWebSocket();

  // Initialize loading state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Track feature usage
  useEffect(() => {
    websiteAnalytics.trackFeatureUsage('manifesto', 'opened');
    console.log("🎯 MANIFESTO PAGE OPENED - Firebase WebSocket active");
  }, []);

  // Show loading state while checking localStorage
  if (isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading Manifesto...</div>
    </div>;
  }

  return (
    <ErrorBoundary>
      <main className="fixed inset-0 overflow-visible">
        {/* Background components */}
        <RetroGeometry isSlow={false} isOracleOpen={false} isScopeOpen={false} />
        <BackgroundVideo isOracleOpen={false} />
        <CornerLogo size={64} isVisible={cornerLogoVisible} />
        
        {/* Manifesto component - full screen */}
        <Manifesto 
          isOpen={true}
          onClose={() => window.history.back()}
        />
      </main>
    </ErrorBoundary>
  );
}
