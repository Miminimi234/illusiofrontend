"use client";
import { useEffect, useState } from "react";
import CreationTimeDisplay from './CreationTimeDisplay';
import ImageWithFallback from './ImageWithFallback';

interface TokenData {
  id: number;
  name?: string;
  symbol?: string;
  mint: string;
  creator?: string;
  source: string;
  blocktime?: Date | null;
  decimals: number;
  supply: string | number;
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

interface Holder {
  address: string;
  balance: number;
  percentage: number;
  firstTransaction: number;
  lastTransaction: number;
  transactionCount: number;
  isCreator: boolean;
  isWhale: boolean;
  isLiquidityPool?: boolean;
}

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

interface TokenHoldersProps {
  selectedToken?: SearchToken | null;
  onHoldersUpdate?: (holders: Holder[]) => void;
}

export default function TokenHolders({ selectedToken, onHoldersUpdate }: TokenHoldersProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(false);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasUserRequestedHolders, setHasUserRequestedHolders] = useState(false);

  // Fetch token data when selected token changes
  useEffect(() => {
    if (!selectedToken) {
      setTokenData(null);
      setHolders([]);
      setLoading(false);
      setHoldersLoading(false);
      setHasUserRequestedHolders(false);
      return;
    }

    // Convert SearchToken to TokenData format
    const convertToTokenData = (searchToken: SearchToken): TokenData => ({
      id: parseInt(searchToken.id.slice(0, 8), 16) || 0, // Convert first 8 chars to number
      name: searchToken.name,
      symbol: searchToken.symbol,
      mint: searchToken.id,
      creator: searchToken.dev,
      source: 'jupiter',
      blocktime: null,
      decimals: searchToken.decimals,
      supply: searchToken.totalSupply || searchToken.circSupply || 0,
      status: 'active',
      created_at: new Date(searchToken.updatedAt),
      updated_at: new Date(searchToken.updatedAt),
      display_name: searchToken.name,
      price_usd: searchToken.usdPrice || null,
      marketcap: searchToken.mcap || null,
      volume_24h: searchToken.stats24h?.volume || null,
      liquidity: searchToken.liquidity || null,
      image_url: searchToken.icon || null,
      metadata_uri: null
    });

    setTokenData(convertToTokenData(selectedToken));
    setHasUserRequestedHolders(true);
    fetchHolders(selectedToken.id);
  }, [selectedToken]);

  // Auto-refresh holders data only when user has requested it
  useEffect(() => {
    if (!tokenData || !tokenData.mint || !hasUserRequestedHolders) return;

    const interval = setInterval(() => {
      console.log(`Auto-refreshing holders for ${tokenData.mint} (user requested)`);
      fetchHolders(tokenData.mint);
    }, 5000); // Refresh every 5 seconds when user is actively viewing holders

    return () => clearInterval(interval);
  }, [tokenData, hasUserRequestedHolders]);

