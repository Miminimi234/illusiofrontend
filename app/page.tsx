"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFirebaseWebSocket } from "@/hooks/useFirebaseWebSocket";
import { AnimatePresence } from "framer-motion";
import { oracleService } from "@/utils/oracleService";
import { websiteAnalytics } from "@/utils/analytics";


// Dynamically import all components to avoid SSR issues
const BackgroundVideo = dynamic(() => import("@/components/BackgroundVideo"), { ssr: false });
const LeftTypewriter = dynamic(() => import("@/components/LeftTypewriter"), { ssr: false });
const RadialVideoButtons = dynamic(() => import("@/components/RadialVideoButtons"), { ssr: false });
const BottomNavigation = dynamic(() => import("@/components/BottomNavigation"), { ssr: false });
const Scope = dynamic(() => import("@/components/Scope"), { ssr: false });
const NavigationHub = dynamic(() => import("@/components/NavigationHub"), { ssr: false });
const OracleHub = dynamic(() => import("@/components/OracleHub"), { ssr: false });
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });
const Manifesto = dynamic(() => import("@/components/Manifesto"), { ssr: false });
const CornerLogo = dynamic(() => import("@/components/CornerLogo"), { ssr: false });

export default function Page() {
  const [isNavigationHubOpen, setIsNavigationHubOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [isOracleHubOpen, setIsOracleHubOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cornerLogoVisible, setCornerLogoVisible] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Solana monitoring - now using Firebase WebSocket
  const {
    tokens,
    connectionStatus,
    loading: solanaLoading,
    reconnect
  } = useFirebaseWebSocket();

  // Handle adding searched tokens to the list (REPLACE mode)
  const handleAddToken = (newToken: any) => {
    // TODO: Implement token addition logic
    console.log('Add token:', newToken);
  };

  // Handle resetting to original tokens
  const handleResetTokens = () => {
    // TODO: Implement token reset logic
    console.log('Reset tokens');
  };



  // Debug logging for state changes
  useEffect(() => {
    console.log("🎯 STATE CHANGED - isScopeOpen:", isScopeOpen, "isNavigationHubOpen:", isNavigationHubOpen, "isOracleHubOpen:", isOracleHubOpen, "isManifestoOpen:", isManifestoOpen);
    // console.log("🎯 TOKENS STATE:", { tokensCount: tokens.length, loading: solanaLoading, connected: connectionStatus.isConnected });
    
    // Track feature usage
    if (isScopeOpen) {
      websiteAnalytics.trackFeatureUsage('scope', 'opened');
      console.log("🎯 SCOPE IS NOW OPEN - Firebase WebSocket active");
    } else {
      websiteAnalytics.trackFeatureUsage('scope', 'closed');
      console.log("🎯 SCOPE IS NOW CLOSED - Firebase WebSocket active");
    }
    
    if (isNavigationHubOpen) {
      websiteAnalytics.trackFeatureUsage('navigation_hub', 'opened');
    } else {
      websiteAnalytics.trackFeatureUsage('navigation_hub', 'closed');
    }
    
    if (isOracleHubOpen) {
      websiteAnalytics.trackFeatureUsage('oracle_hub', 'opened');
    } else {
      websiteAnalytics.trackFeatureUsage('oracle_hub', 'closed');
    }
    
    if (isManifestoOpen) {
      websiteAnalytics.trackFeatureUsage('manifesto', 'opened');
    } else {
      websiteAnalytics.trackFeatureUsage('manifesto', 'closed');
    }
  }, [isScopeOpen, isNavigationHubOpen, isOracleHubOpen, isManifestoOpen]);

  // Smooth CornerLogo visibility transitions
  useEffect(() => {
    const shouldBeVisible = !isScopeOpen && !isNavigationHubOpen && !isOracleHubOpen && !isManifestoOpen;
    
    if (shouldBeVisible) {
      // Show immediately when closing hubs
      setCornerLogoVisible(true);
    } else {
      // Small delay when opening hubs to prevent flash
      const timer = setTimeout(() => {
        setCornerLogoVisible(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isScopeOpen, isNavigationHubOpen, isOracleHubOpen, isManifestoOpen]);

  // Initialize basic state first
  useEffect(() => {
    console.log('🔍 Initial useEffect running...');
    
    try {
      console.log('🔍 Setting up main page directly...');
      setIsLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error('🔍 Error in initial useEffect:', error);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);


  // Fallback timeout to ensure loading is cleared
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 Loading timeout fallback - setting isLoading to false');
      setIsLoading(false);
      setIsInitialized(true);
    }, 1000); // 1 second timeout

    return () => clearTimeout(timer);
  }, []);

  // Initialize Oracle service to run 24/7
  useEffect(() => {
    console.log('🚀 Initializing Oracle service for 24/7 operation...');
    oracleService.startOracle();
    
    // Cleanup on unmount
    return () => {
      console.log('🛑 Cleaning up Oracle service...');
      oracleService.stopOracle();
    };
  }, []);




  // Show loading state while initializing
  if (isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>;
  }

  // Show main page directly
  return (
    <ErrorBoundary>
      <main className="fixed inset-0 overflow-visible">
        {/* Always show background components - Scope will overlay on top */}
        <RetroGeometry isSlow={isNavigationHubOpen} isOracleOpen={isOracleHubOpen} isScopeOpen={isScopeOpen} />
        <BackgroundVideo isOracleOpen={isOracleHubOpen} />
        {!isOracleHubOpen && !isScopeOpen && <LeftTypewriter />}
        <CornerLogo size={64} isVisible={cornerLogoVisible} />
        <RadialVideoButtons 
          isNavigationHubOpen={isNavigationHubOpen}
          setIsNavigationHubOpen={setIsNavigationHubOpen}
          isScopeOpen={isScopeOpen}
          setIsScopeOpen={setIsScopeOpen}
          isOracleHubOpen={isOracleHubOpen}
          setIsOracleHubOpen={setIsOracleHubOpen}
          isManifestoOpen={isManifestoOpen}
          setIsManifestoOpen={setIsManifestoOpen}
        />
        <BottomNavigation isNavigationHubOpen={isNavigationHubOpen} isOracleHubOpen={isOracleHubOpen} isScopeOpen={isScopeOpen} />
        
        {/* NAVIGATION HUB component - overlays on top of background */}
        <AnimatePresence mode="wait">
          {isNavigationHubOpen && (
            <NavigationHub 
              key="navigation"
              isOpen={isNavigationHubOpen}
              onClose={() => setIsNavigationHubOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* SCOPE component - now overlays on top of background */}
        <AnimatePresence mode="wait">
          {isScopeOpen && (
            <Scope 
              key="scope"
              isOpen={isScopeOpen}
              tokens={tokens}
              isLoading={solanaLoading}
              lastUpdate={new Date()}
              stats={{ totalTokens: tokens.length }}
              connectionStatus={connectionStatus.isConnected ? "Connected" : "Disconnected"}
              live={true}
              resumeLive={() => {}}
              pauseLive={() => {}}
              pauseLiveOnHover={() => {}}
              resumeLiveAfterHover={() => {}}
              isHoverPaused={false}
              queuedTokens={[]}
              newTokenMint={null}
              onClose={() => setIsScopeOpen(false)}
              onAddToken={handleAddToken}
              onResetTokens={handleResetTokens}
              isSearchMode={false}
            />
          )}
        </AnimatePresence>

        {/* ORACLE HUB component - overlays on top of background */}
        <OracleHub 
          isOpen={isOracleHubOpen}
          onClose={() => setIsOracleHubOpen(false)}
        />

        {/* MANIFESTO component - overlays on top of background */}
        <AnimatePresence mode="wait">
          {isManifestoOpen && (
            <Manifesto 
              key="manifesto"
              isOpen={isManifestoOpen}
              onClose={() => setIsManifestoOpen(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </ErrorBoundary>
  );
}
