"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface TokenData {
  id: string;
  mint: string; // Alias for id to maintain compatibility
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  dev?: string;
  circSupply?: number;
  totalSupply?: number;
  tokenProgram: string;
  launchpad?: string;
  partnerConfig?: string;
  graduatedPool?: string;
  graduatedAt?: string;
  holderCount?: number;
  fdv?: number;
  mcap?: number;
  usdPrice?: number;
  priceBlockId?: number;
  liquidity?: number;
  stats5m?: any;
  stats1h?: any;
  stats6h?: any;
  stats24h?: any;
  firstPool?: any;
  audit?: any;
  organicScore?: number;
  organicScoreLabel?: string;
  isVerified?: boolean;
  cexes?: string[];
  tags?: string[];
  updatedAt: string;
  // Additional fields for real-time updates
  priceChange24h?: number;
  volume24h?: number;
  lastUpdate?: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected?: number;
}

export const useFirebaseWebSocket = () => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    error: null
  });
  const [loading, setLoading] = useState(true);
  
  const tokensRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isMountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setConnectionStatus(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Reference to the tokens collection in Firebase
      const tokensDatabaseRef = ref(database, 'jupiter_tokens/recent/tokens');
      
      console.log('🔍 Attempting to connect to Firebase path: jupiter_tokens/recent/tokens');
      
      // First, try to get initial data
      const snapshot = await get(tokensDatabaseRef);
      
      if (snapshot.exists()) {
        const tokensData = snapshot.val();
        const tokensArray = Object.keys(tokensData).map(key => ({
          id: key,
          mint: key, // Add mint as alias for id
          ...tokensData[key],
          lastUpdate: Date.now()
        })) as TokenData[];
        
        console.log('✅ Found tokens data:', tokensArray.length, 'tokens');
        
        if (isMountedRef.current) {
          setTokens(tokensArray);
          setLoading(false);
        }
      } else {
        console.log('⚠️ No tokens data found at jupiter_tokens/recent/tokens');
        // If no data exists, initialize with empty array
        if (isMountedRef.current) {
          setTokens([]);
          setLoading(false);
        }
      }

      // Set up real-time listener
      onValue(tokensDatabaseRef, (snapshot) => {
        if (!isMountedRef.current) return;
        
        if (snapshot.exists()) {
          const tokensData = snapshot.val();
          const tokensArray = Object.keys(tokensData).map(key => ({
            id: key,
            mint: key, // Add mint as alias for id
            ...tokensData[key],
            lastUpdate: Date.now()
          })) as TokenData[];
          
          setTokens(tokensArray);
          setConnectionStatus({
            isConnected: true,
            isConnecting: false,
            error: null,
            lastConnected: Date.now()
          });
          setLoading(false);
          reconnectAttempts.current = 0; // Reset on successful connection
        } else {
          setTokens([]);
          setConnectionStatus({
            isConnected: true,
            isConnecting: false,
            error: null,
            lastConnected: Date.now()
          });
          setLoading(false);
        }
      }, (error) => {
        console.error('Firebase listener error:', error);
        if (isMountedRef.current) {
          setConnectionStatus({
            isConnected: false,
            isConnecting: false,
            error: error.message,
            lastConnected: connectionStatus.lastConnected
          });
          attemptReconnect();
        }
      });

      // Store reference for cleanup
      tokensRef.current = tokensDatabaseRef;
      
    } catch (error) {
      console.error('Firebase connection error:', error);
      if (isMountedRef.current) {
        setConnectionStatus({
          isConnected: false,
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastConnected: connectionStatus.lastConnected
        });
        setLoading(false);
        attemptReconnect();
      }
    }
  }, [connectionStatus.lastConnected]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus(prev => ({
        ...prev,
        error: 'Max reconnection attempts reached'
      }));
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttempts.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // Initialize connection on mount
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (tokensRef.current) {
        off(tokensRef.current);
      }
    };
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (tokensRef.current) {
        off(tokensRef.current);
      }
    };
  }, []);

  return {
    tokens,
    connectionStatus,
    loading,
    reconnect
  };
};
