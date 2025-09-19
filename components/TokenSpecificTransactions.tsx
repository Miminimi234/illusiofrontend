"use client";
import { useEffect, useState } from "react";
import CreationTimeDisplay from './CreationTimeDisplay';
import ImageWithFallback from './ImageWithFallback';

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://localhost:8080'
    : 'http://localhost:8080');

interface TokenData {
  id: number;
  name?: string;
  symbol?: string;
  mint: string; // API uses 'mint' not 'contract_address'
  creator?: string;
  source: string;
  blocktime?: Date | null;
  decimals: number;
  supply: string | number; // API returns string
  status: 'fresh' | 'active' | 'curve';
  created_at: Date;
  updated_at: Date;
  display_name?: string;
  price_usd?: number | null;
  marketcap?: number | null;
  volume_24h?: number | null;   
  liquidity?: number | null;
  image_url?: string | null;
  metadata_uri?: string | null;
}

interface Transaction {
  signature: string;
  timestamp: number;
  type: string;
  amount: number;
  price: number;
  side: 'BUY' | 'SELL' | 'UNKNOWN';
  user: string;
  slot: number;
  fee: number;
}

interface TokenSpecificTransactionsProps {
  searchQuery: string;
  isSearching: boolean;
  onTransactionsUpdate?: (transactions: Transaction[]) => void;
}