  // Force re-render every minute to update holding times live
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render by updating lastUpdate to refresh holding times
      setLastUpdate(new Date());
    }, 60000); // Update every minute for live holding time
    
    return () => clearInterval(interval);
  }, []);

  // Fetch holders data using backend API
  const fetchHolders = async (mint: string) => {
    setHoldersLoading(true);
    try {
      console.log(`Fetching holders from backend API for ${mint}`);
      
      // Use the new backend API endpoint
      const response = await fetch(`/api/tokens/holders?mint=${mint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.holders && Array.isArray(data.holders)) {
        console.log(`Found ${data.holders.length} holders from backend API`);
        setHolders(data.holders);
        setHoldersLoading(false);
        setLastUpdate(new Date());
        onHoldersUpdate?.(data.holders);
      } else {
        console.log('No holders data received from backend API');
        setHolders([]);
        setHoldersLoading(false);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching holders:', error);
      setHolders([]);
      setHoldersLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };


  const formatBalance = (balance: number) => {
    if (!balance || isNaN(balance) || typeof balance !== 'number') {
      return '0';
    }
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`;
    }
    return balance.toString();
  };


  const formatHoldingTime = (firstTransaction: number) => {
    if (!firstTransaction || firstTransaction === 0) return 'Unknown';
    
    const now = Date.now();
    const firstTxTime = firstTransaction * 1000; // Convert to milliseconds
    const diffMs = now - firstTxTime;
    
    if (diffMs < 0) return 'Unknown';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) {
      return `${diffYears}y`;
    } else if (diffMonths > 0) {
      return `${diffMonths}mo`;
    } else if (diffWeeks > 0) {
      return `${diffWeeks}w`;
    } else if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return `${diffSeconds}s`;
    }
  };

  const getHolderType = (holder: Holder) => {
    if (holder.isCreator) return 'Creator';
    if (holder.isLiquidityPool) return 'Liquidity Pool';
    if (holder.isWhale) return 'Whale';
    return 'Holder';
  };

  const getHolderTypeColor = (holder: Holder) => {
    if (holder.isCreator) return 'text-purple-400';
    if (holder.isLiquidityPool) return 'text-green-400';
    if (holder.isWhale) return 'text-orange-400';
    return 'text-blue-400';
  };

  const getHolderTypeBg = (holder: Holder) => {
    if (holder.isCreator) return 'bg-purple-500/20 border-purple-500/30';
    if (holder.isLiquidityPool) return 'bg-green-500/20 border-green-500/30';
    if (holder.isWhale) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-blue-500/20 border-blue-500/30';
  };

  if (!selectedToken) {
    return (
      <div className="h-full flex items-center justify-center text-white/40">
        <div className="text-center">
          <div className="text-4xl mb-4">👥</div>
          <div className="text-lg mb-2">Search for a token to view holders</div>
          <div className="text-sm">Enter a token address or symbol above</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white/60">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full mx-auto mb-4"></div>
          <div className="text-lg">Analyzing tokens...</div>
          <div className="text-sm text-white/40 mt-2">Searching for {selectedToken?.symbol || 'token'}</div>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white/60">
          <div className="text-lg">No token found</div>
          <div className="text-sm text-white/40 mt-2">Search for a token to view holders</div>
        </div>
      </div>
    );
  }


  if (holders.length === 0 && !holdersLoading && hasUserRequestedHolders) {
    return (
      <div className="h-full flex items-center justify-center text-white/40">
        <div className="text-center">
          <div className="text-4xl mb-4">👥</div>
          <div className="text-lg mb-2">No recent holders found</div>
          <div className="text-sm text-white/50">
            <p>• Holders will appear here as they are discovered</p>
            <p>• Check back in a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  if (holders.length === 0 && holdersLoading) {
    return (
      <div className="h-full flex items-center justify-center text-white/40">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full mx-auto mb-4"></div>
          <div className="text-lg mb-2">Loading holder data...</div>
          <div className="text-sm">Fetching holders for: <span className="text-blue-300 font-mono">{selectedToken?.symbol || 'token'}</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Token Info Header */}
      <div className="p-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center space-x-2">
          <ImageWithFallback
            src={tokenData.image_url || '/next.svg'}
            alt={tokenData.display_name || tokenData.name || 'Token'}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-semibold text-sm truncate">
                {tokenData.display_name || tokenData.name || 'Unknown Token'}
              </h3>
              {tokenData.symbol && (
                <span className="text-white/60 text-xs font-mono">
                  {tokenData.symbol}
                </span>
              )}
            </div>
            <div className="text-white/40 text-xs font-mono truncate">
              {formatAddress(tokenData.mint)}
            </div>
          </div>
        </div>
        
        {/* Token Stats */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-white/60">Supply</div>
            <div className="text-white font-mono text-xs">{formatBalance(Number(tokenData.supply))}</div>
          </div>
          <div>
            <div className="text-white/60">Holders</div>
            <div className="flex items-center space-x-1">
              <div className="text-white font-mono text-xs">{holders.length}</div>
              {holdersLoading && (
                <div className="animate-spin rounded-full h-2 w-2 border-b border-white/60"></div>
              )}
            </div>
          </div>
          <div>
            <div className="text-white/60">Updated</div>
            <div className="text-white font-mono text-xs">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
            </div>
          </div>
        </div>
        
      </div>

      {/* Holders List */}
      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {holders.slice(0, 25).map((holder, index) => (
          <div
            key={holder.address}
            onClick={() => window.open(`https://solscan.io/account/${holder.address}`, '_blank')}
            className={`p-1.5 rounded border ${getHolderTypeBg(holder)} transition-all duration-200 cursor-pointer hover:border-white/30`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${holder.isCreator ? 'bg-purple-400' : holder.isLiquidityPool ? 'bg-green-400' : holder.isWhale ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                <span className={`text-xs font-medium ${getHolderTypeColor(holder)}`}>
                  {getHolderType(holder)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold text-xs">
                  {formatBalance(holder.balance)}
                </div>
                <div className="text-white/60 text-xs">
                  {typeof holder.percentage === 'number' ? holder.percentage.toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
            
            <div className="text-white/60 text-xs font-mono mb-1">
              {formatAddress(holder.address)}
            </div>
            
            <div className="flex items-center justify-between text-xs text-white/50">
              <div>
                <span className="text-white/60">Txns:</span> {holder.transactionCount}
              </div>
              <div>
                <span className="text-white/60">Holder for:</span> {formatHoldingTime(holder.firstTransaction)}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
