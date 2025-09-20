import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "./useWebSocket";

// Server API base URL
const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

// Types matching the server API
export interface ServerTokenData {
  id: number;
  name?: string;
  symbol?: string;
  mint: string; // Fixed: backend returns 'mint' not 'contract_address'
  creator?: string;
  source: string;
  launch_time?: string;
  decimals: number;
  supply: number;
  blocktime: string; // Fixed: backend returns string, not number
  status: 'fresh' | 'active' | 'curve';
  metadata_uri?: string;
  image_url?: string;
  bonding_curve_address?: string;
  is_on_curve: boolean;
  created_at: string;
  updated_at: string;
  display_name?: string;
  // Social media links from metadata
  website?: string;
  twitter?: string;
  telegram?: string;
  // Fixed: backend returns these properties directly on the token, not nested
  price_usd?: string | number;
  marketcap?: string | number;
  volume_24h?: string | number;
  liquidity?: string | number;
}

// Transformed token data for the frontend components
export interface TransformedTokenData {
  mint: string;
  name?: string;
  symbol?: string;
  decimals: number;
  supply: number;
  blocktime: number;
  status: 'fresh' | 'active' | 'curve';
  imageUrl?: string;
  metadataUri?: string;
  isOnCurve: boolean;
  bondingCurveAddress?: string;
  marketcap?: number;
  price_usd?: number;
  volume_24h?: number;
  liquidity?: number;
  source: string;
  // Social media links from metadata
  website?: string;
  twitter?: string;
  telegram?: string;
  links: {
    dexscreener: string;
    jupiter: string;
    explorer: string;
  };
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Stats {
  totalTokens: number;
  freshTokens: number;
  activeTokens: number;
}

// Transform server data to frontend format
const transformTokenData = (serverToken: ServerTokenData): TransformedTokenData => {
  return {
    mint: serverToken.mint, // Fixed: use 'mint' property
    name: serverToken.name,
    symbol: serverToken.symbol,
    decimals: serverToken.decimals,
    supply: serverToken.supply,
    blocktime: new Date(serverToken.blocktime).getTime(), // Convert string to timestamp
    status: serverToken.status,
    imageUrl: serverToken.image_url,
    metadataUri: serverToken.metadata_uri,
    isOnCurve: serverToken.is_on_curve,
    bondingCurveAddress: serverToken.bonding_curve_address,
    marketcap: serverToken.marketcap ? Number(serverToken.marketcap) : undefined, // Convert string to number
    price_usd: serverToken.price_usd ? Number(serverToken.price_usd) : undefined, // Convert string to number
    volume_24h: serverToken.volume_24h ? Number(serverToken.volume_24h) : undefined, // Convert string to number
    liquidity: serverToken.liquidity ? Number(serverToken.liquidity) : undefined, // Convert string to number
    source: serverToken.source,
    // Social media links from metadata
    website: serverToken.website,
    twitter: serverToken.twitter,
    telegram: serverToken.telegram,
    links: {
      dexscreener: `https://dexscreener.com/solana/${serverToken.mint}`,
      jupiter: `https://jup.ag/swap/SOL-${serverToken.mint}`,
      explorer: `https://solscan.io/token/${serverToken.mint}`,
    },
    createdAt: new Date(serverToken.created_at)
  };
};

export const useServerData = (isOpen: boolean) => {
  const [tokens, setTokens] = useState<TransformedTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting to server...");
  const [stats, setStats] = useState<Stats>({
    totalTokens: 0,
    freshTokens: 0,
    activeTokens: 0
  });
  const [live, setLive] = useState<boolean>(true);
  const [newTokenMint, setNewTokenMint] = useState<string | null>(null);
  const [isHoverPaused, setIsHoverPaused] = useState<boolean>(false);
  const [queuedTokens, setQueuedTokens] = useState<TransformedTokenData[]>([]);

  // WebSocket connection for real-time updates
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
  const { isConnected: wsConnected, lastMessage } = useWebSocket(wsUrl);

  // Fetch tokens from server
  const fetchTokens = useCallback(async () => {
    try {
      // console.log("🔍 Fetching tokens from:", `${SERVER_BASE_URL}/api/tokens?limit=100`);
      setConnectionStatus("Fetching tokens...");
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens?limit=100`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      // console.log("📊 Received data:", { itemsCount: data?.items?.length, total: data?.total, isArray: Array.isArray(data) });
      
      // Handle both old and new API response formats
      const total = data?.total ?? data?.items?.length ?? (Array.isArray(data) ? data.length : 0);
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      
      const transformedTokens = items.map(transformTokenData);
      
      // Merge with existing tokens to prevent duplicates and preserve WebSocket-added tokens
      setTokens(prev => {
        const existingMints = new Set(prev.map(t => t.mint));
        const newTokens = transformedTokens.filter((t: any) => !existingMints.has(t.mint));
        
          // If there are new tokens from server, add them to the beginning
          if (newTokens.length > 0) {
            // console.log(`📥 Added ${newTokens.length} new tokens from server refresh`);
            const combined = [...newTokens, ...prev];
            // NO LIMIT - keep all tokens to prevent fresh mints from disappearing
            return combined;
          }
        
        // If no new tokens, just update existing ones with fresh data
        const updatedTokens = prev.map(existingToken => {
          const serverToken = transformedTokens.find((t: any) => t.mint === existingToken.mint);
          if (serverToken) {
            // Preserve existing market cap and volume data if server doesn't have it
            const updatedToken = {
              ...serverToken,
              marketcap: serverToken.marketcap || existingToken.marketcap,
              volume_24h: serverToken.volume_24h || existingToken.volume_24h,
              price_usd: serverToken.price_usd || existingToken.price_usd,
              liquidity: serverToken.liquidity || existingToken.liquidity
            };
            
            // Debug: Log if market cap data is being preserved
            if (existingToken.marketcap && !serverToken.marketcap) {
            }
            
            return updatedToken;
          }
          return existingToken;
        });
        
        return updatedTokens;
      });
      
      setLastUpdate(new Date());
      setConnectionStatus(wsConnected ? "Connected to server (Live)" : "Connected to server");
      
      // Calculate stats from the data
      const newStats = {
        totalTokens: total,
        freshTokens: items.filter((t: any) => t.status === 'fresh').length,
        activeTokens: items.filter((t: any) => t.status === 'active').length
      };
      setStats(newStats);
      
      // console.log("✅ fetchTokens completed successfully");
      
    } catch (error) {
      // Only log CORS errors once to reduce console spam
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (!(window as any).corsErrorLogged) {
          console.warn("⚠️ CORS Error: Backend server needs CORS configuration. Some features may not work properly.");
          (window as any).corsErrorLogged = true;
        }
      } else {
        console.error("❌ Failed to fetch tokens from server:", error);
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        setConnectionStatus("Request timeout - using WebSocket data only");
      } else {
        setConnectionStatus("Failed to connect to server - using WebSocket data only");
      }
    } finally {
      // console.log("🏁 fetchTokens completed, setting isLoading to false");
      setIsLoading(false);
    }
  }, []);

  // Search tokens
  const searchTokens = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) return;
    
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens/search?q=${encodeURIComponent(query)}&limit=50`);
      
      if (!response.ok) {
        throw new Error(`Search failed with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new API response formats
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      const transformedTokens = items.map(transformTokenData);
      setTokens(transformedTokens);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, []);

  // Filter tokens by status
  const filterByStatus = useCallback(async (status: 'fresh' | 'active') => {
    try {
      // Use the main tokens endpoint and filter client-side since /api/tokens/fresh doesn't work
      const response = await fetch(`${SERVER_BASE_URL}/api/tokens?limit=200`);
      
      if (!response.ok) {
        throw new Error(`Status filter failed with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new API response formats
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      
      // Filter by status on the client side
      const filteredItems = items.filter((item: any) => item.status === status);
      const transformedTokens = filteredItems.map(transformTokenData);
      setTokens(transformedTokens);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error("Status filter failed:", error);
    }
  }, []);



  // Resume live updates
  const resumeLive = useCallback(() => {
    setLive(true);
    console.log("▶️ Live updates resumed");
  }, []);

  // Pause live updates
  const pauseLive = useCallback(() => {
    setLive(false);
    console.log("⏸️ Live updates paused");
  }, []);

  // Pause live updates due to hover
  const pauseLiveOnHover = useCallback(() => {
    setIsHoverPaused(true);
  }, []);

  // Resume live updates after hover ends
  const resumeLiveAfterHover = useCallback(() => {
    setIsHoverPaused(false);
    
    // Process any queued tokens
    if (queuedTokens.length > 0) {
      // console.log(`🔄 Processing ${queuedTokens.length} queued tokens after hover`);
      
      // Add queued tokens to the main list
      setTokens(prev => {
        const existingMints = new Set(prev.map(t => t.mint));
        const newTokens = queuedTokens.filter(t => !existingMints.has(t.mint));
        
        if (newTokens.length > 0) {
          const combined = [...newTokens, ...prev];
          // Limit to 200 tokens to prevent memory issues
          return combined.slice(0, 200);
        }
        
        return prev;
      });
      
      // Set the first queued token as the new token for animation
      if (queuedTokens.length > 0) {
        setNewTokenMint(queuedTokens[0].mint);
        setTimeout(() => setNewTokenMint(null), 1000);
      }
      
      // Clear the queue
      setQueuedTokens([]);
      setLastUpdate(new Date());
    }
  }, [queuedTokens]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_token') {
        const newToken = transformTokenData(lastMessage.data);
        
        // Check if we're in hover pause mode
        if (isHoverPaused) {
          // Queue the token instead of adding it immediately
          setQueuedTokens(prev => {
            // Check for duplicates in queue
            const exists = prev.some(token => token.mint === newToken.mint);
            if (exists) {
              // console.log('⚠️ DUPLICATE TOKEN PREVENTED IN QUEUE:', newToken.mint);
              return prev;
            }
            // console.log('📦 TOKEN QUEUED DURING HOVER PAUSE:', newToken.name || newToken.symbol || newToken.mint);
            return [...prev, newToken];
          });
        } else {
          // Add new token to the list (check for duplicates)
          setTokens(prev => {
            // Check if token already exists
            const exists = prev.some(token => token.mint === newToken.mint);
            if (exists) {
              // console.log('⚠️ DUPLICATE TOKEN PREVENTED:', newToken.mint);
              return prev;
            }
            // console.log('🔥 NEW TOKEN RECEIVED VIA WEBSOCKET:', newToken.name || newToken.symbol || newToken.mint);
            const combined = [newToken, ...prev];
            // NO LIMIT - keep all tokens to prevent fresh mints from disappearing
            return combined;
          });
          setLastUpdate(new Date());
          setNewTokenMint(newToken.mint);
          
          // Clear the flag after animation
          setTimeout(() => setNewTokenMint(null), 1000);
        }
      } else if (lastMessage.type === 'token_update') {
        // Update existing token
        const updatedToken = transformTokenData(lastMessage.data);
        setTokens(prev => prev.map(token => {
          if (token.mint === updatedToken.mint) {
            // Preserve existing market cap and volume data if update doesn't have it
            return {
              ...updatedToken,
              marketcap: updatedToken.marketcap || token.marketcap,
              volume_24h: updatedToken.volume_24h || token.volume_24h,
              price_usd: updatedToken.price_usd || token.price_usd,
              liquidity: updatedToken.liquidity || token.liquidity
            };
          }
          return token;
        }));
        setLastUpdate(new Date());
        // console.log('🔄 TOKEN UPDATED VIA WEBSOCKET:', updatedToken.name || updatedToken.symbol || updatedToken.mint);
      } else if (lastMessage.type === 'price_alert') {
        // Handle significant price changes
        const priceAlert = lastMessage.data;
        console.log(`🚨 PRICE ALERT: ${priceAlert.mint} ${priceAlert.changePercent > 0 ? '+' : ''}${priceAlert.changePercent.toFixed(2)}% ($${priceAlert.previousPrice} → $${priceAlert.currentPrice})`);
        
        // Update the token in the list with new price data
        setTokens(prev => prev.map(token => {
          if (token.mint === priceAlert.mint) {
            return {
              ...token,
              price_usd: priceAlert.currentPrice,
              marketcap: priceAlert.marketcap,
              volume_24h: priceAlert.volume24h,
              // Add price change info for UI highlighting
              priceChange: {
                percent: priceAlert.changePercent,
                previous: priceAlert.previousPrice,
                current: priceAlert.currentPrice,
                timestamp: new Date(priceAlert.timestamp)
              }
            };
          }
          return token;
        }));
        setLastUpdate(new Date());
      }
    }
  }, [lastMessage]);

  // Initial fetch and periodic updates (reduced frequency since we have WebSocket)
  useEffect(() => {
    console.log("🚀 useServerData useEffect triggered:", { isOpen, live });
    if (isOpen) {
      console.log("📡 Calling fetchTokens...");
      fetchTokens();
      
      // Set up periodic refresh when live mode is on (FAST for fresh mints)
      if (live) {
        const interval = setInterval(() => {
          // console.log("🔄 Periodic refresh calling fetchTokens...");
          fetchTokens();
        }, 5000); // FAST: refresh every 5 seconds for fresh mints
        
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, live, fetchTokens]);

  // Fallback: If we have tokens from WebSocket but still loading, set loading to false
  useEffect(() => {
    if (isLoading && tokens.length > 0) {
      setIsLoading(false);
      setConnectionStatus(wsConnected ? "Connected via WebSocket (Live)" : "Connected via WebSocket");
    }
  }, [isLoading, tokens.length, wsConnected]);

  return {
    tokens,
    isLoading,
    lastUpdate,
    stats,
    connectionStatus,
    live,
    resumeLive,
    pauseLive,
    pauseLiveOnHover,
    resumeLiveAfterHover,
    isHoverPaused,
    queuedTokens,
    searchTokens,
    filterByStatus,
    refresh: fetchTokens,
    newTokenMint
  };
};
