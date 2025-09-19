import { useState, useEffect, useRef, useCallback } from 'react';

interface JupiterToken {
  id: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
  liquidity?: number;
  createdAt: string; // ISO string
  tokenProgram?: string;
  filterReason?: string;
  lastUpdated?: string;
}

interface JupiterStats {
  totalCount: number;
  filteredCount: number;
  lastFetch: string;
  fetchCount: number;
  errorCount: number;
  status: string;
}

interface WebSocketMessage {
  type: 'JUPITER_TOKENS_UPDATE';
  payload: {
    tokens: JupiterToken[];
    stats: JupiterStats;
  };
}

const WS_URL = process.env.NEXT_PUBLIC_JUPITER_WS_URL || 'ws://localhost:8081/jupiter-tokens';
const RECONNECT_INTERVAL = 3000; // 3 seconds

export const useJupiterWebSocket = () => {
  const [tokens, setTokens] = useState<JupiterToken[]>([]);
  const [stats, setStats] = useState<JupiterStats>({
    totalCount: 0,
    filteredCount: 0,
    lastFetch: new Date().toISOString(),
    fetchCount: 0,
    errorCount: 0,
    status: 'inactive',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setLoading(true);
    setError(null);
    setConnected(false);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to Jupiter service');
      setConnected(true);
      setLoading(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'JUPITER_TOKENS_UPDATE') {
          setTokens(message.payload.tokens);
          setStats(message.payload.stats);
          setLastUpdate(new Date());
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        setError('Failed to process real-time data');
      }
    };

    ws.onclose = (event) => {
      console.warn('WebSocket disconnected from Jupiter service:', event.code, event.reason);
      setConnected(false);
      setLoading(true); // Indicate loading while trying to reconnect
      setError('Disconnected from real-time service. Attempting to reconnect...');
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, RECONNECT_INTERVAL);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error. Attempting to reconnect...');
      ws.close(); // Force close to trigger onclose and reconnect logic
    };
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  return { tokens, loading, error, connected, lastUpdate, stats };
};