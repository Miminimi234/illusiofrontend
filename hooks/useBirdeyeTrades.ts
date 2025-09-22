"use client";
import { useEffect, useState } from "react";

interface BirdeyeTrade {
  txHash: string;
  blockUnixTime: number;
  side: "buy" | "sell";
  priceUsd: number;
  volumeUsd: number;
  amount: number;
  owner: string;
}

interface UseBirdeyeTradesOptions {
  tokenMint: string;
  limit?: number;
  pollInterval?: number; // how often to refresh (ms)
}

export const useBirdeyeTrades = ({
  tokenMint,
  limit = 20,
  pollInterval = 6000,
}: UseBirdeyeTradesOptions) => {
  const [trades, setTrades] = useState<BirdeyeTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;

  const fetchTrades = async (isInitial = false) => {
    console.log("🔍 fetchTrades called with:", { tokenMint, isInitial, apiKey: !!apiKey });
    
    if (!apiKey) {
      setError("Missing Birdeye API key");
      return;
    }

    if (!tokenMint) {
      console.log("⚠️ No tokenMint provided, skipping fetch");
      return;
    }

    try {
      // Only show loading on initial fetch
      if (isInitial) {
        setLoading(true);
      }
      
      const url = `/api/birdeye/trades?address=${tokenMint}&limit=${limit}`;
      console.log("📤 Fetching trades from API route:", url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("📦 API response data:", data);
      console.log("📦 Raw items:", data.data?.items);
      
      const parsedTrades = (data.data?.items || []).map((t: any) => {
        console.log("🔍 Processing trade item:", t);
        return {
          txHash: t.tx_hash || 'unknown',
          blockUnixTime: t.block_unix_time || Date.now() / 1000,
          side: t.side || 'unknown',
          priceUsd: t.from?.price || t.to?.price || 0,
          volumeUsd: t.volume_usd || 0,
          amount: parseFloat(t.from?.amount || 0),
          owner: t.owner || 'unknown',
        };
      });

      console.log("✅ Parsed trades:", parsedTrades.length, parsedTrades);
      setTrades(parsedTrades);
      setError(null);
    } catch (err: any) {
      console.error("❌ Failed to fetch Birdeye trades:", err);
      setError(err.message);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTrades(true); // initial fetch with loading
    const interval = setInterval(() => fetchTrades(false), pollInterval);
    return () => clearInterval(interval);
  }, [tokenMint, apiKey, limit, pollInterval]);

  return { trades, loading, error };
};

export default useBirdeyeTrades;