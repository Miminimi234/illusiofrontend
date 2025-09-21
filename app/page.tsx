"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
const BirthdayEntry = dynamic(() => import("@/components/BirthdayEntry"), { ssr: false });
const Scope = dynamic(() => import("@/components/Scope"), { ssr: false });
const NavigationHub = dynamic(() => import("@/components/NavigationHub"), { ssr: false });
const OracleHub = dynamic(() => import("@/components/OracleHub"), { ssr: false });
const RetroGeometry = dynamic(() => import("@/components/RetroGeometry"), { ssr: false });
const Manifesto = dynamic(() => import("@/components/Manifesto"), { ssr: false });
const CornerLogo = dynamic(() => import("@/components/CornerLogo"), { ssr: false });

export default function Page() {
  const router = useRouter();
  const [userBirthday, setUserBirthday] = useState<Date | null>(null);
  const [zodiacSign, setZodiacSign] = useState<string>("");
  const [showMainPage, setShowMainPage] = useState(false);
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
      const savedBirthday = localStorage.getItem('userBirthday');
      const savedZodiacSign = localStorage.getItem('zodiacSign');
      
      console.log('🔍 localStorage values:', {
        savedBirthday: !!savedBirthday,
        savedZodiacSign: !!savedZodiacSign
      });
      
      if (savedBirthday && savedZodiacSign) {
        console.log('🔍 Found saved data, setting up main page...');
        setUserBirthday(new Date(savedBirthday));
        setZodiacSign(savedZodiacSign);
        setShowMainPage(true);
      } else {
        console.log('🔍 No saved data, will show birthday entry...');
        setShowMainPage(false);
      }
      
      console.log('🔍 Setting isLoading to false and initialized to true...');
      setIsLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error('🔍 Error in initial useEffect:', error);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Handle URL params after initialization
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    console.log('🔍 Handling URL params...');
    const urlParams = new URLSearchParams(window.location.search);
    const hub = urlParams.get('hub');
    if (hub) {
      console.log('🔍 URL hub parameter:', hub);
      switch (hub) {
        case 'scope':
          setIsScopeOpen(true);
          break;
        case 'navigation':
          setIsNavigationHubOpen(true);
          break;
        case 'oracle':
          setIsOracleHubOpen(true);
          break;
        case 'manifesto':
          setIsManifestoOpen(true);
          break;
      }
    }
  }, [isInitialized]);

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

  const handleBirthdaySubmit = (birthday: Date) => {
    setUserBirthday(birthday);
    
    // Calculate zodiac sign
    const month = birthday.getMonth() + 1;
    const day = birthday.getDate();
    
    let sign = "";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sign = "aries";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sign = "taurus";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sign = "gemini";
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sign = "cancer";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sign = "leo";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sign = "virgo";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sign = "libra";
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sign = "scorpio";
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sign = "sagittarius";
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sign = "capricorn";
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sign = "aquarius";
    else sign = "pisces";
    
    setZodiacSign(sign);
    
    // Save to localStorage
    localStorage.setItem('userBirthday', birthday.toISOString());
    localStorage.setItem('zodiacSign', sign);
    
    // Don't automatically proceed - let the user click the button in BirthdayEntry
  };

  const handleProceedToMainPage = () => {
    setShowMainPage(true);
  };


  // Functions to handle hub navigation with URL routing
  const saveScopeState = (isOpen: boolean) => {
    setIsScopeOpen(isOpen);
    if (isOpen) {
      router.push('/scope');
    } else {
      router.push('/');
    }
  };

  const saveNavigationState = (isOpen: boolean) => {
    setIsNavigationHubOpen(isOpen);
    if (isOpen) {
      router.push('/navigation');
    } else {
      router.push('/');
    }
  };

  const saveOracleState = (isOpen: boolean) => {
    setIsOracleHubOpen(isOpen);
    if (isOpen) {
      router.push('/oracle');
    } else {
      router.push('/');
    }
  };

  const saveManifestoState = (isOpen: boolean) => {
    setIsManifestoOpen(isOpen);
    if (isOpen) {
      router.push('/manifesto');
    } else {
      router.push('/');
    }
  };

  // Show loading state while checking localStorage
  if (isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>;
  }

  // Show birthday entry first (only if no saved data)
  if (!userBirthday) {
    return <BirthdayEntry onBirthdaySubmit={handleBirthdaySubmit} onProceedToMainPage={handleProceedToMainPage} />;
  }

  // No longer need separate zodiac display - it's now integrated into BirthdayEntry

  // Show main page
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
          setIsNavigationHubOpen={saveNavigationState}
          isScopeOpen={isScopeOpen}
          setIsScopeOpen={saveScopeState}
          isOracleHubOpen={isOracleHubOpen}
          setIsOracleHubOpen={saveOracleState}
          isManifestoOpen={isManifestoOpen}
          setIsManifestoOpen={saveManifestoState}
        />
        <BottomNavigation isNavigationHubOpen={isNavigationHubOpen} isOracleHubOpen={isOracleHubOpen} isScopeOpen={isScopeOpen} />
        
        {/* NAVIGATION HUB component - overlays on top of background */}
        <AnimatePresence mode="wait">
          {isNavigationHubOpen && (
            <NavigationHub 
              key="navigation"
              isOpen={isNavigationHubOpen}
              onClose={() => saveNavigationState(false)}
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
              onClose={() => saveScopeState(false)}
              onAddToken={handleAddToken}
              onResetTokens={handleResetTokens}
              isSearchMode={false}
            />
          )}
        </AnimatePresence>

        {/* ORACLE HUB component - overlays on top of background */}
        <OracleHub 
          isOpen={isOracleHubOpen}
          onClose={() => saveOracleState(false)}
        />

        {/* MANIFESTO component - overlays on top of background */}
        <AnimatePresence mode="wait">
          {isManifestoOpen && (
            <Manifesto 
              key="manifesto"
              isOpen={isManifestoOpen}
              onClose={() => saveManifestoState(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </ErrorBoundary>
  );
}
