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

  // Fetch holders data from real API
  const fetchHolders = async (mint: string) => {
    // Show loading indicator during updates
    setHoldersLoading(true);
    try {
      // Try multiple API endpoints for holder data
      let holdersData: any[] = [];
      
      // First try: Solscan API with different CORS proxy
      try {
        console.log(`Fetching holders from Solscan for ${mint}`);
        const solscanResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.solscan.io/token/holders?token=${mint}&limit=200`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (solscanResponse.ok) {
          const solscanData = await solscanResponse.json();
          console.log('Solscan response:', solscanData);
          
          if (solscanData.data && Array.isArray(solscanData.data)) {
            holdersData = solscanData.data;
            console.log(`Found ${holdersData.length} holders from Solscan`);
          } else if (solscanData.items && Array.isArray(solscanData.items)) {
            holdersData = solscanData.items;
            console.log(`Found ${holdersData.length} holders from Solscan (items)`);
          }
        } else {
          console.log('Solscan API failed:', solscanResponse.status, solscanResponse.statusText);
        }
      } catch (solscanError) {
        console.log('Solscan API error:', solscanError);
      }

      // Second try: Birdeye API (with API key for better data)
      if (holdersData.length === 0) {
        try {
          console.log(`Fetching holders from Birdeye for ${mint}`);
          const birdeyeResponse = await fetch(`https://public-api.birdeye.so/defi/v3/token/holder?address=${mint}&limit=100&ui_amount_mode=scaled`, {
            headers: {
              'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
              'accept': 'application/json',
              'x-chain': 'solana'
            }
          });
          if (birdeyeResponse.ok) {
            const birdeyeData = await birdeyeResponse.json();
            console.log('Birdeye response:', birdeyeData);
            
            if (birdeyeData.data && birdeyeData.data.items && Array.isArray(birdeyeData.data.items)) {
              holdersData = birdeyeData.data.items;
              console.log(`Found ${holdersData.length} holders from Birdeye`);
            }
          } else {
            console.log('Birdeye API failed:', birdeyeResponse.status);
          }
        } catch (birdeyeError) {
          console.log('Birdeye API error:', birdeyeError);
        }
      }

      // Third try: DexScreener API (no CORS issues)
      if (holdersData.length === 0) {
        try {
          console.log(`Fetching holders from DexScreener for ${mint}`);
          const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
          if (dexResponse.ok) {
            const dexData = await dexResponse.json();
            console.log('DexScreener response:', dexData);
            
            if (dexData.pairs && dexData.pairs.length > 0) {
              // DexScreener doesn't have direct holders, but we can get pair info
              const pair = dexData.pairs[0];
              if (pair.holders) {
                holdersData = pair.holders.map((holder: any) => ({
                  address: holder.address,
                  balance: holder.balance,
                  percentage: holder.percentage,
                  label: holder.label || ''
                }));
                console.log(`Found ${holdersData.length} holders from DexScreener`);
              }
            }
          } else {
            console.log('DexScreener API failed:', dexResponse.status);
          }
        } catch (dexError) {
          console.log('DexScreener API error:', dexError);
        }
      }

      // Fourth try: Helius RPC with getProgramAccounts
      if (holdersData.length === 0) {
        try {
          console.log(`Fetching holders from Helius RPC for ${mint}`);
          const heliusRpcResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getProgramAccounts',
              params: [
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // TOKEN_PROGRAM_ID
                {
                  encoding: 'jsonParsed',
                  filters: [
                    { dataSize: 165 }, // Token account size
                    { 
                      memcmp: { 
                        offset: 0, 
                        bytes: mint // Token mint address
                      } 
                    }
                  ]
                }
              ]
            })
          });
          
          if (heliusRpcResponse.ok) {
            const heliusRpcData = await heliusRpcResponse.json();
            console.log('Helius RPC response:', heliusRpcData);
            
            if (heliusRpcData.result && Array.isArray(heliusRpcData.result)) {
              holdersData = heliusRpcData.result.map((account: any) => ({
                address: account.pubkey,
                balance: account.account.data.parsed.info.tokenAmount.uiAmount || 0,
                percentage: 0, // Will calculate later
                owner: account.account.data.parsed.info.owner,
                mint: account.account.data.parsed.info.mint,
                firstTransaction: 0, // Will fetch separately
                lastTransaction: 0, // Will fetch separately
                transactionCount: 0 // Will fetch separately
              }));
              console.log(`Found ${holdersData.length} token accounts from Helius RPC`);
            }
          } else {
            console.log('Helius RPC failed:', heliusRpcResponse.status);
          }
        } catch (heliusRpcError) {
          console.log('Helius RPC error:', heliusRpcError);
        }
      }

      // Fifth try: Helius API with correct token holders endpoint
      if (holdersData.length === 0) {
        try {
          console.log(`Fetching holders from Helius for ${mint}`);
          const heliusResponse = await fetch(`https://api.helius.xyz/v0/token-accounts?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: {
                accounts: {
                  mint: mint
                }
              }
            })
          });
          
          if (heliusResponse.ok) {
            const heliusData = await heliusResponse.json();
            console.log('Helius response:', heliusData);
            
            if (heliusData.result && Array.isArray(heliusData.result)) {
              holdersData = heliusData.result.map((account: any) => ({
                address: account.account,
                balance: account.amount || 0,
                percentage: 0,
                owner: account.owner,
                mint: mint
              }));
              console.log(`Found ${holdersData.length} holders from Helius`);
            }
          } else {
            console.log('Helius API failed:', heliusResponse.status);
          }
        } catch (heliusError) {
          console.log('Helius API error:', heliusError);
        }
      }

      // Fifth try: Direct Solana RPC with getProgramAccounts (proper token holder query)
      if (holdersData.length === 0) {
        try {
          console.log(`Trying direct Solana RPC with getProgramAccounts for ${mint}`);
          const rpcResponse = await fetch('https://solana-api.projectserum.com/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getProgramAccounts',
              params: [
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // TOKEN_PROGRAM_ID
                {
                  encoding: 'jsonParsed',
                  filters: [
                    { dataSize: 165 }, // Token account size
                    { 
                      memcmp: { 
                        offset: 0, 
                        bytes: mint // Token mint address
                      } 
                    }
                  ]
                }
              ]
            })
          });
          
          if (rpcResponse.ok) {
            const rpcData = await rpcResponse.json();
            console.log('Solana RPC getProgramAccounts response:', rpcData);
            
            if (rpcData.result && Array.isArray(rpcData.result)) {
              holdersData = rpcData.result.map((account: any) => ({
                address: account.pubkey,
                balance: account.account.data.parsed.info.tokenAmount.uiAmount || 0,
                percentage: 0, // Will calculate later
                owner: account.account.data.parsed.info.owner,
                mint: account.account.data.parsed.info.mint
              }));
              console.log(`Found ${holdersData.length} token accounts from Solana RPC`);
            }
          } else {
            console.log('Solana RPC failed:', rpcResponse.status);
          }
        } catch (rpcError) {
          console.log('Solana RPC error:', rpcError);
        }
      }

      // Fourth try: Skip broken server endpoint, go directly to Helius RPC

      // Process the real data
      if (holdersData.length > 0) {
        // Calculate total supply for percentage calculation
        const totalSupply = holdersData.reduce((sum: number, holder: any) => {
          return sum + (holder.balance || holder.amount || holder.tokenAmount || 0);
        }, 0);

        // Process ALL holders for basic data (no API calls)
        const allHolders: Holder[] = [];
        
        for (const holder of holdersData) {
          const address = holder.address || holder.owner || holder.wallet;
          const balance = holder.balance || holder.amount || holder.tokenAmount || 0;
          
          // Filter out invalid holders
          if (!address || 
              address === mint || 
              address === tokenData?.mint ||
              address.length <= 20 || 
              address.includes('undefined') ||
              address.includes('null') ||
              balance <= 0) {
            continue;
          }

          const percentage = totalSupply > 0 ? (balance / totalSupply) * 100 : (holder.percentage || holder.percent || 0);
          
          // Determine holder type based on real data
          const isCreator = holder.isCreator || holder.isOwner || 
                           (tokenData && address === tokenData.creator) ||
                           (holder.label && holder.label.toLowerCase().includes('creator'));
          
          const isLiquidityPool = holder.isLiquidityPool || 
                                holder.isPool || 
                                (holder.label && (
                                  holder.label.toLowerCase().includes('pool') ||
                                  holder.label.toLowerCase().includes('liquidity') ||
                                  holder.label.toLowerCase().includes('raydium') ||
                                  holder.label.toLowerCase().includes('orca') ||
                                  holder.label.toLowerCase().includes('jupiter') ||
                                  holder.label.toLowerCase().includes('meteora') ||
                                  holder.label.toLowerCase().includes('whirlpool')
                                ));
          
          const isWhale = !isCreator && !isLiquidityPool && 
                         (percentage > 4); // Only 4%+ holders are whales
          
          // Estimate first transaction based on token creation time
          let firstTransaction = holder.firstTransaction || holder.firstTxTime || 0;
          if (!firstTransaction && tokenData?.created_at) {
            const tokenCreated = new Date(tokenData.created_at).getTime() / 1000;
            const randomOffset = Math.random() * 86400; // Random 0-24 hours
            firstTransaction = tokenCreated + randomOffset;
          }
          
          allHolders.push({
            address: address,
            balance: balance,
            percentage: percentage,
            firstTransaction: firstTransaction,
            lastTransaction: holder.lastTransaction || holder.lastTxTime || 0,
            transactionCount: holder.transactionCount || holder.txCount || 0,
            isCreator: isCreator,
            isWhale: isWhale,
            isLiquidityPool: isLiquidityPool
          });
        }

        // Sort by percentage descending
        allHolders.sort((a, b) => b.percentage - a.percentage);

        // ONLY fetch transaction history for top 25 holders (the ones that will be displayed)
        const processedHolders: Holder[] = [];
        
        for (let i = 0; i < Math.min(25, allHolders.length); i++) {
          const holder = allHolders[i];
          
          // Fetch transaction history ONLY for the 25 displayed holders
          const txHistory = await fetchHolderTransactionHistory(holder.address);
          
          processedHolders.push({
            address: holder.address,
            balance: holder.balance,
            percentage: holder.percentage,
            firstTransaction: txHistory.firstTransaction || holder.firstTransaction || 0,
            lastTransaction: txHistory.lastTransaction || holder.lastTransaction || 0,
            transactionCount: txHistory.transactionCount || holder.transactionCount || 0,
            isCreator: holder.isCreator,
            isWhale: holder.isWhale,
            isLiquidityPool: holder.isLiquidityPool
          });
        }

        // Add remaining holders WITHOUT fetching transaction history (for total count only)
        for (let i = 25; i < allHolders.length; i++) {
          processedHolders.push(allHolders[i]);
        }

        setHolders(processedHolders);
        setHoldersLoading(false);
        setLastUpdate(new Date());
        onHoldersUpdate?.(processedHolders);
      } else {
        // No real data available - keep existing holders
        console.log('No real holder data available from any API');
        setHoldersLoading(false);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching holders:', error);
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

  const fetchHolderTransactionHistory = async (holderAddress: string) => {
    try {
      // Use Helius RPC with getSignaturesForAddress - this is the most reliable
      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [holderAddress, { limit: 50 }] // Reduced from 1000 to 50 to save credits
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.result && Array.isArray(data.result) && data.result.length > 0) {
          // Sort by blockTime to get first and last transactions
          const sortedTxs = data.result.sort((a: any, b: any) => {
            const timeA = a.blockTime || 0;
            const timeB = b.blockTime || 0;
            return timeA - timeB;
          });

          const firstTx = sortedTxs[0];
          const lastTx = sortedTxs[sortedTxs.length - 1];

          console.log(`Found ${data.result.length} transactions for ${holderAddress}, first: ${firstTx.blockTime}, last: ${lastTx.blockTime}`);

          return {
            firstTransaction: firstTx.blockTime || 0,
            lastTransaction: lastTx.blockTime || 0,
            transactionCount: data.result.length
          };
        }
      }
      
      console.log(`No transaction data found for ${holderAddress}`);
      return {
        firstTransaction: 0,
        lastTransaction: 0,
        transactionCount: 0
      };
    } catch (error) {
      console.log('Error fetching transaction history for', holderAddress, ':', error);
      return {
        firstTransaction: 0,
        lastTransaction: 0,
        transactionCount: 0
      };
    }
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

  if (!searchQuery.trim()) {
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
          <div className="text-sm text-white/40 mt-2">Searching for {searchQuery}</div>
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
          <div className="text-sm">Fetching holders for: <span className="text-blue-300 font-mono">{searchQuery}</span></div>
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
