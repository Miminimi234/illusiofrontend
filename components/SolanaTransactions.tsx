"use client";
import { useEffect, useState } from "react";
import CreationTimeDisplay from './CreationTimeDisplay';

interface SearchToken {
  id: string;
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
}

interface HeliusTrade {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  slot: number;
  blockTime: number;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  events: {
    swap?: {
      nativeInput: {
        account: string;
        amount: string;
      };
      nativeOutput: {
        account: string;
        amount: string;
      };
      tokenInputs: Array<{
        mint: string;
        amount: string;
        userAccount: string;
      }>;
      tokenOutputs: Array<{
        mint: string;
        amount: string;
        userAccount: string;
      }>;
    };
  };
}

interface SolanaTransactionsProps {
  selectedToken?: SearchToken | null;
}

export default function SolanaTransactions({ selectedToken }: SolanaTransactionsProps) {
  const [trades, setTrades] = useState<HeliusTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    if (!selectedToken) {
      setTrades([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      
      if (!heliusApiKey) {
        throw new Error('Helius API key not configured');
      }

      // Get recent transactions for the selected token - FRONTEND ONLY for user-specific searches
      const response = await fetch(`https://api.helius.xyz/v0/transactions?api-key=${heliusApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: {
            accounts: [selectedToken.id],
            dataSlice: {
              offset: 0,
              length: 1000
            }
          },
          options: {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter for swap transactions and sort by timestamp
        const swapTrades = data
          .filter(tx => tx.events?.swap && tx.tokenTransfers?.length > 0)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50); // Limit to 50 most recent trades
        
        setTrades(swapTrades);
      } else {
        setTrades([]);
      }
    } catch (err) {
      console.error("Error fetching trades from Helius:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    
    // Set up polling for live updates every 5 seconds
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, [selectedToken]);

  const formatTokenAmount = (amount: number, decimals: number) => {
    return (amount / Math.pow(10, decimals)).toFixed(6);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getTradeType = (trade: HeliusTrade) => {
    if (trade.events?.swap) {
      return 'SWAP';
    }
    return trade.type || 'UNKNOWN';
  };

  const getTradeValue = (trade: HeliusTrade) => {
    if (trade.events?.swap?.nativeInput?.amount) {
      return (parseFloat(trade.events.swap.nativeInput.amount) / 1e9).toFixed(4) + ' SOL';
    }
    return 'N/A';
  };

  if (!selectedToken) {
    return (
      <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">Select a Token</h3>
          <p className="text-white/60">Choose a token from the search results to view live trades.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading live trades for {selectedToken.symbol}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-center text-red-400">
          <h3 className="text-lg font-bold mb-2">Error Loading Trades</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchTrades}
            className="mt-2 px-4 py-2 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">No Recent Trades</h3>
          <p className="text-white/60">No recent trades found for {selectedToken.symbol}. Check back later for new activity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white" style={{ fontFamily: 'VT323, monospace' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Live {selectedToken.symbol} Trades
        </h2>
        <div className="text-sm text-white/60">
          {trades.length} recent trades
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {trades.map((trade, index) => (
          <div key={trade.signature} className="p-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  {getTradeType(trade)}
                </span>
                <span className="text-xs text-white/60">
                  #{trades.length - index}
                </span>
              </div>
              <div className="text-xs text-white/60">
                <CreationTimeDisplay createdAt={new Date(trade.timestamp * 1000)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-white/60">Value:</span>
                <span className="ml-1 font-mono">{getTradeValue(trade)}</span>
              </div>
              <div>
                <span className="text-white/60">Source:</span>
                <span className="ml-1">{trade.source || 'Unknown'}</span>
              </div>
            </div>
            
            {trade.tokenTransfers.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="text-white/60 mb-1">Token Transfers:</div>
                {trade.tokenTransfers.map((transfer, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-white/60">
                      {formatAddress(transfer.fromUserAccount)} → {formatAddress(transfer.toUserAccount)}
                    </span>
                    <span className="font-mono">
                      {formatTokenAmount(transfer.tokenAmount, selectedToken.decimals)} {selectedToken.symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2 text-xs text-white/40">
              <span className="font-mono">{formatAddress(trade.signature)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}