"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFirebaseWebSocket } from "@/hooks/useFirebaseWebSocket";
import { AnimatePresence } from "framer-motion";
import { websiteAnalytics } from "@/utils/analytics";
import { oracleService } from "@/utils/oracleService";

// Dynamically import components to avoid SSR issues
const BackgroundVideo = dynamic(() => import("@/components/BackgroundVideo"), { ssr: false });
const LeftTypewriter = dynamic(() => import("@/components/LeftTypewriter"), { ssr: false });
const RadialVideoButtons = dynamic(() => import("@/components/RadialVideoButtons"), { ssr: false });
const BottomNavigation = dynamic(() => import("@/components/BottomNavigation"), { ssr: false });
const OracleHub = dynamic(() => import("@/components/OracleHub"), { ssr: false });
const CornerLogo = dynamic(() => import("@/components/CornerLogo"), { ssr: false });
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });

export default function OraclePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [cornerLogoVisible, setCornerLogoVisible] = useState(false);

  // Solana monitoring - using Firebase WebSocket
  const {
    tokens,
    connectionStatus,
    loading: solanaLoading,
    reconnect
  } = useFirebaseWebSocket();

  // Initialize loading state
  useEffect(() => {
    setIsLoading(false);
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

  // Track feature usage
  useEffect(() => {
    websiteAnalytics.trackFeatureUsage('oracle_hub', 'opened');
    console.log("🎯 ORACLE PAGE OPENED - Firebase WebSocket active");
  }, []);

  // Show loading state while checking localStorage
  if (isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading Oracle...</div>
    </div>;
  }

  return (
    <ErrorBoundary>
      <main className="fixed inset-0 overflow-visible">
        {/* Background components */}
        <RetroGeometry isSlow={false} isOracleOpen={true} isScopeOpen={false} />
        <BackgroundVideo isOracleOpen={true} />
        <CornerLogo size={64} isVisible={cornerLogoVisible} />
        
        {/* Oracle Hub component - full screen */}
        <OracleHub 
          isOpen={true}
          onClose={() => window.history.back()}
        />
      </main>
    </ErrorBoundary>
  );
}
