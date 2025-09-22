"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PureVisualRetrocausality, { PureVisualRetrocausalityRef } from "./PureVisualRetrocausality";
import axios from 'axios';
import { QuantumForecastService, MarketInsights, QuantumForecast } from '../utils/quantumForecastService';

interface NavigationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JupiterData {
  marketCap: number;
  price: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  priceChangePercent24h: number;
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
  // Additional fields for quantum forecast
  devHolding?: number;
  topHolderPercentage?: number;
  age?: number;
  volume5m?: number;
  volume1h?: number;
  volume6h?: number;
  buyVolume?: number;
  sellVolume?: number;
  price?: number;
}


// Validation function to check if search query looks like a token address or name
const isValidTokenQuery = (query: string): boolean => {
  // Check if it looks like a Solana token address (32-44 characters, alphanumeric)
  const isTokenAddress = /^[A-Za-z0-9]{32,44}$/.test(query);
  
  // Check if it looks like a token name (alphanumeric with spaces, hyphens, underscores)
  // Must be at least 2 characters and not contain special characters except spaces, hyphens, underscores
  const isTokenName = /^[A-Za-z0-9\s\-_]{2,50}$/.test(query) && 
                     !/[!@#$%^&*()+=\[\]{};':"\\|,.<>\/?]/.test(query);
  
  return isTokenAddress || isTokenName;
};

export default function NavigationHub({ isOpen, onClose }: NavigationHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchToken[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SearchToken | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showInvalidInput, setShowInvalidInput] = useState(false);
  const [predictionData, setPredictionData] = useState<QuantumForecast>({
    confidence: 0.75,
    expectedRange: { min: 5, max: 15 },
    upProbability: 0.6,
    downProbability: 0.4,
    momentum: {
      priceMomentum: 'Neutral',
      volumeMomentum: 'Stable',
      acceleration: 'Moderate',
      heatingCooling: 'Warm'
    },
    signals: [],
    riskLevel: 'Medium',
    timeHorizon: 'Medium'
  });

  // Jupiter data for dashboard
  const [jupiterData, setJupiterData] = useState<JupiterData | null>(null);
  const [jupiterLoading, setJupiterLoading] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const visualRef = useRef<PureVisualRetrocausalityRef>(null);

  // Fetch Jupiter data for selected token
  const fetchJupiterData = useCallback(async (tokenAddress: string) => {
    if (!tokenAddress) return;
    
    setJupiterLoading(true);
    try {
      const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${tokenAddress}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const tokenData = data[0];
        
        if (tokenData) {
          const marketCap = tokenData.mcap || (tokenData.usdPrice * (tokenData.totalSupply || 1000000000));
          
          // Calculate additional metrics for quantum forecast
          const volume24h = tokenData.volume24h || 0;
          const liquidity = tokenData.liquidity || 0;
          const priceChange24h = tokenData.priceChange24h || 0;
          const priceChangePercent24h = tokenData.priceChangePercent24h || 0;
          
          // Calculate age in hours if available
          let age: number | undefined;
          if (tokenData.firstPool?.createdAt) {
            const createdAt = new Date(tokenData.firstPool.createdAt);
            const now = new Date();
            age = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // hours
          }
          
          setJupiterData({
            marketCap,
            price: tokenData.usdPrice || 0,
            volume24h,
            liquidity,
            priceChange24h,
            priceChangePercent24h
          });
          
          // Update the selected token with additional data for quantum forecast
          if (selectedToken) {
            const updatedToken = {
              ...selectedToken,
              holderCount: tokenData.holderCount,
              devHolding: tokenData.devHolding,
              topHolderPercentage: tokenData.topHolderPercentage,
              age,
              volume5m: tokenData.stats5m?.volume,
              volume1h: tokenData.stats1h?.volume,
              volume6h: tokenData.stats6h?.volume,
              buyVolume: tokenData.stats24h?.buyVolume,
              sellVolume: tokenData.stats24h?.sellVolume,
              price: tokenData.usdPrice
            };
            setSelectedToken(updatedToken);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Jupiter data:', error);
    } finally {
      setJupiterLoading(false);
    }
  }, [selectedToken]);

  // Fetch Jupiter data when token is selected
  useEffect(() => {
    if (selectedToken?.id) {
      fetchJupiterData(selectedToken.id);
    } else {
      setJupiterData(null);
    }
  }, [selectedToken?.id, fetchJupiterData]);

  // Jupiter search function
  const searchTokens = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get('https://lite-api.jup.ag/tokens/v2/search', {
        params: { query: searchQuery },
        headers: { 'Accept': 'application/json' }
      });
      
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };


  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    visualRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    visualRef.current?.zoomOut();
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (showHelp) {
          setShowHelp(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose, showHelp]);

  // Focus search input when hub opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        searchTokens(value.trim());
      } else {
        setSearchResults([]);
        setSelectedToken(null);
      }
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTokens(searchQuery.trim());
    }
  };

  const handleTokenSelect = (token: SearchToken) => {
    // Clear previous selection and reset all related data
    setSelectedToken(null);
    setJupiterData(null);
    setPredictionData({
      confidence: 0,
      expectedRange: { min: 0, max: 0 },
      upProbability: 0,
      downProbability: 0,
      momentum: {
        priceMomentum: 'Neutral',
        volumeMomentum: 'Stable',
        acceleration: 'Moderate',
        heatingCooling: 'Warm'
      },
      signals: [],
      riskLevel: 'Medium',
      timeHorizon: 'Medium'
    });
    
    // Set new token and clear search results
    setSelectedToken(token);
    setSearchQuery(token.symbol);
    setSearchResults([]);
    setIsAnalyzing(true);
    
    // Fetch fresh Jupiter data for the new token
    fetchJupiterData(token.id);
    
    // Calculate quantum forecast based on market insights
    setTimeout(() => {
      if (jupiterData) {
        const marketInsights: MarketInsights = {
          marketCap: jupiterData.marketCap,
          price: jupiterData.price,
          volume24h: jupiterData.volume24h,
          liquidity: jupiterData.liquidity,
          priceChange24h: jupiterData.priceChange24h,
          priceChangePercent24h: jupiterData.priceChangePercent24h,
          // Additional data from Jupiter API if available
          holderCount: token.holderCount,
          devHolding: token.devHolding,
          topHolderPercentage: token.topHolderPercentage,
          age: token.age,
          volume5m: token.volume5m,
          volume1h: token.volume1h,
          volume6h: token.volume6h,
          buyVolume: token.buyVolume,
          sellVolume: token.sellVolume
        };
        
        const forecast = QuantumForecastService.calculateForecast(marketInsights);
        setPredictionData(forecast);
      } else {
        // Fallback to basic calculation if Jupiter data not available
        const fallbackPrice = token.price || token.usdPrice || 0;
        setPredictionData({
          confidence: 0.5,
          expectedRange: { 
            min: fallbackPrice > 0 ? fallbackPrice * 0.8 : 0, 
            max: fallbackPrice > 0 ? fallbackPrice * 1.2 : 0 
          },
          upProbability: 0.5,
          downProbability: 0.5,
          momentum: {
            priceMomentum: 'Neutral',
            volumeMomentum: 'Stable',
            acceleration: 'Moderate',
            heatingCooling: 'Warm'
          },
          signals: [],
          riskLevel: 'Medium',
          timeHorizon: 'Medium'
        });
      }
      setIsAnalyzing(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    if (searchQuery) {
      navigator.clipboard.writeText(searchQuery);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };


  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/50 z-[40] cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClose}
          />
          
          {/* Navigation Hub */}
          <motion.div 
            className="fixed inset-0 z-[50] overflow-visible flex flex-col cursor-default"
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              y: 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: 20
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.1
            }}
            style={{
              background: '#000000',
            }}
          >
        {/* Header - Matching SCOPE UI Design */}
        <motion.div 
          className="bg-black border-b border-white/10 p-4 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="grid grid-cols-3 items-center">
            {/* Left side - RETROCAUSALITY LAB title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                RETROCAUSALITY LAB
              </h1>
              <span className="ml-3 px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                BETA
              </span>
            </div>
        
            {/* Center - Search Bar (Rounded like SCOPE) */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search tokens by symbol, name, or mint address..."
                    className="w-80 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white/60"></div>
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="text-white/50 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    ) : (
                      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </form>
                {isAnalyzing && (
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                    Analyzing...
                  </div>
                )}
              </div>
            </div>
        
            {/* Right side - Help Button and Close Button (Rounded like SCOPE) */}
            <div className="flex justify-end items-center space-x-3">
              {/* Help Button - Rounded like SCOPE */}
              <button
                onClick={() => setShowHelp(true)}
                className="relative p-2 rounded-full transition-all duration-300 bg-black/20 hover:bg-black/40 border border-gray-700 shadow-md shadow-black/30"
              >
                <svg 
                  className="w-5 h-5 text-white transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </button>

              {/* Close Button - Rounded like SCOPE */}
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div 
            className="px-4 lg:px-6 py-4 border-b border-white/10 bg-black/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-sm font-bold text-white tracking-wider mb-3">SEARCH RESULTS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {searchResults.map((token, index) => (
                <div
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-blue-400/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Token Icon */}
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      {token.icon ? (
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-white/60">
                          {token.symbol.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{token.symbol}</span>
                        {token.isVerified && (
                          <span className="text-sm bg-green-500/20 text-green-400 px-1 py-0.5 rounded">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/60 truncate">{token.name}</div>
                      <div className="text-sm text-white/50 font-mono">
                        {token.id.slice(0, 8)}...{token.id.slice(-8)}
                      </div>
                    </div>

                    {/* Token Metrics */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-white">
                        {formatNumber(token.usdPrice)}
                      </div>
                      <div className="text-sm text-white/60">
                        MC: {formatNumber(token.mcap)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Selected Token Display */}
        {selectedToken && (
          <motion.div 
            className="px-4 lg:px-6 py-4 border-b border-white/10 bg-blue-500/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                {selectedToken.icon ? (
                  <img
                    src={selectedToken.icon}
                    alt={selectedToken.symbol}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-lg font-bold text-white/60">
                    {selectedToken.symbol.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedToken.symbol}</h3>
                <p className="text-sm text-white/70">{selectedToken.name}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-lg font-bold text-white">Market Cap: {formatNumber(selectedToken.mcap)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Metrics Bands - Always visible */}
        <motion.div 
          className="px-4 lg:px-6 py-4 border-b border-white/10 bg-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Insights */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white tracking-wider">MARKET INSIGHTS</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">Market Cap</div>
                  <div className="text-lg font-bold text-green-300">
                    {selectedToken && jupiterData ? (
                      jupiterData.marketCap >= 1000000 ? 
                        `$${(jupiterData.marketCap / 1000000).toFixed(1)}M` :
                        jupiterData.marketCap >= 1000 ? 
                        `$${(jupiterData.marketCap / 1000).toFixed(1)}K` :
                        `$${jupiterData.marketCap.toFixed(0)}`
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">Liquidity</div>
                  <div className="text-lg font-bold text-blue-300">
                    {selectedToken && jupiterData ? (
                      jupiterData.liquidity >= 1000000 ? 
                        `$${(jupiterData.liquidity / 1000000).toFixed(1)}M` :
                        jupiterData.liquidity >= 1000 ? 
                        `$${(jupiterData.liquidity / 1000).toFixed(1)}K` :
                        `$${jupiterData.liquidity.toFixed(0)}`
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">24h Volume</div>
                  <div className="text-lg font-bold text-purple-300">
                    {selectedToken && jupiterData ? (
                      jupiterData.volume24h >= 1000000 ? 
                        `$${(jupiterData.volume24h / 1000000).toFixed(1)}M` :
                        jupiterData.volume24h >= 1000 ? 
                        `$${(jupiterData.volume24h / 1000).toFixed(1)}K` :
                        `$${jupiterData.volume24h.toFixed(0)}`
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">24h Change</div>
                  <div className={`text-lg font-bold ${
                    selectedToken && jupiterData ? (
                      jupiterData.priceChangePercent24h >= 0 ? 'text-green-300' : 'text-red-300'
                    ) : 'text-white/40'
                  }`}>
                    {selectedToken && jupiterData ? (
                      `${jupiterData.priceChangePercent24h >= 0 ? '+' : ''}${jupiterData.priceChangePercent24h.toFixed(2)}%`
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white tracking-wider">QUANTUM FORECAST</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-cyan-300">
                    {selectedToken ? Math.round(predictionData.confidence * 100) : '-'}%
                  </div>
                </div>
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">Risk Level</div>
                  <div className={`text-lg font-bold ${
                    selectedToken ? (
                      predictionData.riskLevel === 'Low' ? 'text-green-300' :
                      predictionData.riskLevel === 'Medium' ? 'text-yellow-300' :
                      predictionData.riskLevel === 'High' ? 'text-orange-300' : 'text-red-300'
                    ) : 'text-white/40'
                  }`}>
                    {selectedToken ? predictionData.riskLevel : '-'}
                  </div>
                </div>
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">Expected Range</div>
                  <div className="text-lg font-bold text-yellow-300">
                    {selectedToken && jupiterData && !isNaN(predictionData.expectedRange.min) && !isNaN(predictionData.expectedRange.max) ? (
                      `$${predictionData.expectedRange.min.toFixed(6)} - $${predictionData.expectedRange.max.toFixed(6)}`
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div className="bg-transparent border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/60 mb-1">Up Probability</div>
                  <div className="text-lg font-bold text-green-300">
                    {selectedToken ? Math.round(predictionData.upProbability * 100) : '-'}%
                  </div>
                </div>
              </div>
              
              
            </div>
          </div>
        </motion.div>

        {/* Main Content - Full Width Quantum Field */}
        <motion.div 
          className="h-[calc(100vh-200px)] relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PureVisualRetrocausality 
            ref={visualRef}
            onNodeHover={setHoveredNode}
            predictionData={predictionData}
            selectedToken={selectedToken}
            isSearching={isAnalyzing}
          />
          
          
          {/* Zoom Controls - Bottom Left Corner */}
          <div className="absolute bottom-4 left-4 flex flex-row space-x-2 z-20">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 bg-black/80 hover:bg-black/90 border border-white/30 rounded-full flex items-center justify-center text-white hover:text-blue-300 transition-all duration-200 shadow-lg"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 bg-black/80 hover:bg-black/90 border border-white/30 rounded-full flex items-center justify-center text-white hover:text-blue-300 transition-all duration-200 shadow-lg"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
              </svg>
            </button>
          </div>
          
        </motion.div>

        {/* Help Modal */}
        {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowHelp(false)} />
          <div className="relative bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Help</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white/70 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 text-white/80">
              <div>
                <h3 className="font-semibold text-white mb-2">What you're seeing</h3>
                <p className="text-sm">Quantum Field is a visual sandbox of token impact points (decoders D1–D4, base states BS*, momentum vectors Ma/Mb, and the Prediction Engine). Shapes glow when new signal arrives.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">How to use</h3>
                <p className="text-sm">Enter token address or name → press Enter → watch metrics & stream.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">What the metrics mean</h3>
                <p className="text-sm">Forecast: Short-term price path with confidence and expected range. Not financial advice.</p>
                <p className="text-sm">Future-Echo Δ: A retrocausal heuristic—how future paths echo into present order flow.</p>
                <p className="text-sm">Stream: Real-time trades/holders/liquidity/events. Filter via tabs.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Limits</h3>
                <p className="text-sm">Market data can be delayed or rate-limited; we cache and retry automatically.</p>
              </div>
            </div>
          </div>
        </div>
        )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}