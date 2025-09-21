"use client";
import { useEffect, useRef, useState } from 'react';
import { birdeyeService, BirdeyeTrade, TradeFilter } from '@/utils/birdeyeService';

interface UseBirdeyeTradesOptions {
  tokenAddress?: string;
  filter?: TradeFilter;
  interval?: number;
  maxTrades?: number;
  enabled?: boolean;
}

interface UseBirdeyeTradesReturn {
  trades: BirdeyeTrade[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  isConnected: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}

export const useBirdeyeTrades = (options: UseBirdeyeTradesOptions = {}): UseBirdeyeTradesReturn => {
  const {
    tokenAddress,
    filter = {},
    interval = 3000,
    maxTrades = 3,
    enabled = true
  } = options;

  const [trades, setTrades] = useState<BirdeyeTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const subscriptionIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await birdeyeService.getApiStatus();
        setIsConnected(status.connected);
        if (!status.connected) {
          setError(status.error || 'API connection failed');
        }
      } catch (err) {
        setIsConnected(false);
        setError('Failed to check API status');
      }
    };

    checkApiStatus();
  }, []);

  // Subscribe to trades
  const subscribe = () => {
    if (!tokenAddress || !enabled || isSubscribedRef.current) return;

    try {
      setError(null);
      setIsLoading(true);

      const subscriptionId = birdeyeService.subscribeToTrades(
        tokenAddress,
        (newTrades) => {
          setTrades(newTrades);
          setLastUpdate(Date.now());
          setIsLoading(false);
          setError(null);
        },
        {
          filter: { ...filter, tokenAddress },
          interval,
          maxTrades
        }
      );

      subscriptionIdRef.current = subscriptionId;
      isSubscribedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to trades');
      setIsLoading(false);
    }
  };

  // Unsubscribe from trades
  const unsubscribe = () => {
    if (subscriptionIdRef.current) {
      birdeyeService.unsubscribeFromTrades(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
      isSubscribedRef.current = false;
      setTrades([]);
    }
  };

  // Auto-subscribe when token address changes
  useEffect(() => {
    if (tokenAddress && enabled && isConnected) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [tokenAddress, enabled, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    trades,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    subscribe,
    unsubscribe
  };
};

export default useBirdeyeTrades;