export default function TokenSpecificTransactions({ searchQuery, isSearching, onTransactionsUpdate }: TokenSpecificTransactionsProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setTokenData(null);
      setError(null);
      return;
    }

    const searchToken = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${SERVER_BASE_URL}/api/tokens/search?q=${encodeURIComponent(searchQuery)}&limit=1`);
        
        if (!response.ok) {
          throw new Error(`Search failed with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const token = data.items[0];
          // Validate that we have the required fields
          if (token && token.mint) {
            setTokenData(token);
            // Transactions will be fetched automatically by the auto-refresh effect
          } else {
            setTokenData(null);
            setError(`Invalid token data received for "${searchQuery}"`);
          }
        } else {
          setTokenData(null);
          setError(`No token found for "${searchQuery}"`);
        }
      } catch (err) {
        console.error('Error searching for token:', err);
        setError(`Failed to search for token: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTokenData(null);
      } finally {
        setLoading(false);
      }
    };

    searchToken();
  }, [searchQuery]);

  const fetchTransactions = async (tokenMint: string) => {
    setTransactionsLoading(true);
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/transactions/${tokenMint}?limit=10`); // Reduced from 20 to 10 to save credits
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Auto-refresh transactions every 30 seconds when a token is loaded (much slower to save credits)
  useEffect(() => {
    if (!tokenData?.mint) return;

    // Initial fetch
    fetchTransactions(tokenData.mint);

    // Set up auto-refresh interval that runs continuously
    const interval = setInterval(() => {
      // Always refresh if we have a token, regardless of loading state
      fetchTransactions(tokenData.mint);
    }, 5000); // Refresh every 5 seconds when user is actively viewing transactions

    return () => clearInterval(interval);
  }, [tokenData?.mint]);

  // Auto-refresh token data every 10 seconds to get updated metadata (FAST)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    const refreshTokenData = async () => {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/api/tokens/search?q=${encodeURIComponent(searchQuery)}&limit=1`);

        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            const token = data.items[0];
            if (token && token.mint) {
              setTokenData(token);
            }
          }
        }
      } catch (err) {
        console.error('Error refreshing token data:', err);
      }
    };

    // Initial refresh after 5 seconds
    const initialTimeout = setTimeout(refreshTokenData, 5000);

    // Then refresh every 10 seconds (FAST)
    const interval = setInterval(refreshTokenData, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [searchQuery]);

  // Notify parent component when transactions are updated
  useEffect(() => {
    if (onTransactionsUpdate && transactions.length > 0) {
      onTransactionsUpdate(transactions);
    }
  }, [transactions, onTransactionsUpdate]);

  if (isSearching || loading) {
    return (
      <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span>Searching for "{searchQuery}"...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white p-6" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-red-400 mb-2">⚠️ Search Error</div>
        <div className="text-white/70">{error}</div>
        <div className="text-white/50 text-sm mt-2">
          Try searching by token name, symbol, or contract address
        </div>
      </div>
    );
  }

  if (!searchQuery.trim()) {
    return (
      <div className="text-white p-6 bg-black h-full flex items-center justify-center" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Solana Token Trades through Quantum Eraser</h2>
          <p className="text-white/70">
            Search for a specific token to view its transaction data
          </p>
          <div className="text-white/50 text-sm mt-4">
            <p>• Enter token name, symbol, or contract address</p>
            <p>• View real-time transaction data</p>
            <p>• Analyze trading patterns</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="text-white p-6 bg-black h-full flex items-center justify-center" style={{ fontFamily: 'VT323, monospace' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Token Not Found</h2>
          <p className="text-white/70">
            No token found for "{searchQuery}"
          </p>
          <div className="text-white/50 text-sm mt-4">
            <p>• Check the spelling</p>
            <p>• Try using the contract address</p>
            <p>• Ensure the token exists on Solana</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white h-full bg-black" style={{ fontFamily: 'VT323, monospace' }}>
      <div className="p-4 border-b border-white/10 bg-black">
        <h2 className="text-xl font-bold mb-2">Solana Token Trades through Quantum Eraser</h2>
        <div className="text-white/70 text-sm">
          Showing data for: <span className="text-blue-300 font-mono">{searchQuery}</span>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-black" style={{ height: 'calc(100% - 80px)' }}>
        {/* Token Header Card */}
        <div className="p-4 bg-black border border-white/10 rounded-lg">
          <div className="flex items-center space-x-4 mb-4">
            {/* Token Image */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
              {tokenData.image_url ? (
                <ImageWithFallback
                  src={tokenData.image_url}
                  alt={tokenData.symbol || tokenData.mint || 'Token'}
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                  {tokenData.symbol?.slice(0, 2) || tokenData.mint?.slice(0, 2) || '??'}
                </div>
              )}
            </div>

            {/* Token Info */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {tokenData.display_name || tokenData.name || tokenData.symbol || 'Unknown Token'}
              </h3>
              <div className="text-white/60 text-sm font-mono">
                {tokenData.mint ? (
                  tokenData.mint.length > 16 
                    ? `${tokenData.mint.slice(0, 8)}...${tokenData.mint.slice(-8)}`
                    : tokenData.mint
                ) : 'Unknown Address'}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full border ${
                  tokenData.status === 'fresh' ? 'border-green-500/50 text-green-300 bg-green-500/10' :
                  tokenData.status === 'active' ? 'border-blue-500/50 text-blue-300 bg-blue-500/10' :
                  'border-purple-500/50 text-purple-300 bg-purple-500/10'
                }`}>
                  {tokenData.status}
                </span>
                {tokenData.source && (
                  <span className="px-2 py-1 text-xs rounded-full border border-white/20 text-white/60 bg-white/5">
                    {tokenData.source}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Token Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black border border-white/10 rounded p-3">
              <div className="text-white/60 text-xs mb-1">Supply</div>
              <div className="text-white font-bold">
                {tokenData.supply ? (typeof tokenData.supply === 'string' ? tokenData.supply : tokenData.supply.toLocaleString()) : 'N/A'}
              </div>
            </div>
            <div className="bg-black border border-white/10 rounded p-3">
              <div className="text-white/60 text-xs mb-1">Decimals</div>
              <div className="text-white font-bold">
                {tokenData.decimals || 'N/A'}
              </div>
            </div>
            <div className="bg-black border border-white/10 rounded p-3">
              <div className="text-white/60 text-xs mb-1">Price</div>
              <div className="text-white font-bold">
                {tokenData.price_usd && typeof tokenData.price_usd === 'number' ? `$${tokenData.price_usd.toFixed(6)}` : 'N/A'}
              </div>
            </div>
            <div className="bg-black border border-white/10 rounded p-3">
              <div className="text-white/60 text-xs mb-1">Market Cap</div>
              <div className="text-white font-bold">
                {tokenData.marketcap ? `$${(Number(tokenData.marketcap) / 1000000).toFixed(2)}M` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Transaction Data */}
        <div className="bg-black border border-white/10 rounded-lg" style={{ height: 'calc(100% - 200px)' }}>
          <div className="flex items-center justify-between mb-3 p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <h4 className="text-lg font-bold text-blue-300">Live Transactions</h4>
              {tokenData?.mint && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">LIVE</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {lastUpdate && (
                <div className="text-white/50 text-xs">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              {transactionsLoading && (
                <div className="flex items-center space-x-2 text-blue-300 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
          
          {transactionsLoading ? (
            <div className="text-center py-8 flex items-center justify-center" style={{ height: 'calc(100% - 60px)' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <div className="text-white/70">Fetching live transaction data...</div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3 overflow-y-auto p-4 scrollbar-hide" style={{ height: 'calc(100% - 60px)' }}>
              {transactions.map((tx, index) => (
                <div 
                  key={tx.signature} 
                  className="p-3 bg-black border border-white/10 rounded-lg transition-all duration-300 hover:bg-white/5 cursor-pointer"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                  }}
                  onClick={() => {
                    window.open(`https://solscan.io/tx/${tx.signature}`, '_blank');
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${
                        tx.side === 'BUY' 
                          ? 'border-green-500/50 text-green-300 bg-green-500/10'
                          : tx.side === 'SELL'
                          ? 'border-red-500/50 text-red-300 bg-red-500/10'
                          : 'border-gray-500/50 text-gray-300 bg-gray-500/10'
                      }`}>
                        {tx.side}
                      </span>
                      <span className="text-white/60 text-xs">
                        {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-white/60 text-xs font-mono">
                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                      </div>
                      <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Amount:</span>
                      <span className="text-white ml-2">{tx.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Price:</span>
                      <span className="text-white ml-2">${typeof tx.price === 'number' ? tx.price.toFixed(6) : '0.000000'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">User:</span>
                      <span className="text-white ml-2 font-mono text-xs">
                        {tx.user.length > 16 ? `${tx.user.slice(0, 8)}...${tx.user.slice(-8)}` : tx.user}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Fee:</span>
                      <span className="text-white ml-2">{typeof tx.fee === 'number' ? tx.fee.toFixed(6) : '0.000000'} SOL</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 flex items-center justify-center" style={{ height: 'calc(100% - 60px)' }}>
              <div className="text-4xl mb-4">📊</div>
              <div className="text-white/70 mb-2">No recent transactions found</div>
              <div className="text-white/50 text-sm">
                <p>• Transactions will appear here as they happen</p>
                <p>• Check back in a few moments</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
