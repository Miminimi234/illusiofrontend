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
const Scope = dynamic(() => import("@/components/Scope"), { ssr: false });
const CornerLogo = dynamic(() => import("@/components/CornerLogo"), { ssr: false });
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });

export default function ScopePage() {
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

  // Handle adding searched tokens to the list (REPLACE mode)
  const handleAddToken = (newToken: any) => {
    replaceWithSearchToken(newToken);
  };

  // Handle resetting to original tokens
  const handleResetTokens = () => {
    resetToOriginalTokens();
  };

  // Initialize loading state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Track feature usage
  useEffect(() => {
    websiteAnalytics.trackFeatureUsage('scope', 'opened');
    console.log("🎯 SCOPE PAGE OPENED - Firebase WebSocket active");
  }, []);

  // Show loading state while checking localStorage
  if (isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading Scope...</div>
    </div>;
  }

  return (
    <ErrorBoundary>
      <main className="fixed inset-0 overflow-visible">
        {/* Background components */}
        <RetroGeometry isSlow={false} isOracleOpen={false} isScopeOpen={true} />
        <BackgroundVideo isOracleOpen={false} />
        <CornerLogo size={64} isVisible={cornerLogoVisible} />
        
        {/* Scope component - full screen */}
        <Scope 
          isOpen={true}
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
          onClose={() => window.history.back()}
          onAddToken={handleAddToken}
          onResetTokens={handleResetTokens}
          isSearchMode={isSearchMode}
        />
      </main>
    </ErrorBoundary>
  );
}
