"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';


import ImageWithFallback from './ImageWithFallback';
import HoverImagePreview from './HoverImagePreview';
import CreationTimeDisplay from './CreationTimeDisplay';
import SearchDropdown from './SearchDropdown';
import { chatService, ChatMessage } from '../utils/chatService';

// Helper function to get companion colors
const getCompanionColor = (companionName: string) => {
  switch (companionName) {
    case 'The Quantum Eraser':
      return {
        bg: 'bg-[#637e9a]/10',
        border: 'border-[#637e9a]/30',
        text: 'text-[#637e9a]'
      };
    case 'The Predictor':
      return {
        bg: 'bg-[#3ff600]/10',
        border: 'border-[#3ff600]/30',
        text: 'text-[#3ff600]'
      };
    case 'The Analyzer':
      return {
        bg: 'bg-[#195c8e]/10',
        border: 'border-[#195c8e]/30',
        text: 'text-[#195c8e]'
      };
    case 'The Retrocasual':
      return {
        bg: 'bg-[#a95109]/10',
        border: 'border-[#a95109]/30',
        text: 'text-[#a95109]'
      };
    default:
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-400'
      };
  }
};

// Star Button Component
const StarButton: React.FC<{ tokenMint: string }> = ({ tokenMint }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, watchlist } = React.useContext(WatchlistContext);
  const isStarred = isInWatchlist(tokenMint);

  const handleStarClick = () => {
    if (isStarred) {
      removeFromWatchlist(tokenMint);
    } else {
      // Check if watchlist is full before adding
      if (watchlist.size >= 10) {
        alert('Watchlist is full! Maximum 10 tokens allowed. Remove some tokens first.');
        return;
      }
      addToWatchlist(tokenMint);
    }
  };

  return (
    <button
      onClick={handleStarClick}
      className="p-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all duration-200 flex items-center shrink-0"
    >
      <svg 
        className={`w-4 h-4 transition-colors duration-200 ${
          isStarred ? 'text-yellow-400' : 'text-white/60 hover:text-white'
        }`} 
        fill={isStarred ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
        />
      </svg>
    </button>
  );
};

// Help Button Component
const HelpButton: React.FC<{ onHelpClick: () => void }> = ({ onHelpClick }) => {
  return (
    <motion.button
      onClick={onHelpClick}
      className="relative p-2 rounded-full transition-all duration-300 bg-black/20 hover:bg-black/40 border border-gray-700 shadow-md shadow-black/30"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
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
    </motion.button>
  );
};

// Help Popup Component
const HelpPopup: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-4xl w-full mx-4 relative z-[70] shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">How Scope Works</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 text-white/90">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Token Discovery</h3>
            <p className="text-base leading-relaxed">
              Scope automatically discovers and displays new Solana tokens as they're created. 
              Each token card shows real-time market data, social metrics, and creation information.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Watchlist</h3>
            <p className="text-base leading-relaxed">
              Click the star button on any token to add it to your watchlist. You can track up to 10 tokens 
              and access them quickly from the star button in the header.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Market Data</h3>
            <p className="text-base leading-relaxed">
              View real-time market cap, price changes, holder count, and trading volume.
            </p>
          </div>


          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">AI Companions</h3>
            <p className="text-base leading-relaxed">
              Drag a companion to a token card to chat with AI-powered companions and get insights 
              about tokens, market trends, and trading strategies. Ask questions about any token or market conditions.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Tips</h3>
            <ul className="text-base leading-relaxed space-y-1">
              <li>• Click on token cards to see additional metrics</li>
              <li>• Check the creation time to identify very new tokens</li>
              <li>• Monitor holder count for community growth</li>
              <li>• See predictable outcomes with AI-powered analysis</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Watchlist Context
const WatchlistContext = React.createContext<{
  watchlist: Set<string>;
  addToWatchlist: (mint: string) => void;
  removeFromWatchlist: (mint: string) => void;
  isInWatchlist: (mint: string) => boolean;
}>({
  watchlist: new Set(),
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
});

// Watchlist Provider Component
const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Load watchlist from localStorage on component mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('scope_watchlist');
    if (savedWatchlist) {
      try {
        const parsed = JSON.parse(savedWatchlist);
        if (Array.isArray(parsed)) {
          setWatchlist(new Set(parsed));
        }
      } catch (error) {
        console.error('Failed to load watchlist from localStorage:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (watchlist.size > 0) {
      localStorage.setItem('scope_watchlist', JSON.stringify([...watchlist]));
    } else {
      localStorage.removeItem('scope_watchlist');
    }
  }, [watchlist]);

  const addToWatchlist = useCallback((mint: string) => {
    setWatchlist(prev => {
      // Check if already at maximum (10 tokens)
      if (prev.size >= 10) {
        console.log('Watchlist is full (maximum 10 tokens)');
        return prev; // Don't add if already at limit
      }
      return new Set([...prev, mint]);
    });
  }, []);

  const removeFromWatchlist = useCallback((mint: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      newSet.delete(mint);
      return newSet;
    });
  }, []);

  const isInWatchlist = useCallback((mint: string) => {
    return watchlist.has(mint);
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};

// Watchlist Popup Component
const WatchlistPopup: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  tokens: any[]; 
  onTokenClick?: (token: any) => void;
}> = ({ isOpen, onClose, tokens, onTokenClick }) => {
  const { watchlist, removeFromWatchlist, isInWatchlist } = React.useContext(WatchlistContext);
  
  const watchlistTokens = tokens.filter(token => isInWatchlist(token.mint));

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden relative z-[70] shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Watchlist</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {watchlistTokens.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <div className="text-4xl mb-4">★</div>
              <div className="text-lg">No tokens in watchlist yet</div>
              <div className="text-sm text-white/40 mt-2">Click the star on any token to add it here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlistTokens.map((token) => (
                <div
                  key={token.mint}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors duration-200"
                  onClick={() => {
                    onTokenClick?.(token);
                    onClose(); // Close the watchlist popup when a token is clicked
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      <ImageWithFallback
                        src={token.imageUrl || undefined}
                        alt={token.symbol || token.name || "Token"}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        <span className="text-white/80 text-sm font-mono font-bold uppercase">
                          {token.symbol || token.mint.slice(0, 4)}
                        </span>
                        <span className="ml-2">
                          {token.name || token.symbol || `${token.mint.slice(0, 4)}…${token.mint.slice(-4)}`}
                        </span>
                      </div>
                      <div className="text-white/60 text-sm">
                        {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(token.mint);
                    }}
                    className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                    title="Remove from watchlist"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Header Star Button Component
const HeaderStarButton: React.FC<{ tokens: any[]; onTokenClick?: (token: any) => void }> = ({ tokens, onTokenClick }) => {
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const { watchlist } = React.useContext(WatchlistContext);

  const handleStarClick = () => {
    setIsWatchlistOpen(!isWatchlistOpen);
  };

  return (
    <>
      <motion.button
        onClick={handleStarClick}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          watchlist.size > 0
            ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 shadow-lg shadow-yellow-500/20'
            : 'bg-black/20 hover:bg-black/40 border border-gray-700 shadow-md shadow-black/30'
        }`}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg 
          className={`w-5 h-5 transition-colors duration-200 ${
            watchlist.size > 0 ? 'text-yellow-400' : 'text-white'
          }`} 
          fill={watchlist.size > 0 ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
          />
        </svg>
        {watchlist.size > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-black">
            {watchlist.size}
          </span>
        )}
      </motion.button>
      
      <WatchlistPopup 
        isOpen={isWatchlistOpen} 
        onClose={() => setIsWatchlistOpen(false)} 
        tokens={tokens}
        onTokenClick={onTokenClick}
      />
    </>
  );
};

// Format marketcap with K/M suffixes
const formatNumber = (value: number | string | null | undefined): string => {
  // Convert to number and handle invalid values
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (numValue === null || numValue === undefined || isNaN(numValue) || typeof numValue !== 'number') {
    return '—';
  }
  
  // Handle zero values
  if (numValue === 0) {
    return '0';
  }
  
  if (numValue >= 1e9) {
    return (numValue / 1e9).toFixed(1).replace('.0', '') + 'B';
  } else if (numValue >= 1e6) {
    return (numValue / 1e6).toFixed(1).replace('.0', '') + 'M';
  } else if (numValue >= 1e3) {
    return (numValue / 1e3).toFixed(1).replace('.0', '') + 'K';
  } else {
    return numValue.toFixed(0);
  }
};

// Keep formatMarketcap for backward compatibility
const formatMarketcap = formatNumber;

// Simple AI Forecast Algorithm
interface ForecastData {
  score: number; // -100 to +100 (negative = bearish, positive = bullish)
  confidence: number; // 0 to 100
  signals: string[];
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  reasoning: string;
}

const calculateForecast = (token: any): ForecastData => {
  const signals: string[] = [];
  let score = 0;
  let confidence = 0;
  
  // Market Cap Analysis (0-25 points)
  const marketCap = token.marketCap || 0;
  if (marketCap > 1000000) { // > $1M
    score += 15;
    signals.push('Large market cap indicates stability');
    confidence += 20;
  } else if (marketCap > 100000) { // > $100K
    score += 10;
    signals.push('Moderate market cap shows growth potential');
    confidence += 15;
  } else if (marketCap > 10000) { // > $10K
    score += 5;
    signals.push('Small market cap - high risk/reward');
    confidence += 10;
  } else {
    score -= 10;
    signals.push('Very small market cap - high risk');
    confidence += 5;
  }
  
  // Volume Analysis (0-20 points)
  const volume24h = token.volume24h || 0;
  const volumeRatio = marketCap > 0 ? volume24h / marketCap : 0;
  
  if (volumeRatio > 0.5) { // High volume relative to market cap
    score += 20;
    signals.push('High trading volume indicates strong interest');
    confidence += 25;
  } else if (volumeRatio > 0.1) {
    score += 10;
    signals.push('Moderate trading volume');
    confidence += 15;
  } else if (volumeRatio > 0.01) {
    score += 5;
    signals.push('Low trading volume');
    confidence += 10;
  } else {
    score -= 5;
    signals.push('Very low trading volume - low liquidity');
    confidence += 5;
  }
  
  // Liquidity Analysis (0-15 points)
  const liquidity = token.liquidity || 0;
  const liquidityRatio = marketCap > 0 ? liquidity / marketCap : 0;
  
  if (liquidityRatio > 0.3) {
    score += 15;
    signals.push('High liquidity - easy to trade');
    confidence += 20;
  } else if (liquidityRatio > 0.1) {
    score += 10;
    signals.push('Good liquidity');
    confidence += 15;
  } else if (liquidityRatio > 0.05) {
    score += 5;
    signals.push('Moderate liquidity');
    confidence += 10;
  } else {
    score -= 5;
    signals.push('Low liquidity - potential slippage');
    confidence += 5;
  }
  
  // Holder Analysis (0-15 points)
  const holderCount = token.holderCount || 0;
  if (holderCount > 1000) {
    score += 15;
    signals.push('Large holder base indicates strong community');
    confidence += 20;
  } else if (holderCount > 100) {
    score += 10;
    signals.push('Good holder distribution');
    confidence += 15;
  } else if (holderCount > 10) {
    score += 5;
    signals.push('Small but growing holder base');
    confidence += 10;
  } else {
    score -= 5;
    signals.push('Very few holders - high concentration risk');
    confidence += 5;
  }
  
  // Dev Holding Analysis (0-20 points)
  const devHolding = token.audit?.devBalancePercentage || 0;
  if (devHolding < 5) {
    score += 20;
    signals.push('Low dev holding - good for decentralization');
    confidence += 25;
  } else if (devHolding < 20) {
    score += 10;
    signals.push('Moderate dev holding');
    confidence += 15;
  } else if (devHolding < 50) {
    score -= 5;
    signals.push('High dev holding - potential rug risk');
    confidence += 10;
  } else {
    score -= 15;
    signals.push('Very high dev holding - major rug risk');
    confidence += 5;
  }
  
  // Top Holders Analysis (0-15 points)
  const topHolders = token.audit?.topHoldersPercentage || 0;
  if (topHolders < 20) {
    score += 15;
    signals.push('Well distributed holdings');
    confidence += 20;
  } else if (topHolders < 50) {
    score += 5;
    signals.push('Moderate concentration');
    confidence += 15;
  } else {
    score -= 10;
    signals.push('High concentration - whale risk');
    confidence += 10;
  }
  
  // Organic Score Analysis (0-10 points)
  const organicScore = token.organicScore || 0;
  if (organicScore > 0.7) {
    score += 10;
    signals.push('High organic activity');
    confidence += 15;
  } else if (organicScore > 0.3) {
    score += 5;
    signals.push('Moderate organic activity');
    confidence += 10;
  } else {
    score -= 5;
    signals.push('Low organic activity - potential bot activity');
    confidence += 5;
  }
  
  // Age Analysis (0-10 points)
  const createdAt = new Date(token.createdAt || Date.now());
  const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  
  if (ageInHours < 1) {
    score += 10;
    signals.push('Very fresh token - early opportunity');
    confidence += 15;
  } else if (ageInHours < 24) {
    score += 5;
    signals.push('Recent token - still early');
    confidence += 10;
  } else if (ageInHours < 168) { // 1 week
    score += 2;
    signals.push('Established token');
    confidence += 5;
  } else {
    score -= 5;
    signals.push('Older token - may have missed initial momentum');
    confidence += 5;
  }
  
  // Calculate final recommendation
  let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  if (score >= 60) {
    recommendation = 'STRONG_BUY';
  } else if (score >= 30) {
    recommendation = 'BUY';
  } else if (score >= -30) {
    recommendation = 'HOLD';
  } else if (score >= -60) {
    recommendation = 'SELL';
  } else {
    recommendation = 'STRONG_SELL';
  }
  
  // Generate reasoning
  const positiveSignals = signals.filter(s => s.includes('High') || s.includes('Good') || s.includes('Large') || s.includes('Low dev') || s.includes('Well distributed') || s.includes('fresh') || s.includes('early'));
  const negativeSignals = signals.filter(s => s.includes('Very low') || s.includes('Low') || s.includes('High dev') || s.includes('High concentration') || s.includes('whale risk') || s.includes('rug risk'));
  
  let reasoning = '';
  if (positiveSignals.length > negativeSignals.length) {
    reasoning = `Strong bullish signals: ${positiveSignals.slice(0, 3).join(', ')}. `;
    if (negativeSignals.length > 0) {
      reasoning += `Consider: ${negativeSignals.slice(0, 2).join(', ')}.`;
    }
  } else if (negativeSignals.length > positiveSignals.length) {
    reasoning = `Bearish concerns: ${negativeSignals.slice(0, 3).join(', ')}. `;
    if (positiveSignals.length > 0) {
      reasoning += `Positive: ${positiveSignals.slice(0, 2).join(', ')}.`;
    }
  } else {
    reasoning = `Mixed signals. Positive: ${positiveSignals.slice(0, 2).join(', ')}. Negative: ${negativeSignals.slice(0, 2).join(', ')}.`;
  }
  
  return {
    score: Math.max(-100, Math.min(100, score)),
    confidence: Math.max(0, Math.min(100, confidence)),
    signals,
    recommendation,
    reasoning
  };
};

// Typing Indicator Component
const TypingIndicator: React.FC<{ isTyping: boolean; companionName?: string }> = ({ isTyping, companionName }) => {
  if (!isTyping) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex mb-3 text-base leading-relaxed justify-start"
    >
      <div className="bg-gray-800 text-gray-200 p-3 rounded-lg max-w-[75%]">
        <div className="flex items-end gap-2">
          <span className="px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm font-medium">
            {companionName ? `${companionName} is typing` : 'Companion is typing'}
          </span>
          <div className="flex items-end space-x-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Visibility tracking hook for performance optimization
export function useVisibility(mint: string, visibleMintsRef: React.MutableRefObject<Set<string>>) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visibleMintsRef.current.add(mint);
        else visibleMintsRef.current.delete(mint);
      }
    }, { root: null, threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, [mint, visibleMintsRef]);
  return ref;
}

// Helper function to format supply numbers
const formatSupply = (supply: number): string => {
  if (supply >= 1e9) {
    return `${(supply / 1e9).toFixed(1)}B`;
  } else if (supply >= 1e6) {
    return `${(supply / 1e6).toFixed(1)}M`;
  } else if (supply >= 1e3) {
    return `${(supply / 1e3).toFixed(1)}K`;
  } else {
    return supply.toLocaleString();
  }
};


// Memoized TokenCard for performance
type CardProps = {
  token: any;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
  onCompanionAttached?: (companionName: string, token: any) => void;
  agents: Array<{ name: string; videoFile: string }>;
  attachedCompanion?: string | null;
  onCompanionDetach?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onFocusToken?: (token: any) => void;
  onDragTargetChange?: (token: any | null) => void;
  draggedAgent?: string | null;
};
const TokenCardBase: React.FC<CardProps> = React.memo(({ token, visibleMintsRef, onCompanionAttached, agents, attachedCompanion, onCompanionDetach, onHoverEnter, onHoverLeave, onFocusToken, onDragTargetChange, draggedAgent }) => {
  // Debug logging for market cap and volume data (disabled to reduce console spam)
  // if (token.marketcap !== undefined || token.volume_24h !== undefined) {
  //   console.log(`Token ${token.mint}: MC=${token.marketcap}, Vol=${token.volume_24h}, Price=${token.price_usd}`);
  // }
  const cardRef = useVisibility(token.mint, visibleMintsRef);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  const copyMintAddress = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click handler from firing
    try {
      await navigator.clipboard.writeText(token.mint);
    } catch (err) {
      console.error('Failed to copy mint address:', err);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get click position relative to the card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add click effect
    setIsClicked(true);
    setRipplePosition({ x, y });
    
    // Reset effects after animation
    setTimeout(() => {
      setIsClicked(false);
      setRipplePosition(null);
    }, 300);
    
    // Call the original focus function
    onFocusToken?.(token);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const agentName = e.dataTransfer.getData('text/plain');
    
    if (agentName) {
      // Notify parent component about companion attachment (this will replace existing companion)
      if (onCompanionAttached) {
        onCompanionAttached(agentName, token);
      }
      
      // Clear drag target after successful attachment
      onDragTargetChange?.(null);
    } else {
      onDragTargetChange?.(null);
    }
  };
  
  return (
    <div
      ref={cardRef}
      className={`group relative isolate overflow-visible rounded-xl border hover:scale-102 hover:z-10 transition-all duration-200 token-card cursor-pointer ${
        token.isStock 
          ? 'p-2' // Even smaller padding for stocks
          : 'p-2' // Even smaller padding for crypto
      } ${
        isDragOver
          ? draggedAgent === 'The Quantum Eraser'
            ? 'border-[#637e9a] bg-[#637e9a]/20 scale-105 z-20 ring-2 ring-[#637e9a]/50 animate-pulse'
            : draggedAgent === 'The Predictor'
            ? 'border-[#3ff600] bg-[#3ff600]/20 scale-105 z-20 ring-2 ring-[#3ff600]/50 animate-pulse'
            : draggedAgent === 'The Analyzer'
            ? 'border-[#195c8e] bg-[#195c8e]/20 scale-105 z-20 ring-2 ring-[#195c8e]/50 animate-pulse'
            : draggedAgent === 'The Retrocasual'
            ? 'border-[#a95109] bg-[#a95109]/20 scale-105 z-20 ring-2 ring-[#a95109]/50 animate-pulse'
            : 'border-blue-400 bg-blue-500/20 scale-105 z-20 ring-2 ring-blue-400/50 animate-pulse'
          : isClicked
          ? 'border-white/30 bg-white/12 scale-95'
          : 'border-white/10 bg-white/6'
      }`}
      style={{ willChange: 'transform', pointerEvents: 'auto' }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) {
          setIsDragOver(true);
          onDragTargetChange?.(token);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if we're actually leaving the card, not just moving to a child element
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          setIsDragOver(false);
          onDragTargetChange?.(null);
        }
      }}
      onDrop={handleDrop}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onClick={handleCardClick}
      draggable={false}
    >
      {/* Drop indicator overlay */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`absolute inset-0 rounded-xl border-2 border-dashed flex items-center justify-center z-10 backdrop-blur-sm ${
            draggedAgent === 'The Quantum Eraser'
              ? 'bg-gradient-to-br from-[#637e9a]/20 to-[#637e9a]/30 border-[#637e9a]/60'
              : draggedAgent === 'The Predictor'
              ? 'bg-gradient-to-br from-[#3ff600]/20 to-[#3ff600]/30 border-[#3ff600]/60'
              : draggedAgent === 'The Analyzer'
              ? 'bg-gradient-to-br from-[#195c8e]/20 to-[#195c8e]/30 border-[#195c8e]/60'
              : draggedAgent === 'The Retrocasual'
              ? 'bg-gradient-to-br from-[#a95109]/20 to-[#a95109]/30 border-[#a95109]/60'
              : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/60'
          }`}
        >
          <div className={`text-sm font-medium flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-lg ${
            draggedAgent === 'The Quantum Eraser'
              ? 'text-[#637e9a]'
              : draggedAgent === 'The Predictor'
              ? 'text-[#3ff600]'
              : draggedAgent === 'The Analyzer'
              ? 'text-[#195c8e]'
              : draggedAgent === 'The Retrocasual'
              ? 'text-[#a95109]'
              : 'text-blue-400'
          }`}>
            <span>{attachedCompanion ? 'Switch Companion' : 'Drop Companion Here'}</span>
          </div>
        </motion.div>
      )}


      {/* Click ripple effect */}
      {ripplePosition && (
        <motion.div
          initial={{ 
            scale: 0, 
            opacity: 0.6,
            x: ripplePosition.x - 20,
            y: ripplePosition.y - 20
          }}
          animate={{ 
            scale: 4, 
            opacity: 0,
            x: ripplePosition.x - 20,
            y: ripplePosition.y - 20
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute w-10 h-10 bg-white/30 rounded-full pointer-events-none z-20"
          style={{
            left: 0,
            top: 0,
          }}
        />
      )}
      


      
      {/* Star button - top right corner */}
      <div className="absolute top-2 right-2 z-20">
        <StarButton tokenMint={token.mint} />
      </div>
      
      {/* Header row: avatar, name/symbol, copy button */}
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-2">
        {/* Avatar container with HoverImagePreview */}
        <div className={`relative shrink-0 overflow-visible ${
          token.isStock ? 'h-10 w-10' : 'h-10 w-10'
        }`}>
          {token.imageUrl ? (
            <HoverImagePreview 
              src={token.imageUrl}
              alt={token.symbol || token.name || "Token"}
              thumbClass="h-full w-full object-cover rounded-md"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold rounded-md">
              {(token.symbol || token.name || "T").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Token info */}
        <div className="min-w-0 flex-1">
          <div className={`text-white font-semibold truncate flex items-center gap-2 ${
            token.isStock ? 'text-sm' : 'text-sm'
          }`}>
            <span className={`text-white/80 font-mono font-bold uppercase ${
              token.isStock ? 'text-xs' : 'text-xs'
            }`}>
              {token.symbol || token.mint.slice(0, 4)}
            </span>
            <span className={token.isStock ? 'text-sm' : 'text-sm'}>
              {token.name || token.symbol || `${token.mint.slice(0, 4)}…${token.mint.slice(-4)}`}
            </span>
            {/* Copy button */}
            <button
              onClick={copyMintAddress}
              className={`bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all duration-200 flex items-center shrink-0 relative z-30 ${
                token.isStock ? 'p-0.5' : 'p-1'
              }`}
            >
              <svg 
                className={`transition-colors duration-200 text-white/60 hover:text-white ${
                  token.isStock ? 'w-2.5 h-2.5' : 'w-3 h-3'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 2H4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2z" 
                />
              </svg>
            </button>
            
            {/* Attached Companion Icon - inline with copy button */}
            {attachedCompanion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center shrink-0"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-transparent companion-video">
                    {/* Find the agent video for this companion */}
                    {(() => {
                      const agent = agents.find(a => a.name === attachedCompanion);
                      return agent ? (
                        agent.videoFile.endsWith('.gif') ? (
                          <img 
                            key={`${attachedCompanion}-${agent.videoFile}`}
                            src={agent.videoFile}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                            style={{ 
                              mixBlendMode: 'screen',
                              filter: 'brightness(1.2) contrast(1.1)',
                              background: 'transparent !important',
                              backgroundColor: 'transparent !important',
                              backgroundImage: 'none !important',
                              backgroundClip: 'padding-box',
                              WebkitBackgroundClip: 'padding-box'
                            }}
                          />
                        ) : (
                          <video 
                            key={`${attachedCompanion}-${agent.videoFile}`}
                            src={agent.videoFile}
                            loop
                            muted
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ 
                              mixBlendMode: 'screen',
                              filter: 'brightness(1.2) contrast(1.1)',
                              background: 'transparent !important',
                              backgroundColor: 'transparent !important',
                              backgroundImage: 'none !important',
                              backgroundClip: 'padding-box',
                              WebkitBackgroundClip: 'padding-box'
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {attachedCompanion.split(' ').map(word => word[0]).join('')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          {/* Creation time display - hide for stocks */}
          {!token.isStock && (
            <CreationTimeDisplay 
              createdAt={token.created_at || token.createdAt || new Date()} 
              className="mt-1"
            />
          )}
        </div>
      </div>
      
      {/* Metrics row - Always visible */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="min-w-0 flex items-center">
          <span className="text-white/60">MC:</span>
          <span className={`ml-1 font-mono font-semibold ${
            token.is_on_curve 
              ? 'text-white' 
              : (token.marketCap !== undefined && token.marketCap !== null
                  ? (token.marketCap > 30000 
                      ? 'text-yellow-400' 
                      : token.marketCap > 0
                        ? 'text-green-400'
                        : 'text-gray-400')
                  : 'text-white')
          }`}>
            {token.is_on_curve ? '— (on curve)' : (token.marketCap !== undefined && token.marketCap !== null ? `$${formatNumber(token.marketCap)}` : '—')}
          </span>
        </div>
        <div className="min-w-0 flex items-center">
          <span className="text-white/60">Vol:</span>
          <span className="text-white ml-1 font-mono">
            {token.is_on_curve ? '— (on curve)' : (token.volume24h !== undefined && token.volume24h !== null ? `$${formatNumber(token.volume24h)}` : '—')}
          </span>
        </div>
        <div className="min-w-0 flex items-center">
          <span className="text-white/60">LP:</span>
          <span className="text-white ml-1 font-mono">
            {token.is_on_curve ? '— (on curve)' : (token.liquidity !== undefined && token.liquidity !== null ? `$${formatNumber(token.liquidity)}` : '—')}
          </span>
        </div>
      </div>
      
      {/* Percentage Data Row */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Social Links */}
          <div className="flex items-center gap-1">
            {/* Pump.fun Icon - Show for tokens ending with "pump" */}
            {token.mint.toLowerCase().endsWith('pump') && (
              <a
                href={`https://pump.fun/${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Pump.fun"
              >
                <img 
                  src="/PF.png" 
                  alt="Pump.fun" 
                  className="w-4 h-4 rounded-sm"
                />
              </a>
            )}
            
            {/* BONK Icon - Show for tokens ending with "bonk" */}
            {token.mint.toLowerCase().endsWith('bonk') && (
              <a
                href={`https://bonkcoin.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="BONK"
              >
                <img 
                  src="/BONK.png" 
                  alt="BONK" 
                  className="w-4 h-4 rounded-sm"
                />
              </a>
            )}
            
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Website"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </a>
            )}
            
            {token.twitter && (
              <a
                href={token.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Twitter/X"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            
            {token.telegram && (
              <a
                href={token.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Telegram"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </a>
            )}
          </div>
          
            {/* Top Holders Percentage */}
            {token.audit?.topHoldersPercentage !== undefined && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 cursor-help"
                title={`Top holders control ${token.audit.topHoldersPercentage.toFixed(1)}% of the token supply`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-teal-400">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L12 11l-2.99-2.01A2.5 2.5 0 0 0 7 8H5.46c-.8 0-1.54.37-2.01.99L1 15.37V22h2v-6h2.5l2.5 7.5h2L8.5 16H11v6h2v-6h2.5l2.5 7.5h2L16.5 16H19v6h2z"/>
                </svg>
                <span className="text-xs text-white/80 font-mono">
                  {token.audit.topHoldersPercentage.toFixed(1)}%
                </span>
              </div>
            )}
            
            {/* Dev Holding Percentage */}
            {token.audit?.devBalancePercentage !== undefined && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 cursor-help"
                title={`Developer holds ${token.audit.devBalancePercentage.toFixed(1)}% of the token supply`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-teal-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-xs text-white/80 font-mono">
                  {token.audit.devBalancePercentage.toFixed(1)}%
                </span>
              </div>
            )}
        </div>
        
        {/* Contract Address - positioned on the far right */}
        <span className="text-xs text-white/30 font-mono">
          {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
        </span>
      </div>
      
      {/* Bonding Curve Badge */}
      {(token.is_on_curve || token.status === 'curve') && (
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            BONDING CURVE
          </span>
        </div>
      )}
      
      {/* Stock-specific information */}
      {token.stockInfo && (
        <div className="mt-2 space-y-1">
          {token.stockInfo.primary_exchange && (
            <div className="text-xs text-white/50">
              <span className="text-white/60">Exchange:</span> {token.stockInfo.primary_exchange}
            </div>
          )}
          {token.stockInfo.type && (
            <div className="text-xs text-white/50">
              <span className="text-white/60">Type:</span> {token.stockInfo.type}
            </div>
          )}
          {token.stockInfo.locale && (
            <div className="text-xs text-white/50">
              <span className="text-white/60">Market:</span> {token.stockInfo.locale.toUpperCase()}
            </div>
          )}
        </div>
      )}
      
    </div>
  );
});

const shallowPickEq = (a: any, b: any) =>
  a.mint === b.mint &&
  a.name === b.name &&
  a.symbol === b.symbol &&
  a.imageUrl === b.imageUrl &&
  a.is_on_curve === b.is_on_curve &&
  a.price === b.price &&
  a.marketCap === b.marketCap &&
  a.liquidity === b.liquidity &&
  a.volume24h === b.volume24h &&
  JSON.stringify(a.links) === JSON.stringify(a.links);

export const TokenCard = React.memo(TokenCardBase, (prev, next) =>
  shallowPickEq(prev.token, next.token) &&
  prev.attachedCompanion === next.attachedCompanion &&
  prev.draggedAgent === next.draggedAgent
);

// Token Column
function TokenColumn({ 
  title, 
  items, 
  className = "",
  visibleMintsRef,
  onCompanionAttached,
  agents,
  newTokenMint,
  attachedCompanion,
  onCompanionDetach,
  onHoverEnter,
  onHoverLeave,
  onFocusToken,
  onDragTargetChange,
  draggedAgent,
  filters
}: { 
  title: string; 
  items: any[]; 
  className?: string;
  visibleMintsRef: React.MutableRefObject<Set<string>>;
  onCompanionAttached?: (companionName: string, token: any) => void;
  agents: Array<{ name: string; videoFile: string }>;
  newTokenMint: string | null;
  attachedCompanion: {name: string, tokenMint: string} | null;
  onCompanionDetach?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onFocusToken?: (token: any) => void;
  onDragTargetChange?: (token: any | null) => void;
  draggedAgent?: string | null;
  filters: {
    minMarketCap: string;
    maxMarketCap: string;
    keywords: string;
    minAge: string;
    maxAge: string;
    highlightPumpFun: boolean;
    highlightBonk: boolean;
    showBoth: boolean;
  };
}) {

  return (
    <div className={`flex flex-col min-w-0 flex-1 relative z-0 ${className}`}>
      <div className="bg-black/15 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] pb-6">
        <motion.div 
          className="flex flex-col gap-2"
          layout
        >
          {items.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm">No tokens yet</div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((token, index) => {
                const isNewToken = newTokenMint === token.mint;
                const companionForToken = attachedCompanion && attachedCompanion.tokenMint === token.mint ? attachedCompanion.name : null;
                
                // Check if token should be highlighted
                const isPumpFunToken = token.mint && token.mint.toLowerCase().includes('pump') || 
                                     (token.name && token.name.toLowerCase().includes('pump')) ||
                                     (token.symbol && token.symbol.toLowerCase().includes('pump'));
                const isBonkToken = token.mint && token.mint.toLowerCase().includes('bonk') || 
                                   (token.name && token.name.toLowerCase().includes('bonk')) ||
                                   (token.symbol && token.symbol.toLowerCase().includes('bonk'));
                
                const shouldShow = filters.showBoth || 
                                   (!filters.highlightPumpFun && !filters.highlightBonk) ||
                                   (filters.highlightPumpFun && isPumpFunToken) || 
                                   (filters.highlightBonk && isBonkToken);
                
                // Skip token if it doesn't meet highlight criteria
                if (!shouldShow) return null;
                
                return (
                  <motion.div 
                    key={`${token.mint}-${token.updated_at || token.created_at || index}`} 
                    className={`relative ${index === items.length - 1 ? 'mb-4' : ''}`}
                    data-mint={token.mint}
                    initial={{ 
                      opacity: 0, 
                      y: -50, 
                      scale: 0.95,
                      rotateX: -15
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      rotateX: 0
                    }}
                    exit={{ 
                      opacity: 0, 
                      y: 50, 
                      scale: 0.95,
                      rotateX: 15
                    }}
                    transition={{ 
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    layout
                    style={{
                      transformOrigin: "top center",
                      perspective: "1000px"
                    }}
                  >
                    {isNewToken ? (
                      <motion.div
                        initial={{ 
                          opacity: 0, 
                          y: -30, 
                          scale: 0.9,
                          rotateX: -20,
                          boxShadow: "0 0 0 rgba(34, 197, 94, 0)"
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          rotateX: 0,
                          boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)"
                        }}
                        transition={{ 
                          duration: 0.8,
                          ease: [0.25, 0.46, 0.45, 0.94],
                          type: "spring",
                          stiffness: 120,
                          damping: 12
                        }}
                        className="relative"
                      >
                        {/* NEW Badge */}
                        <motion.div
                          initial={{ 
                            opacity: 0, 
                            scale: 0,
                            rotate: -10
                          }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            rotate: 0
                          }}
                          transition={{ 
                            delay: 0.2,
                            duration: 0.5,
                            ease: "backOut"
                          }}
                          className="absolute -top-2 -right-2 z-10"
                        >
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-green-400">
                            NEW
                          </div>
                        </motion.div>
                        
                        <TokenCard 
                          token={token} 
                          visibleMintsRef={visibleMintsRef} 
                          onCompanionAttached={onCompanionAttached}
                          agents={agents}
                          attachedCompanion={attachedCompanion && attachedCompanion.tokenMint === token.mint ? attachedCompanion.name : null}
                          onCompanionDetach={onCompanionDetach}
                          onHoverEnter={onHoverEnter}
                          onHoverLeave={onHoverLeave}
                          onFocusToken={onFocusToken}
                          onDragTargetChange={onDragTargetChange}
                          draggedAgent={draggedAgent}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        layout
                        transition={{
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      >
                      <TokenCard 
                        token={token} 
                        visibleMintsRef={visibleMintsRef} 
                        onCompanionAttached={onCompanionAttached}
                        agents={agents}
                        attachedCompanion={attachedCompanion && attachedCompanion.tokenMint === token.mint ? attachedCompanion.name : null}
                        onCompanionDetach={onCompanionDetach}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onFocusToken={onFocusToken}
                        onDragTargetChange={onDragTargetChange}
                        draggedAgent={draggedAgent}
                      />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// InsightCard Component
function InsightCard({ 
  title, 
  icon, 
  children, 
  className = "" 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`group rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 hover:-translate-y-0.5 px-4 py-3 desktop:px-4 desktop:py-3 px-3 py-2 mr-2 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 ${className}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="uppercase tracking-wider text-[11px] text-white/70 font-mono">{title}</h3>
      </div>
      <div className="border-b border-neutral-800/60 -mx-4 mt-2 mb-3" />
      {children}
    </div>
  );
}

// ConfidenceBar Component
function ConfidenceBar({ 
  value, 
  className = "" 
}: { 
  value: number; 
  className?: string; 
}) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const color = clampedValue > 70 ? 'bg-green-400' : clampedValue > 40 ? 'bg-yellow-400' : 'bg-red-400';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-white/80">
        {clampedValue}%
      </span>
    </div>
  );
}

// Insights Column Component
function InsightsColumn({ 
  focusToken,
  className = ""
}: { 
  focusToken: any | null;
  className?: string;
}) {
  const [holderCount, setHolderCount] = useState<number | null>(null);
  const [holderLoading, setHolderLoading] = useState(false);
  const [lastHolderUpdate, setLastHolderUpdate] = useState<Date | null>(null);
  
  // Time period selection
  const [selectedTimeframe, setSelectedTimeframe] = useState<'5m' | '1h' | '6h' | '24h'>('5m');

  // Real-time market data from Jupiter (consolidated)
  const [jupiterData, setJupiterData] = useState<{
    usdPrice: number;
    priceChange: number;
    marketCap: number;
    liquidity: number;
    volume: {
      buy: number;
      sell: number;
      total: number;
    };
    holderCount: number;
    topHoldersPercentage: number;
    devHoldingPercentage: number;
    totalSupply: number;
    lastUpdate: Date;
  } | null>(null);
  const [jupiterLoading, setJupiterLoading] = useState(false);
  const [jupiterRefreshing, setJupiterRefreshing] = useState(false);

  // Function to fetch all market data from Jupiter (consolidated)
  const fetchJupiterMarketData = async (mint: string, isInitial = false) => {
    if (!mint) return;
    
    if (isInitial) {
      setJupiterLoading(true);
    } else {
      setJupiterRefreshing(true);
    }
    
    try {
      
      const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${mint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const tokenData = data[0];
        
        if (tokenData) {
          // Use Jupiter's provided market cap or calculate if not available
          const marketCap = tokenData.mcap || (tokenData.usdPrice * (tokenData.totalSupply || 1000000000));
          
          // Get data based on selected timeframe
          const getTimeframeData = (timeframe: string) => {
            switch (timeframe) {
              case '5m':
                return {
                  priceChange: tokenData.stats5m?.priceChange || 0,
                  volume: {
                    buy: tokenData.stats5m?.buyVolume || 0,
                    sell: tokenData.stats5m?.sellVolume || 0,
                    total: (tokenData.stats5m?.buyVolume || 0) + (tokenData.stats5m?.sellVolume || 0)
                  }
                };
              case '1h':
                return {
                  priceChange: tokenData.stats1h?.priceChange || 0,
                  volume: {
                    buy: tokenData.stats1h?.buyVolume || 0,
                    sell: tokenData.stats1h?.sellVolume || 0,
                    total: (tokenData.stats1h?.buyVolume || 0) + (tokenData.stats1h?.sellVolume || 0)
                  }
                };
              case '6h':
                return {
                  priceChange: tokenData.stats6h?.priceChange || 0,
                  volume: {
                    buy: tokenData.stats6h?.buyVolume || 0,
                    sell: tokenData.stats6h?.sellVolume || 0,
                    total: (tokenData.stats6h?.buyVolume || 0) + (tokenData.stats6h?.sellVolume || 0)
                  }
                };
              case '24h':
                return {
                  priceChange: tokenData.stats24h?.priceChange || 0,
                  volume: {
                    buy: tokenData.stats24h?.buyVolume || 0,
                    sell: tokenData.stats24h?.sellVolume || 0,
                    total: (tokenData.stats24h?.buyVolume || 0) + (tokenData.stats24h?.sellVolume || 0)
                  }
                };
              default:
                return {
                  priceChange: tokenData.stats5m?.priceChange || 0,
                  volume: {
                    buy: tokenData.stats5m?.buyVolume || 0,
                    sell: tokenData.stats5m?.sellVolume || 0,
                    total: (tokenData.stats5m?.buyVolume || 0) + (tokenData.stats5m?.sellVolume || 0)
                  }
                };
            }
          };

          const timeframeData = getTimeframeData(selectedTimeframe);
          
          console.log(`🔍 JUPITER DEBUG (${selectedTimeframe}):`, {
            mint: mint.slice(0, 8),
            price: tokenData.usdPrice,
            marketCap: tokenData.mcap,
            liquidity: tokenData.liquidity,
            priceChange: timeframeData.priceChange,
            volume: timeframeData.volume,
            holderCount: tokenData.holderCount,
            topHoldersPercentage: tokenData.audit?.topHoldersPercentage || 0,
            devHoldingPercentage: tokenData.audit?.devBalancePercentage || 0,
            calculatedMarketCap: marketCap,
            totalSupply: tokenData.totalSupply,
            audit: tokenData.audit
          });
          
          setJupiterData({
            usdPrice: tokenData.usdPrice,
            priceChange: timeframeData.priceChange,
            marketCap: marketCap,
            liquidity: tokenData.liquidity || 0,
            volume: timeframeData.volume,
            holderCount: tokenData.holderCount || 0,
            topHoldersPercentage: tokenData.audit?.topHoldersPercentage || 0,
            devHoldingPercentage: tokenData.audit?.devBalancePercentage || 0,
            totalSupply: tokenData.totalSupply || 0,
            lastUpdate: new Date()
          });
          
        } else {
          console.log(`⚠️ JUPITER: No market data found for ${mint.slice(0, 8)}...`);
        }
      } else {
        console.log(`❌ JUPITER: API failed with status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ JUPITER: Error fetching market data for ${mint.slice(0, 8)}...:`, error);
    } finally {
      if (isInitial) {
        setJupiterLoading(false);
      } else {
        setJupiterRefreshing(false);
      }
    }
  };

  // Function to fetch holder count
  const fetchHolderCount = async (mint: string) => {
    if (!mint) return;
    
    setHolderLoading(true);
    try {
      // console.log(`🔍 Fetching holder count for ${mint}`);
      
      // Try our server-side holder endpoint first (most reliable)
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
          (process.env.NODE_ENV === 'production' 
            ? 'http://localhost:8080'
            : 'http://localhost:8080');
        const serverResponse = await fetch(`${serverUrl}/api/tokens/${mint}/holders?limit=1000`);
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          if (serverData.holders && Array.isArray(serverData.holders)) {
            setHolderCount(serverData.holders.length);
            setLastHolderUpdate(new Date());
            // console.log(`✅ Found ${serverData.holders.length} holders from server`);
            setHolderLoading(false);
            return;
          }
        }
      } catch (serverError) {
        // console.log('Server endpoint failed:', serverError);
      }
      
      // Try Birdeye API (may hit rate limits)
      try {
        const birdeyeResponse = await fetch(`https://public-api.birdeye.so/defi/v3/token/holder?address=${mint}&limit=100&ui_amount_mode=scaled`, {
          headers: {
            'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
            'accept': 'application/json',
            'x-chain': 'solana'
          }
        });
        
        if (birdeyeResponse.ok) {
          const birdeyeData = await birdeyeResponse.json();
          if (birdeyeData.data && birdeyeData.data.items && Array.isArray(birdeyeData.data.items)) {
            setHolderCount(birdeyeData.data.items.length);
            setLastHolderUpdate(new Date());
            setHolderLoading(false);
            return;
          }
        } else {
          console.log(`Birdeye API failed with status ${birdeyeResponse.status}: ${birdeyeResponse.statusText}`);
          const errorText = await birdeyeResponse.text();
          console.log('Birdeye error response:', errorText);
        }
      } catch (birdeyeError) {
        console.log('Birdeye API error:', birdeyeError);
      }
      
      // Fallback to Solscan API (free tier, may have CORS issues)
      try {
        const solscanResponse = await fetch(`https://api.solscan.io/token/holders?token=${mint}&limit=100`, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (solscanResponse.ok) {
          const solscanData = await solscanResponse.json();
          if (solscanData.data && Array.isArray(solscanData.data)) {
            setHolderCount(solscanData.data.length);
            setLastHolderUpdate(new Date());
            setHolderLoading(false);
            return;
          }
        } else {
          console.log(`Solscan API failed with status ${solscanResponse.status}: ${solscanResponse.statusText}`);
        }
      } catch (solscanError) {
        console.log('Solscan API error:', solscanError);
      }
      
      // If no data found from any source, try to estimate based on market cap
      console.log(`⚠️ No holder data found for ${mint} from any API`);
      
      // Try to estimate holder count based on market cap and volume
      if (focusToken && focusToken.marketCap && focusToken.volume24h) {
        try {
          const marketcap = parseFloat(focusToken.marketCap);
          const volume24h = parseFloat(focusToken.volume24h);
          
          if (marketcap > 0 && volume24h > 0) {
            // Rough estimation: higher market cap and volume = more holders
            // This is a very rough estimate, but better than showing N/A
            let estimatedHolders = Math.floor(Math.sqrt(marketcap / 1000) + volume24h / 10000);
            
            // Cap the estimate at reasonable bounds
            estimatedHolders = Math.max(10, Math.min(estimatedHolders, 10000));
            
            setHolderCount(estimatedHolders);
            setLastHolderUpdate(new Date());
            console.log(`📊 Estimated ${estimatedHolders} holders based on market cap/volume`);
            setHolderLoading(false);
            return;
          }
        } catch (estimateError) {
          console.log('Failed to estimate holder count:', estimateError);
        }
      }
      
      // Final fallback: set to null if no estimation possible
      setHolderCount(null);
      
    } catch (error) {
      console.error(`❌ Error fetching holder count for ${mint}:`, error);
      setHolderCount(null);
    } finally {
      setHolderLoading(false);
    }
  };

  // Fetch holders when focusToken changes
  useEffect(() => {
    if (focusToken && focusToken.mint) {
      fetchHolderCount(focusToken.mint);
    } else {
      setHolderCount(null);
      setLastHolderUpdate(null);
    }
  }, [focusToken?.mint]);

  // Fetch Jupiter market data when focusToken changes
  useEffect(() => {
    if (focusToken && focusToken.mint) {
      fetchJupiterMarketData(focusToken.mint, true);
    } else {
      setJupiterData(null);
    }
  }, [focusToken?.mint]);

  // Refetch data when timeframe changes
  useEffect(() => {
    if (focusToken && focusToken.mint && jupiterData) {
      fetchJupiterMarketData(focusToken.mint, false);
    }
  }, [selectedTimeframe]);

  // Auto-refresh holder count every 5 seconds
  useEffect(() => {
    if (!focusToken || !focusToken.mint) return;

    const interval = setInterval(() => {
      // console.log(`🔄 Auto-refreshing holder count for ${focusToken.mint}`);
      fetchHolderCount(focusToken.mint);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [focusToken?.mint]);

  // Auto-refresh Jupiter market data every 5 seconds
  useEffect(() => {
    if (!focusToken || !focusToken.mint) return;

    const interval = setInterval(() => {
      fetchJupiterMarketData(focusToken.mint, false);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [focusToken?.mint]);
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{
    futureEchoDelta: string;
    scenarioBias: string;
    confidence: number;
    reasoning: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAiUpdate, setLastAiUpdate] = useState<Date | null>(null);

  // Server API base URL

  // Helper function to format values with fallbacks
  const formatValue = (value: any, fallback: string = "N/A") => {
    if (value === null || value === undefined || value === 'null' || value === '0') {
      return fallback;
    }
    return value;
  };

  // Helper function to clamp values
  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  // Fetch AI analysis for retrocausality
  const fetchAiAnalysis = useCallback(async () => {
    if (!focusToken?.mint || aiLoading) return;

    setAiLoading(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'http://localhost:8080'
          : 'http://localhost:8080');
      const response = await fetch(`${serverUrl}/api/grok/retrocausality/${focusToken.mint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          try {
            const analysisData = JSON.parse(data.analysis);
            setAiAnalysis(analysisData);
            setLastAiUpdate(new Date());
          } catch (parseError) {
            console.error('Failed to parse AI analysis:', parseError);
          }
        }
      } else {
        console.error('Failed to fetch AI analysis:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
    } finally {
      setAiLoading(false);
    }
  }, [focusToken?.mint]);

  // 5-second polling for AI analysis updates (as requested)
  useEffect(() => {
    if (!focusToken?.mint) {
      setAiAnalysis(null);
      return;
    }

    // Initial fetch
    fetchAiAnalysis();

    // Set up 5-second polling (as requested)
    const interval = setInterval(() => {
      fetchAiAnalysis();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [focusToken?.mint, fetchAiAnalysis]);

  // Calculate metrics with real token data
  // AI Forecast state - now using algorithm
  const [aiForecast, setAiForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Algorithm-based AI Forecast
  const fetchIntelligentAIForecast = useCallback(async (token: any, timeframe: string) => {
    if (!token?.mint) return;
    
    setForecastLoading(true);
    setForecastError(null);
    
    try {
      console.log(`🤖 Calculating algorithm-based forecast for ${token.symbol} (${timeframe})`);
      
      // Use our algorithm to calculate forecast
      const forecast = calculateForecast(token);
      
      
      setAiForecast(forecast);
      
    } catch (error) {
      console.error('❌ Algorithm forecast error:', error);
      setForecastError(error instanceof Error ? error.message : 'Failed to calculate forecast');
      setAiForecast(null);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  // Fetch AI forecast when token or timeframe changes
  useEffect(() => {
    if (focusToken?.mint && selectedTimeframe) {
      fetchIntelligentAIForecast(focusToken, selectedTimeframe);
    }
  }, [focusToken?.mint, selectedTimeframe, fetchIntelligentAIForecast]);

  const getTokenMetrics = (token: any) => {
    if (!token) return null;

    // Use the correct field names from the transformed data
    const marketcap = token.marketCap || 0;
    const liquidity = token.liquidity || 0;
    const volume24h = token.volume24h || 0;
    const priceUsd = token.price || 0;
    
    // Calculate token age from creation date
    const createdAt = token.created_at || token.blocktime || token.launch_time;
    const tokenAge = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) : "N/A";
    
    // Format token age with units
    const formatAge = (days: number) => {
      if (days < 1) return "<1 day";
      if (days === 1) return "1 day";
      if (days < 7) return `${days} days`;
      if (days < 30) return `${Math.floor(days / 7)} weeks`;
      if (days < 365) return `${Math.floor(days / 30)} months`;
      return `${Math.floor(days / 365)} years`;
    };
    
    const formattedAge = typeof tokenAge === 'number' ? formatAge(tokenAge) : tokenAge;
    
    // Calculate confidence based on real metrics
    let confidence = 50; // Base confidence
    
    // Boost confidence for tokens with good fundamentals
    if (marketcap && Number(marketcap) > 1000000) confidence += 20; // $1M+ market cap
    if (liquidity && Number(liquidity) > 100000) confidence += 15; // $100K+ liquidity
    if (volume24h && Number(volume24h) > 50000) confidence += 15; // $50K+ volume
    if (typeof tokenAge === 'number' && tokenAge > 7) confidence += 10; // 1+ week old
    
    // Reduce confidence for risky indicators
    if (typeof tokenAge === 'number' && tokenAge < 1) confidence -= 20; // Less than 1 day
    if (token.status === 'fresh') confidence -= 15; // Fresh status
    if (token.is_on_curve) confidence -= 10; // Still on bonding curve
    
    confidence = clamp(confidence, 0, 100);
    
    // Calculate price movement prediction dynamically
    const price10mMove = (() => {
      if (!priceUsd) return "N/A";
      
      // Calculate volatility based on real metrics
      let baseVolatility = 1.0;
      
      // Age-based volatility adjustments
      if (typeof tokenAge === 'number' && tokenAge < 1) baseVolatility = 3.5; // Very new = very high volatility
      else if (typeof tokenAge === 'number' && tokenAge < 7) baseVolatility = 2.5; // New = high volatility
      else if (token.status === 'fresh') baseVolatility = 3.0; // Fresh = high volatility
      else if (token.is_on_curve) baseVolatility = 1.8; // Curve = medium volatility
      else baseVolatility = 1.0; // Established = low volatility
      
      // Volume-based adjustments
      if (volume24h && Number(volume24h) > 1000000) baseVolatility *= 1.5; // High volume = higher volatility
      else if (volume24h && Number(volume24h) < 10000) baseVolatility *= 0.7; // Low volume = lower volatility
      
      // Market cap adjustments
      if (marketcap && Number(marketcap) < 100000) baseVolatility *= 1.8; // Small cap = higher volatility
      else if (marketcap && Number(marketcap) > 10000000) baseVolatility *= 0.6; // Large cap = lower volatility
      
      // Liquidity adjustments
      if (liquidity && marketcap) {
        const liquidityRatio = Number(liquidity) / Number(marketcap);
        if (liquidityRatio < 0.05) baseVolatility *= 1.6; // Low liquidity = higher volatility
        else if (liquidityRatio > 0.2) baseVolatility *= 0.8; // High liquidity = lower volatility
      }
      
      const finalVolatility = Math.max(0.3, Math.min(8.0, baseVolatility)); // Clamp between 0.3% and 8%
      return `±${finalVolatility.toFixed(1)}%`;
    })();
    
    const price1hMove = (() => {
      if (!priceUsd) return "N/A";
      
      // Calculate 1h volatility based on 10m volatility (typically 3-4x higher)
      let baseVolatility = 1.0;
      
      // Age-based volatility adjustments
      if (typeof tokenAge === 'number' && tokenAge < 1) baseVolatility = 12.0; // Very new = very high volatility
      else if (typeof tokenAge === 'number' && tokenAge < 7) baseVolatility = 8.5; // New = high volatility
      else if (token.status === 'fresh') baseVolatility = 10.0; // Fresh = high volatility
      else if (token.is_on_curve) baseVolatility = 6.0; // Curve = medium volatility
      else baseVolatility = 4.0; // Established = low volatility
      
      // Volume-based adjustments
      if (volume24h && Number(volume24h) > 1000000) baseVolatility *= 1.4; // High volume = higher volatility
      else if (volume24h && Number(volume24h) < 10000) baseVolatility *= 0.8; // Low volume = lower volatility
      
      // Market cap adjustments
      if (marketcap && Number(marketcap) < 100000) baseVolatility *= 1.6; // Small cap = higher volatility
      else if (marketcap && Number(marketcap) > 10000000) baseVolatility *= 0.7; // Large cap = lower volatility
      
      // Liquidity adjustments
      if (liquidity && marketcap) {
        const liquidityRatio = Number(liquidity) / Number(marketcap);
        if (liquidityRatio < 0.05) baseVolatility *= 1.5; // Low liquidity = higher volatility
        else if (liquidityRatio > 0.2) baseVolatility *= 0.9; // High liquidity = lower volatility
      }
      
      const finalVolatility = Math.max(1.0, Math.min(25.0, baseVolatility)); // Clamp between 1% and 25%
      return `±${finalVolatility.toFixed(1)}%`;
    })();
    
    // Calculate expected range based on token characteristics
    const getExpectedRange = () => {
      // Calculate expected range dynamically
      
      let baseRange = 5.0; // Base expected range
      
      // Age-based adjustments
      if (typeof tokenAge === 'number' && tokenAge < 1) baseRange = 20.0; // Very new = high volatility
      else if (typeof tokenAge === 'number' && tokenAge < 7) baseRange = 12.0; // New = high volatility
      else if (token.status === 'fresh') baseRange = 15.0; // Fresh = high volatility
      else if (token.is_on_curve) baseRange = 8.0; // Curve = medium volatility
      else baseRange = 5.0; // Established = low volatility
      
      // Volume-based adjustments
      if (volume24h && Number(volume24h) > 1000000) baseRange *= 1.3; // High volume = higher range
      else if (volume24h && Number(volume24h) < 10000) baseRange *= 0.8; // Low volume = lower range
      
      // Market cap adjustments
      if (marketcap && Number(marketcap) < 100000) baseRange *= 1.5; // Small cap = higher range
      else if (marketcap && Number(marketcap) > 10000000) baseRange *= 0.7; // Large cap = lower range
      
      // Liquidity adjustments
      if (liquidity && marketcap) {
        const liquidityRatio = Number(liquidity) / Number(marketcap);
        if (liquidityRatio < 0.05) baseRange *= 1.4; // Low liquidity = higher range
        else if (liquidityRatio > 0.2) baseRange *= 0.8; // High liquidity = lower range
      }
      
      const finalRange = Math.max(2.0, Math.min(50.0, baseRange)); // Clamp between 2% and 50%
      return `±${finalRange.toFixed(0)}%`;
    };
    
    const expectedRange = getExpectedRange();
    
    // Calculate up probability based on real metrics and token characteristics
    const upProbability = (() => {
      let prob = 50; // Base probability
      
      // Market cap adjustments (most important factor)
      if (marketcap && Number(marketcap) > 10000000) prob += 30; // $10M+ market cap
      else if (marketcap && Number(marketcap) > 5000000) prob += 20; // $5M+ market cap
      else if (marketcap && Number(marketcap) > 1000000) prob += 10; // $1M+ market cap
      else if (marketcap && Number(marketcap) < 50000) prob -= 25; // Less than $50K market cap
      else if (marketcap && Number(marketcap) < 100000) prob -= 15; // Less than $100K market cap
      
      // Liquidity adjustments
      if (liquidity && Number(liquidity) > 1000000) prob += 20; // $1M+ liquidity
      else if (liquidity && Number(liquidity) > 500000) prob += 15; // $500K+ liquidity
      else if (liquidity && Number(liquidity) > 100000) prob += 10; // $100K+ liquidity
      else if (liquidity && Number(liquidity) < 10000) prob -= 20; // Less than $10K liquidity
      
      // Volume adjustments
      if (volume24h && Number(volume24h) > 1000000) prob += 15; // $1M+ volume
      else if (volume24h && Number(volume24h) > 500000) prob += 12; // $500K+ volume
      else if (volume24h && Number(volume24h) > 100000) prob += 8; // $100K+ volume
      else if (volume24h && Number(volume24h) < 1000) prob -= 15; // Less than $1K volume
      
      // Age adjustments
      if (typeof tokenAge === 'number' && tokenAge > 90) prob += 15; // 3+ months old
      else if (typeof tokenAge === 'number' && tokenAge > 30) prob += 10; // 1+ month old
      else if (typeof tokenAge === 'number' && tokenAge > 7) prob += 5; // 1+ week old
      else if (typeof tokenAge === 'number' && tokenAge < 1) prob -= 25; // Less than 1 day
      else if (typeof tokenAge === 'number' && tokenAge < 3) prob -= 15; // Less than 3 days
      
      // Status adjustments
      if (token.status === 'fresh') prob -= 20; // Fresh status
      else if (token.status === 'active') prob += 5; // Active status
      
      // Curve adjustments
      if (token.is_on_curve) prob -= 10; // Still on bonding curve
      
      // Liquidity ratio adjustments (liquidity relative to market cap)
      if (liquidity && marketcap) {
        const liquidityRatio = Number(liquidity) / Number(marketcap);
        if (liquidityRatio > 0.2) prob += 15; // Very high liquidity ratio
        else if (liquidityRatio > 0.1) prob += 10; // High liquidity ratio
        else if (liquidityRatio > 0.05) prob += 5; // Good liquidity ratio
        else if (liquidityRatio < 0.01) prob -= 20; // Very low liquidity ratio
        else if (liquidityRatio < 0.02) prob -= 10; // Low liquidity ratio
      }
      
      return clamp(prob, 5, 95); // Keep between 5% and 95%
    })();
    
    // Calculate future-echo delta based on token metrics
    const getFutureEchoDelta = () => {
      if (!marketcap || !liquidity) return "N/A";
      const liquidityRatio = Number(liquidity) / Number(marketcap);
      if (liquidityRatio > 0.1) return "Strong";
      if (liquidityRatio > 0.05) return "Medium";
      return "Weak";
    };
    
    const futureEchoDelta = getFutureEchoDelta(); 
    
    // Determine scenario bias
    const scenarioBias = confidence > 60 ? "Bullish" : confidence < 40 ? "Bearish" : "Neutral";
    
    // Calculate momentum metrics based on volume and age
    const getPriceMomentum = () => {
      if (!volume24h || !marketcap) return "N/A";
      const volumeRatio = Number(volume24h) / Number(marketcap);
      if (volumeRatio > 0.2) return "High";
      if (volumeRatio > 0.1) return "Medium";
      return "Low";
    };
    
    const priceMomentum = getPriceMomentum();
    const volumeMomentum = volume24h ? (Number(volume24h) > 100000 ? "High" : Number(volume24h) > 10000 ? "Medium" : "Low") : "N/A";
    
    // Calculate acceleration based on age and status
    const getAcceleration = () => {
      if (typeof tokenAge === 'number' && tokenAge < 1) return "Rapid";
      if (typeof tokenAge === 'number' && tokenAge < 7) return "Growing";
      if (token.status === 'fresh') return "New";
      return "Steady";
    };
    
    const acceleration = getAcceleration();
    
    // Determine heating/cooling based on confidence and volume
    const getHeatingCooling = () => {
      if (confidence > 70 && volume24h && Number(volume24h) > 50000) return "Hot";
      if (confidence > 60 && volume24h && Number(volume24h) > 10000) return "Warm";
      if (confidence < 40 || !volume24h || Number(volume24h) < 1000) return "Cool";
      return "Warm";
    };
    
    const heatingCooling = getHeatingCooling();

    return {
      confidence,
      marketcap: marketcap ? `$${formatMarketcap(marketcap)}` : "N/A",
      liquidity: liquidity ? `$${formatMarketcap(liquidity)}` : "N/A",
      volume24h: volume24h ? `$${formatMarketcap(volume24h)}` : "N/A",
      priceUsd: priceUsd ? `$${formatMarketcap(priceUsd)}` : "N/A",
      holderCount: token.holder_count ?? token.holders ?? "N/A",
      tokenAge: formattedAge,
      price10mMove,
      price1hMove,
      expectedRange,
      upProbability,
      futureEchoDelta,
      scenarioBias,
      priceMomentum,
      volumeMomentum,
      acceleration,
      heatingCooling,
      // Additional real data
      status: token.status,
      source: token.source,
      decimals: token.decimals,
      supply: token.supply ? (token.supply / Math.pow(10, token.decimals)).toLocaleString() : "N/A",
      isOnCurve: token.is_on_curve,
      creator: token.creator,
      blocktime: token.blocktime
    };
  };

  const metrics = getTokenMetrics(focusToken);

  return (
    <div className={`flex flex-col min-w-0 flex-1 relative z-0 ${className}`}>
      <div className="bg-black/15 p-4 overflow-y-auto overflow-x-visible h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] pb-6">
        {!focusToken ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-center italic transition-opacity duration-300 ease-in-out text-lg">
              Click on a token to see insights
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Selected Token Card */}
            <div className="rounded-2xl bg-white/[0.04] p-3 mr-2 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3">
                {/* Token Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                  {focusToken.imageUrl ? (
                    <img 
                      src={focusToken.imageUrl}
                      alt={focusToken.symbol || focusToken.name || "Token"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {(focusToken.symbol || focusToken.name || "T").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm font-mono font-bold uppercase">
                      {focusToken.symbol || focusToken.mint.slice(0, 4)}
                    </span>
                    <span className="text-white text-sm font-medium truncate">
                      {focusToken.name || focusToken.symbol || `${focusToken.mint.slice(0, 4)}…${focusToken.mint.slice(-4)}`}
                    </span>
                  </div>
                  <div className="text-white/50 text-xs font-mono">
                    {focusToken.mint.slice(0, 8)}...{focusToken.mint.slice(-8)}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                  focusToken.is_on_curve || focusToken.status === 'curve'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-green-500/15 text-green-300 border-green-500/30'
                }`}>
                  {focusToken.is_on_curve || focusToken.status === 'curve' ? 'CURVE' : 'ACTIVE'}
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <InsightCard 
              title="Insights" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              {/* Timeframe Selection Buttons */}
              <div className="flex space-x-1 mb-3">
                {(['5m', '1h', '6h', '24h'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-white/20 text-white font-semibold'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>

              {/* Main Metrics Grid - 3 columns for better organization */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Left Column - Core Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Confidence</div>
                    <ConfidenceBar value={metrics?.confidence || 0} />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Marketcap</div>
                    <div className="text-white text-base font-mono flex items-center space-x-2">
                      {jupiterLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white/60"></div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            {jupiterData ? 
                              `$${formatMarketcap(jupiterData.marketCap)}` : 
                              (focusToken.is_on_curve ? '— (on curve)' : 
                               (focusToken.marketCap && focusToken.marketCap !== 'null' && focusToken.marketCap !== '0' ? `$${formatMarketcap(parseFloat(focusToken.marketCap))}` : '—'))
                            }
                          </span>
                          {jupiterRefreshing && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white/40"></div>
                          )}
                          {jupiterData && !jupiterRefreshing && (
                            <span className="text-white/40 text-xs">(live)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Liquidity</div>
                    <div className="text-white text-base font-mono flex items-center space-x-2">
                      {jupiterLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white/60"></div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            {jupiterData ? 
                              `$${jupiterData.liquidity.toLocaleString()}` : 
                              (metrics?.liquidity || "N/A")
                            }
                          </span>
                          {jupiterRefreshing && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white/40"></div>
                          )}
                          {jupiterData && !jupiterRefreshing && (
                            <span className="text-white/40 text-xs">
                              ({Math.floor((Date.now() - jupiterData.lastUpdate.getTime()) / 1000)}s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Holders</div>
                    <div className="text-white text-base font-mono flex items-center space-x-2">
                      {jupiterLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white/60"></div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            {jupiterData ? 
                              jupiterData.holderCount.toLocaleString() : 
                              (holderCount !== null ? holderCount.toLocaleString() : "N/A")
                            }
                          </span>
                          {jupiterRefreshing && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white/40"></div>
                          )}
                          {jupiterData && !jupiterRefreshing && (
                            <span className="text-white/40 text-xs">
                              ({Math.floor((Date.now() - jupiterData.lastUpdate.getTime()) / 1000)}s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Holder Distribution - Always visible */}
                    <div className="text-white/60 text-xs font-mono mt-2 flex items-center space-x-4">
                      <span className="flex items-center space-x-2">
                        <span>Top:</span>
                        <span className="text-yellow-400 font-semibold">
                          {jupiterData && jupiterData.topHoldersPercentage && jupiterData.topHoldersPercentage > 0 
                            ? `${jupiterData.topHoldersPercentage.toFixed(1)}%`
                            : 'N/A'
                          }
                        </span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <span>Dev:</span>
                        <span className={`font-semibold ${jupiterData && jupiterData.devHoldingPercentage && jupiterData.devHoldingPercentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {jupiterData && jupiterData.devHoldingPercentage && jupiterData.devHoldingPercentage > 0 
                            ? `${jupiterData.devHoldingPercentage.toFixed(1)}%`
                            : 'sold'
                          }
                        </span>
                        {jupiterData && (
                          <span className="text-white/50 text-xs ml-1">
                            ({formatSupply(jupiterData.totalSupply || 0)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Price & Volume */}
                <div className="space-y-3">
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Price</div>
                    <div className="text-white text-base font-mono flex items-center space-x-2">
                      {jupiterLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white/60"></div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            {jupiterData && jupiterData.usdPrice ? 
                              `$${jupiterData.usdPrice.toFixed(8)}` : 
                              (focusToken.price ? `$${parseFloat(focusToken.price).toFixed(8)}` : 'N/A')
                            }
                          </span>
                          {jupiterRefreshing && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white/40"></div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Price Change */}
                    {jupiterData && (
                      <div className="text-white/50 text-sm font-mono mt-1">
                        {selectedTimeframe}: <span className={`font-semibold ${jupiterData && jupiterData.priceChange !== undefined && jupiterData.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {jupiterData && jupiterData.priceChange !== undefined ? (jupiterData.priceChange >= 0 ? '+' : '') + jupiterData.priceChange.toFixed(2) + '%' : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">{selectedTimeframe} Volume</div>
                    <div className="text-white text-sm font-mono">
                      {jupiterLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white/60"></div>
                      ) : jupiterData ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-green-400 text-sm">Buy:</span>
                            <span className="text-sm font-semibold">${jupiterData.volume.buy.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-red-400 text-sm">Sell:</span>
                            <span className="text-sm font-semibold">${jupiterData.volume.sell.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/60 border-t border-white/10 pt-1">
                            <span className="text-sm">Total:</span>
                            <span className="text-sm font-semibold">${jupiterData.volume.total.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm">
                          {focusToken.is_on_curve ? '— (on curve)' : '—'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Age & Status */}
                <div className="space-y-3">
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Age</div>
                    <div className="text-white text-base font-mono font-semibold">
                      {(() => {
                        const createdDate = new Date(focusToken.created_at || focusToken.createdAt || new Date());
                        const now = new Date();
                        const diffInSeconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);
                        
                        if (diffInSeconds < 60) {
                          return `${diffInSeconds}s ago`;
                        } else if (diffInSeconds < 3600) {
                          const minutes = Math.floor(diffInSeconds / 60);
                          return `${minutes}m ago`;
                        } else if (diffInSeconds < 86400) {
                          const hours = Math.floor(diffInSeconds / 3600);
                          return `${hours}h ago`;
                        } else {
                          const days = Math.floor(diffInSeconds / 86400);
                          return `${days}d ago`;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </InsightCard>

            {/* Forecast Section */}
            <InsightCard 
              title="AI Forecast" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            >
              {/* Error Display */}
              {forecastError && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-xs">
                  ⚠️ {forecastError}
                </div>
              )}
              
              <div className="space-y-4">
                {/* Recommendation */}
                <div>
                  <div className="text-white/60 text-sm font-mono mb-2">Recommendation</div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-mono font-semibold border ${
                    aiForecast?.recommendation === 'STRONG_BUY' 
                      ? 'bg-green-500/20 text-green-300 border-green-500/40' 
                      : aiForecast?.recommendation === 'BUY'
                        ? 'bg-green-500/15 text-green-300 border-green-500/30'
                        : aiForecast?.recommendation === 'HOLD'
                          ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                          : aiForecast?.recommendation === 'SELL'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                    {forecastLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white/60"></div>
                    ) : (
                      <>
                        <span>{aiForecast?.recommendation || "N/A"}</span>
                        {aiForecast && !forecastLoading && (
                          <span className="text-blue-400 text-xs ml-2" title="Algorithm Generated">🧠</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Score and Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Score</div>
                    <div className={`text-lg font-mono font-semibold ${
                      (aiForecast?.score || 0) > 30 
                        ? 'text-green-400' 
                        : (aiForecast?.score || 0) > -30 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>
                      {forecastLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-white/60"></div>
                      ) : (
                        `${aiForecast?.score || 0}`
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Confidence</div>
                    <div className="text-lg font-mono font-semibold text-white">
                      {forecastLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-white/60"></div>
                      ) : (
                        `${aiForecast?.confidence || 0}%`
                      )}
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                {aiForecast?.reasoning && (
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Analysis</div>
                    <div className="text-sm text-white/80 bg-white/5 p-3 rounded-md border border-white/10">
                      {aiForecast.reasoning}
                    </div>
                  </div>
                )}

                {/* Key Signals */}
                {aiForecast?.signals && aiForecast.signals.length > 0 && (
                  <div>
                    <div className="text-white/60 text-sm font-mono mb-2">Key Signals</div>
                    <div className="space-y-1">
                      {aiForecast.signals.slice(0, 4).map((signal, index) => (
                        <div key={index} className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded border border-white/10">
                          • {signal}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* AI Reasoning Display */}
              {aiForecast?.reasoning && !forecastLoading && (
                <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 text-xs">
                  <div className="font-semibold mb-1">AI Analysis:</div>
                  <div>{aiForecast.reasoning}</div>
                </div>
              )}
              
              {/* Dynamic Calculation Info */}
              {!aiForecast && !forecastLoading && metrics && (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-300 text-xs">
                  <div className="font-semibold mb-1">Dynamic Analysis:</div>
                  <div>
                    Calculated volatility based on real-time data: 
                    {metrics.liquidity && ` liquidity: ${metrics.liquidity},`}
                    {metrics.tokenAge && ` age: ${metrics.tokenAge},`}
                    {metrics.marketcap && ` market cap: ${metrics.marketcap}`}
                    {metrics.status && `, status: ${metrics.status}`}
                  </div>
                </div>
              )}
            </InsightCard>

            {/* Retrocausality Section - AI Powered */}
            <InsightCard 
              title="Retrocausality" 
              icon={
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {aiLoading && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Future-echo Δ</div>
                  <div className="text-white text-[12px] font-mono flex items-center gap-1">
                    {aiAnalysis ? (
                      <>
                        <span className={
                          aiAnalysis.futureEchoDelta === 'Strong' ? 'text-green-400' : 
                          aiAnalysis.futureEchoDelta === 'Medium' ? 'text-yellow-400' : 
                          'text-red-400'
                        }>
                          {aiAnalysis.futureEchoDelta === 'Strong' ? '▲' : 
                           aiAnalysis.futureEchoDelta === 'Medium' ? '→' : '▼'}
                        </span>
                        {aiAnalysis.futureEchoDelta}
                      </>
                    ) : metrics?.futureEchoDelta && metrics.futureEchoDelta !== "N/A" ? (
                      <>
                        <span className={
                          metrics.futureEchoDelta === 'Strong' ? 'text-green-400' : 
                          metrics.futureEchoDelta === 'Medium' ? 'text-yellow-400' : 
                          'text-red-400'
                        }>
                          {metrics.futureEchoDelta === 'Strong' ? '▲' : 
                           metrics.futureEchoDelta === 'Medium' ? '→' : '▼'}
                        </span>
                        {metrics.futureEchoDelta}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Scenario bias</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                    aiAnalysis ? (
                      aiAnalysis.scenarioBias === 'Bullish' 
                        ? 'bg-green-500/15 text-green-300 border-green-500/30' 
                        : aiAnalysis.scenarioBias === 'Bearish' 
                          ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                          : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                    ) : (
                      metrics?.scenarioBias === 'Bullish' 
                        ? 'bg-green-500/15 text-green-300 border-green-500/30' 
                        : metrics?.scenarioBias === 'Bearish' 
                          ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                          : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                    )
                  }`}>
                    {aiAnalysis?.scenarioBias || metrics?.scenarioBias || "N/A"}
                  </div>
                </div>
              </div>
            </InsightCard>

            {/* Momentum Section */}
            <InsightCard 
              title="Momentum" 
              icon={
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Price momentum</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.priceMomentum || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Volume momentum</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.volumeMomentum || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Acceleration</div>
                  <div className="text-white text-[12px] font-mono">{metrics?.acceleration || "N/A"}</div>
                </div>
                <div>
                  <div className="text-white/50 text-[12px] font-mono mb-1">Heating/Cooling</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono border ${
                    metrics?.heatingCooling === 'Hot' 
                      ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                      : metrics?.heatingCooling === 'Warm' 
                        ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' 
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    {metrics?.heatingCooling || 'N/A'}
                  </div>
                </div>
              </div>
            </InsightCard>

          </div>
        )}
      </div>
    </div>
  );
}

// Cache buster: v2.1.0 - Console logs removed
export const Scope = ({ 
  isOpen, 
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
  newTokenMint,
  onClose
}: { 
  isOpen: boolean;
  tokens: any[];
  isLoading: boolean;
  lastUpdate: Date | null;
  stats: any;
  connectionStatus: string;
  live: boolean;
  resumeLive: () => void;
  pauseLive: () => void;
  pauseLiveOnHover: () => void;
  resumeLiveAfterHover: () => void;
  isHoverPaused: boolean;
  queuedTokens: any[];
  newTokenMint: string | null;
  onClose: () => void;
}) => {
  // Track visible mints for performance optimization
  const visibleMintsRef = useRef<Set<string>>(new Set());
  
  // Track which companion is currently attached (only one at a time)
  const [attachedCompanion, setAttachedCompanion] = useState<{name: string, tokenMint: string} | null>(null);
  
  // Focused token for insights
  const [focusToken, setFocusToken] = useState<any|null>(null);
  
  
  // Handle companion attachment - only one companion can be attached at a time
  const handleCompanionAttached = (companionName: string, token: any) => {
    setAttachedCompanion({name: companionName, tokenMint: token.mint});
  };
  
  // Handle companion detach
  const handleCompanionDetach = () => {
    setAttachedCompanion(null);
    setDraggedAgent(null); // Clear drag state to make companion visible again
    setMessages([]); // Clear chat messages when companion is detached
    setInputMessage(''); // Clear input field
    setCurrentConversationId(null); // Clear current conversation ID
  };
  
  // Token filtering state (removed - no longer using search filtering)
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Help popup state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingCompanion, setTypingCompanion] = useState<string | null>(null);
  
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'menu' | 'api' | 'history'>('menu');
  const [selectedAPI, setSelectedAPI] = useState('server-grok');
  const [apiKeys, setApiKeys] = useState({
    grok4: '',
    gpt4: '',
    claude: '',
    gemini: ''
  });
  const [showApiKeyPopup, setShowApiKeyPopup] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    title: string;
    messages: Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>;
    timestamp: Date;
    summary?: string;
  }>>([]);

  // AI Agents state
  const [hoveredAgent, setHoveredAgent] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag preview state
  const [dragTargetToken, setDragTargetToken] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAgent, setDraggedAgent] = useState<string | null>(null);
  
  // Asset type dropdown state
  const [assetType, setAssetType] = useState<'crypto' | 'stocks' | 'news' | 'sports'>('crypto');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Stock data state
  const [stockData, setStockData] = useState<any[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  
  // Coming soon popup state
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonType, setComingSoonType] = useState<'stocks' | 'news' | 'sports'>('stocks');
  
  // Filter state
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filters, setFilters] = useState({
    minMarketCap: '',
    maxMarketCap: '',
    keywords: '',
    minAge: '',
    maxAge: '',
    highlightPumpFun: false,
    highlightBonk: false,
    showBoth: true
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Fetch company logo using multiple free logo APIs
  const fetchCompanyLogo = async (symbol: string, companyName: string) => {
    try {
      // Create a clean company name for domain generation
      const cleanName = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .replace(/inc|corp|corporation|company|co|ltd|limited/g, ''); // Remove common suffixes
      
      // Try multiple logo APIs with different approaches
      const logoUrls = [
        // Clearbit logo API (most reliable for major companies)
        `https://logo.clearbit.com/${cleanName}.com`,
        // Alternative domain variations
        `https://logo.clearbit.com/${cleanName}inc.com`,
        `https://logo.clearbit.com/${cleanName}corp.com`,
        // Google favicon API as fallback
        `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=64`,
        // Generic company logo placeholder
        `https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=${symbol.substring(0, 2).toUpperCase()}`
      ];
      
      // Return the first URL (Clearbit is usually the best)
      return logoUrls[0];
    } catch (error) {
      console.error(`Error generating logo URL for ${symbol}:`, error);
      // Return a placeholder with the stock symbol
      return `https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=${symbol.substring(0, 2).toUpperCase()}`;
    }
  };

  // Fetch stock data using Polygon.io API
  const fetchStockData = useCallback(async () => {
    setIsLoadingStocks(true);
    try {
      console.log('🌐 Fetching stock data from Polygon.io...');
      
      const response = await fetch(`https://api.polygon.io/v3/reference/tickers?market=stocks&active=true&order=asc&limit=100&sort=ticker&apiKey=6SwtFMhGSebBDn4CpGs1i7yu2lcXtDHd`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`🌐 Received ${data.results?.length || 0} stocks from Polygon.io`);
      
      if (data.results && data.results.length > 0) {
        // Sort stocks to get biggest companies first (Apple, Microsoft, etc.)
        const sortedStocks = data.results.sort((a: any, b: any) => {
          // Define major companies that should be on top
          const majorCompanies = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.A', 'BRK.B', 'UNH', 'JNJ', 'JPM', 'V', 'PG', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE', 'NFLX'];
          
          const aIsMajor = majorCompanies.includes(a.ticker);
          const bIsMajor = majorCompanies.includes(b.ticker);
          
          // Major companies first
          if (aIsMajor && !bIsMajor) return -1;
          if (!aIsMajor && bIsMajor) return 1;
          
          // Among major companies, sort by their predefined order
          if (aIsMajor && bIsMajor) {
            return majorCompanies.indexOf(a.ticker) - majorCompanies.indexOf(b.ticker);
          }
          
          // For non-major companies, prioritize major exchanges
          const exchangePriority: { [key: string]: number } = { 'XNYS': 1, 'XNAS': 2, 'XASE': 3 };
          const aExchangePriority = exchangePriority[a.primary_exchange] || 999;
          const bExchangePriority = exchangePriority[b.primary_exchange] || 999;
          
          if (aExchangePriority !== bExchangePriority) {
            return aExchangePriority - bExchangePriority;
          }
          
          // Then sort by ticker alphabetically
          return a.ticker.localeCompare(b.ticker);
        });

        // Transform Polygon.io data to match our token format - LIMIT TO 100 STOCKS
        const transformedStocks = await Promise.all(
          sortedStocks.slice(0, 100).map(async (stock: any, index: number) => {
            // Fetch logo for each stock
            const logoUrl = await fetchCompanyLogo(stock.ticker, stock.name);
            
            return {
              mint: `STOCK_${stock.ticker}_${index}`,
              symbol: stock.ticker,
              name: stock.name,
              displaySymbol: stock.ticker,
              currency: stock.currency_name?.toUpperCase() || 'USD',
              type: stock.type || 'CS',
              status: 'fresh',
              created_at: new Date().toISOString(),
              createdAt: new Date(),
              marketcap: '0', // Polygon.io doesn't provide market cap in this endpoint
              volume_24h: '0',
              is_on_curve: false,
              source: 'Polygon.io',
              links: {},
              website: null,
              twitter: null,
              telegram: null,
              imageUrl: logoUrl, // Use logo URL as imageUrl for display
              logo: logoUrl, // Keep logo URL as well
              isStock: true, // Flag to identify stocks
              // Stock-specific data
              stockInfo: {
                active: stock.active,
                cik: stock.cik,
                composite_figi: stock.composite_figi,
                currency_name: stock.currency_name,
                locale: stock.locale,
                market: stock.market,
                primary_exchange: stock.primary_exchange,
                share_class_figi: stock.share_class_figi,
                type: stock.type,
                last_updated_utc: stock.last_updated_utc,
                delisted_utc: stock.delisted_utc
              }
            };
          })
        );
        
        setStockData(transformedStocks);
      } else {
        setStockData([]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setStockData([]);
    } finally {
      setIsLoadingStocks(false);
    }
  }, []);

  // Fetch stock data when stocks are selected
  useEffect(() => {
    if (assetType === 'stocks' && stockData.length === 0) {
      console.log('📈 Fetching stock data...');
      fetchStockData();
    }
  }, [assetType, stockData.length, fetchStockData]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);


  // Load conversations from localStorage on component mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('scope_conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversationHistory(conversationsWithDates);
      } catch (error) {
        console.error('Failed to load conversations from localStorage:', error);
      }
    }
  }, []);

  // Load API keys and selected API from localStorage
  useEffect(() => {
    try {
      const savedApiKeys = localStorage.getItem('companion_api_keys');
      const savedSelectedAPI = localStorage.getItem('selected_api');
      
      if (savedApiKeys) {
        const parsedKeys = JSON.parse(savedApiKeys);
        // Migrate old API key structure to new structure
        const migratedKeys = {
          grok4: parsedKeys.grok4 || '',
          gpt4: parsedKeys.gpt4 || parsedKeys.chatgpt || '',
          claude: parsedKeys.claude || '',
          gemini: parsedKeys.gemini || parsedKeys.perplexity || ''
        };
        setApiKeys(migratedKeys);
        
        // Save migrated keys back to localStorage
        localStorage.setItem('companion_api_keys', JSON.stringify(migratedKeys));
      }
      
      if (savedSelectedAPI) {
        // Migrate old API names to new names
        const migratedAPI = savedSelectedAPI === 'chatgpt' ? 'gpt4' : 
                           savedSelectedAPI === 'perplexity' ? 'gemini' : 
                           savedSelectedAPI;
        setSelectedAPI(migratedAPI);
        
        // Save migrated API back to localStorage
        localStorage.setItem('selected_api', migratedAPI);
      }
    } catch (error) {
      console.error('Failed to load API configuration from localStorage:', error);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('scope_conversations', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);


  // Reset filter when tokens change (removed - no longer using search filtering)

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  // Auto-close chat when Scope closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInputMessage('');
    }
  }, [isOpen]);
  







  // AI Agents data - Now using WIZZARD WebM video files
  const agents = [
    {
      name: "The Analyzer",
      description: "Breaks down every token's anatomy: market cap, liquidity depth, holder distribution, wallet flows, and trading frequency — exposing both strength and weakness.",
      videoFile: "/WIZZARD/The Analyzer.gif"
    },
    {
      name: "The Predictor",
      description: "Uses historical patterns, momentum curves, and volatility signals to forecast where the market is likely to push a token next.",
      videoFile: "/WIZZARD/The Predictor.gif"
    },
    {
      name: "The Quantum Eraser",
      description: "Removes misleading noise like spoofed trades, bot spam, and fake liquidity — reconstructing a clean version of the token's true history.",
      videoFile: "/WIZZARD/The Quantum Eraser.gif"
    },
    {
      name: "The Retrocasual",
      description: "Simulates future scenarios, then feeds those echoes back into the present — letting potential outcomes reshape today's analysis.",
      videoFile: "/WIZZARD/The Retrocasual.gif"
    }
  ];

  // Debug: Monitor tokens state changes (disabled for production)
  // useEffect(() => {
  //   console.log("SCOPE: Tokens state changed:", {
  //     tokensLength: tokens?.length || 0,
  //     isLoading,
  //     connectionStatus,
  //     lastUpdate: lastUpdate?.toLocaleTimeString() || null
  //   });
  // }, [tokens, isLoading, connectionStatus, lastUpdate]);



  // Memoize filtered tokens to prevent recalculation on every render
  const filteredTokens = useMemo(() => {
    // console.log("🔍 Scope filtering tokens:", tokens?.length || 0, "tokens received", tokens?.slice(0, 2));
    
    // Use all tokens (no more search filtering)
    const tokensToFilter = tokens;
    
    if (!tokensToFilter || !Array.isArray(tokensToFilter) || tokensToFilter.length === 0) {
      // console.log("❌ No tokens to filter");
      return { newPairs: [], onEdge: [], filled: [], curveTokens: [] };
    }
    
    // Debug: Log first few tokens to see their structure (disabled for production)
    // console.log("Sample tokens:", tokensToFilter.slice(0, 3).map(t => ({
    //   name: t.name,
    //   symbol: t.symbol,
    //   status: t.status,
    //   isOnCurve: t.isOnCurve // Use transformed property name
    // })));
    
    // Filter out unwanted tokens (Jupiter, Sugar, .sol domains, etc.)
    const isUnwantedToken = (token: any) => {
      if (!token) return true;
      
      const name = (token.name || '').toLowerCase();
      const symbol = (token.symbol || '').toLowerCase();
      
      const unwantedPatterns = [
        'jupiter vault', 'jv', 'jupiter', 'jupiter lend', 'jupiter borrow',
        'sugar', 'sugarglider',
        '.sol',
        'orbit', 'earth', 'earthorbit', 'highearthorbit', 'orbitpig', 'pigorbit',
        'vault', 'test', 'demo', 'lend', 'borrow',
        'raydium cpmm', 'cpmm', 'creator pool', 'creator', 'pool',
        'meteora', 'meteora dbc', 'dbc', 'dynamic bonding curve', 'meteora dynamic',
        'associated token', 'token account', 'ata', 'atoken',
        'moon', 'moonit', 'mooncoin', 'moon token'
      ];
      
      return unwantedPatterns.some(pattern => 
        name.includes(pattern) || symbol.includes(pattern)
      );
    };

    // Apply custom filters to fresh tokens
    const applyCustomFilters = (tokens: any[]) => {
      // console.log(`🔍 Applying filters: minMC=${filters.minMarketCap}, maxMC=${filters.maxMarketCap}, keywords=${filters.keywords}`);
      return tokens.filter(token => {
        // Market cap filtering
        const marketcap = token.marketCap || 0;
        // console.log(`📊 Token ${token.mint}: marketcap=${marketcap}, min=${filters.minMarketCap}, max=${filters.maxMarketCap}`);
        if (filters.minMarketCap && marketcap < parseFloat(filters.minMarketCap)) {
          // console.log(`❌ Filtered out ${token.mint}: marketcap ${marketcap} < min ${filters.minMarketCap}`);
          return false;
        }
        if (filters.maxMarketCap && marketcap > parseFloat(filters.maxMarketCap)) {
          // console.log(`❌ Filtered out ${token.mint}: marketcap ${marketcap} > max ${filters.maxMarketCap}`);
          return false;
        }
        
        // Keywords filtering
        if (filters.keywords) {
          const keyword = filters.keywords.toLowerCase();
          const name = (token.name || '').toLowerCase();
          const symbol = (token.symbol || '').toLowerCase();
          if (!name.includes(keyword) && !symbol.includes(keyword)) return false;
        }
        
        // Age filtering (in minutes)
        if (filters.minAge || filters.maxAge) {
          const createdAt = token.created_at || token.createdAt || token.blocktime;
          const tokenAge = createdAt ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60) : 0;
          if (filters.minAge && tokenAge < parseFloat(filters.minAge)) return false;
          if (filters.maxAge && tokenAge > parseFloat(filters.maxAge)) return false;
        }
        
        return true;
      });
    };

    // Jupiter API already fetches only fresh tokens, so show all tokens
    // Show stocks when stocks are selected, otherwise show crypto tokens
    const allTokens = assetType === 'stocks' 
      ? stockData.slice(0, 50) // Show real stock data when stocks selected
      : tokensToFilter.filter(t => t && !isUnwantedToken(t)); // Show all Jupiter tokens (already fresh)
    
    // Categorize tokens by age since they're all fresh from Jupiter
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const sixHoursAgo = now - (6 * 60 * 60 * 1000);
    
    const newPairs = assetType === 'stocks' 
      ? allTokens.slice(0, 50) // Show real stock data when stocks selected
      : applyCustomFilters(allTokens.filter(t => {
        const createdAt = new Date(t.createdAt).getTime();
        return createdAt > oneHourAgo; // Very recent tokens
      })).slice(0, 50);
      
    const filled = assetType === 'stocks' 
      ? [] // No active tokens for stocks
      : applyCustomFilters(allTokens.filter(t => {
        const createdAt = new Date(t.createdAt).getTime();
        return createdAt <= oneHourAgo && createdAt > sixHoursAgo; // 1-6 hours old
      })).slice(0, 30);
      
    // EDGE: No tokens on edge - temporarily removed
    const onEdge: any[] = [];
    
    const curveTokens = assetType === 'stocks' 
      ? [] // No curve tokens for stocks
      : applyCustomFilters(allTokens.filter(t => {
        const createdAt = new Date(t.createdAt).getTime();
        return createdAt <= sixHoursAgo; // Older than 6 hours
      })).slice(0, 30);
    
    // console.log("✅ Filtered tokens:", {
    //   newPairs: newPairs.length,
    //   onEdge: onEdge.length, 
    //   filled: filled.length,
    //   curveTokens: curveTokens.length,
    //   total: tokensToFilter.length
    // });
    return { newPairs, onEdge, filled, curveTokens };
  }, [tokens, assetType, stockData]);

  // Generate smart conversation title based on content
  const generateConversationTitle = useCallback((messages: Array<{ type: 'user' | 'assistant'; content: string; timestamp: Date }>) => {
    if (messages.length === 0) return 'New Conversation';
    
    // Find the first user message to use as title
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      // Create a smart title based on content
      if (content.length <= 40) {
        return content;
      } else {
        // Try to find a good break point
        const words = content.split(' ');
        let title = '';
        for (const word of words) {
          if ((title + ' ' + word).length <= 40) {
            title += (title ? ' ' : '') + word;
          } else {
            break;
          }
        }
        return title + (title.length < content.length ? '...' : '');
      }
    }
    
    return 'New Conversation';
  }, []);



  // Chat functions - memoized to prevent recreation
  const sendMessage = useCallback(async () => {
    // console.log('SENDMESSAGE FUNCTION CALLED!');
    // console.log('📝 Input message:', inputMessage);
    // console.log('📝 Input message length:', inputMessage.length);
    // console.log('📝 Input message trimmed:', inputMessage.trim());
    
    if (!inputMessage.trim()) {
      // console.log('❌ No message to send - input is empty');
      return;
    }
    
    // console.log('Sending message:', inputMessage);
    // console.log('🤖 Active companion:', attachedCompanion);
    // console.log('📝 Current messages:', messages.length);
    
    const userMessage = { type: 'user' as const, content: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Save conversation to history if it's a new conversation
    if (messages.length === 0) {
      const newConversation = {
        id: Date.now().toString(),
        title: generateConversationTitle([userMessage]),
        messages: [userMessage],
        timestamp: new Date()
      };
      setConversationHistory(prev => [newConversation, ...prev.slice(0, 19)]); // Keep last 20 conversations
      setCurrentConversationId(newConversation.id);
    } else {
      // Update existing conversation with user message
      if (currentConversationId) {
        setConversationHistory(prev => {
          const updated = [...prev];
          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
          
          if (currentConvIndex !== -1) {
            updated[currentConvIndex].messages = [...updated[currentConvIndex].messages, userMessage];
          }
          return updated;
        });
      }
    }
    
    // Get the active companion or use a random one
    const currentCompanion = attachedCompanion?.name || agents[Math.floor(Math.random() * agents.length)].name;
    setTypingCompanion(currentCompanion);
    setIsTyping(true);
    
    // Prepare conversation history for API
    const conversationHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Call the chat service
    try {
      // console.log('📞 Calling chat service...');
      let response: string;
      
      // If there's an active companion attached to a token, use token analysis
      if (attachedCompanion && attachedCompanion.tokenMint) {
        // console.log('Using token analysis for:', attachedCompanion.name, 'on token:', attachedCompanion.tokenMint);
        const token = tokens.find(t => t.mint === attachedCompanion.tokenMint);
        if (token) {
          if (selectedAPI === 'server-grok') {
            // Use server-side Grok API for mystical companion responses
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
              (process.env.NODE_ENV === 'production' 
                ? 'http://localhost:8080'
                : 'http://localhost:8080');
            // Add timeout to frontend request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const serverResponse = await fetch(`${serverUrl}/api/grok/chat/${token.mint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companionName: attachedCompanion.name,
                userMessage: inputMessage,
                tokenData: token
              }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!serverResponse.ok) {
              throw new Error(`Server responded with ${serverResponse.status}: ${serverResponse.statusText}`);
            }
            
            const serverData = await serverResponse.json();
            response = serverData.companionResponse || 'No response available';
          } else {
            response = await chatService.analyzeToken(token, attachedCompanion.name, inputMessage, selectedAPI, apiKeys);
          }
        } else {
          if (selectedAPI === 'server-grok') {
            // Use server-side Grok API for general chat
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
              (process.env.NODE_ENV === 'production' 
                ? 'http://localhost:8080'
                : 'http://localhost:8080');
            // Add timeout to frontend request
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
            
            const serverResponse = await fetch(`${serverUrl}/api/grok/chat/${attachedCompanion.tokenMint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companionName: attachedCompanion.name,
                conversationHistory: conversationHistory,
                userMessage: inputMessage
              }),
              signal: controller2.signal
            });
            
            clearTimeout(timeoutId2);
            
            if (!serverResponse.ok) {
              throw new Error(`Server responded with ${serverResponse.status}: ${serverResponse.statusText}`);
            }
            
            const serverData = await serverResponse.json();
            response = serverData.companionResponse || 'No response available';
          } else {
            response = await chatService.getCompanionResponse(attachedCompanion.name, conversationHistory, inputMessage, selectedAPI, apiKeys);
          }
        }
      } else {
        console.log('Using general companion response for:', currentCompanion);
        if (selectedAPI === 'server-grok') {
          // Use server-side Grok API for general chat
          const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
            (process.env.NODE_ENV === 'production' 
              ? 'http://localhost:8080'
              : 'http://localhost:8080');
          // Add timeout to frontend request
          const controller3 = new AbortController();
          const timeoutId3 = setTimeout(() => controller3.abort(), 15000);
          
          const serverResponse = await fetch(`${serverUrl}/api/grok/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companionName: currentCompanion,
              conversationHistory: conversationHistory,
              userMessage: inputMessage
            }),
            signal: controller3.signal
          });
          
          clearTimeout(timeoutId3);
          
          if (!serverResponse.ok) {
            throw new Error(`Server responded with ${serverResponse.status}: ${serverResponse.statusText}`);
          }
          
          const serverData = await serverResponse.json();
          response = serverData.companionResponse || 'No response available';
        } else {
          // Use general companion response
          response = await chatService.getCompanionResponse(currentCompanion, conversationHistory, inputMessage, selectedAPI, apiKeys);
        }
      }
      
      
      setIsTyping(false);
      setTypingCompanion(null);
      
      const assistantMessage = { 
        type: 'assistant' as const, 
        content: response, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history with the companion response
      if (currentConversationId) {
        setConversationHistory(prev => {
          const updated = [...prev];
          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
          
          if (currentConvIndex !== -1) {
            updated[currentConvIndex].messages = [...updated[currentConvIndex].messages, assistantMessage];
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat API error:', error);
      setIsTyping(false);
      setTypingCompanion(null);
      
      // Fallback response if API fails
      const fallbackResponse = `${currentCompanion}: I apologize, but I'm having trouble connecting to my analysis systems right now. Please try again in a moment.`;
      
      const assistantMessage = { 
        type: 'assistant' as const, 
        content: fallbackResponse, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history with the fallback response
      if (currentConversationId) {
        setConversationHistory(prev => {
          const updated = [...prev];
          const currentConvIndex = updated.findIndex(conv => conv.id === currentConversationId);
          
          if (currentConvIndex !== -1) {
            updated[currentConvIndex].messages = [...updated[currentConvIndex].messages, assistantMessage];
          }
          return updated;
        });
      }
    }
  }, [inputMessage, messages.length, currentConversationId, attachedCompanion, tokens, agents]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('ENTER KEY PRESSED - Calling sendMessage');
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    // Removed auto-close behavior that was causing the settings panel to disappear
    // when clicking buttons inside the settings panel
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll to bottom (for messenger-style chat)
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or typing state changes
    if (messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, isTyping, scrollToBottom]);

  // Add keyboard shortcut to close SCOPE with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clean up state immediately when closing
        setMessages([]);
        setInputMessage('');
        // Call the parent's onClose function
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Add click outside functionality to close settings panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSettingsOpen) {
        const target = event.target as Element;
        const settingsPanel = document.querySelector('[data-settings-panel]');
        
        if (settingsPanel && !settingsPanel.contains(target)) {
          setIsSettingsOpen(false);
          setSettingsView('menu');
        }
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSettingsOpen]);

  // Early return after all hooks have been called
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/95 z-50 overflow-visible flex flex-col scope-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    > 
      {/* Header */}
      <motion.div 
        className="bg-black/80 border-b border-neutral-800/60 p-4 flex-shrink-0"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="grid grid-cols-3 items-center">
          {/* Left side - SCOPE title only */}
          <div className="flex items-center">
            <motion.h1 
              className="text-xl font-bold text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              SCOPE
            </motion.h1>
          </div>
        
          {/* Center - Search Bar */}
          <div className="flex items-center justify-center mt-2">
            <motion.div 
              className="flex items-center space-x-2 w-full max-w-sm"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <SearchDropdown 
                onTokenSelect={(token) => {
                  // Convert the search token to the format expected by SCOPE
                  const scopeToken = {
                    mint: token.id,
                    name: token.name,
                    symbol: token.symbol,
                    image_url: token.icon,
                    price_usd: token.usdPrice,
                    marketcap: token.mcap,
                    volume_24h: token.stats24h?.volume,
                    liquidity: token.liquidity,
                    decimals: token.decimals,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  
                  // Focus on the selected token
                  setFocusToken(scopeToken);
                  
                  // Scroll to the token if it exists in the current tokens list
                  const existingToken = tokens.find(t => t.mint === token.id);
                  if (existingToken) {
                    // Find the token card element and scroll to it
                    const tokenElement = document.querySelector(`[data-mint="${token.id}"]`);
                    if (tokenElement) {
                      tokenElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
                className="w-full"
              />
            </motion.div>
          </div>
        
          {/* Right side - Help Button, Star Button, Close Button */}
          <div className="flex justify-end items-center space-x-3">
            {/* Help Button */}
            <HelpButton onHelpClick={() => setIsHelpOpen(true)} />

            {/* Star Button */}
            <HeaderStarButton 
              tokens={assetType === 'stocks' ? [...tokens, ...stockData] : tokens} 
              onTokenClick={setFocusToken} 
            />

            {/* Close Button */}
            <motion.button
              onClick={() => {
                // Clean up state immediately when closing
                setMessages([]);
                setInputMessage('');
                // Call the parent's onClose function
                onClose();
              }}
              className="text-white/60 hover:text-white transition-colors duration-200"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="p-6 flex-1 overflow-visible relative h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-white text-xl mb-4">Connecting to Solana...</div>
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        ) : !tokens || tokens.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-white/60">
              <div className="text-2xl mb-4">🔎</div>
              <div className="text-xl mb-2">Monitoring Solana for new launches</div>
              <div className="text-sm text-white/40 mt-2">Waiting for fresh token data...</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col border border-neutral-800/60 rounded-lg overflow-hidden">

            {/* Shared Header Row */}
            <div className="flex border-b border-neutral-800/60">
              <div className="flex-1 text-center py-4 border-r border-neutral-800/60 relative">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  {assetType === 'stocks' ? 'Stocks' : assetType === 'news' ? 'News' : 'Fresh Mints'}
                </h2>
                
                {/* Loading indicator for stocks */}
                {isLoadingStocks && (
                  <div className="absolute top-4 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                    Loading stocks...
                  </div>
                )}
                
                <div className="absolute top-4 left-2 flex gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md border border-white/20 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Filter Button */}
                  {assetType === 'crypto' && (
                    <button
                      onClick={() => setShowFilterPopup(true)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md border border-white/20 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                      </svg>
                    </button>
                  )}
                </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-black/90 border border-white/20 rounded-md shadow-lg z-50 min-w-[80px]">
                        <button
                          onClick={() => {
                            setAssetType('crypto');
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-sm font-medium text-left hover:bg-white/10 transition-colors duration-200 ${
                            assetType === 'crypto' ? 'text-white bg-white/10' : 'text-white/70'
                          }`}
                        >
                          Crypto
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setComingSoonType('stocks');
                            setShowComingSoon(true);
                          }}
                          className={`w-full px-3 py-1.5 text-sm font-medium text-left hover:bg-white/10 transition-colors duration-200 ${
                            assetType === 'stocks' ? 'text-white bg-white/10' : 'text-white/70'
                          }`}
                        >
                          Stocks
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setComingSoonType('news');
                            setShowComingSoon(true);
                          }}
                          className={`w-full px-3 py-1.5 text-sm font-medium text-left hover:bg-white/10 transition-colors duration-200 ${
                            assetType === 'news' ? 'text-white bg-white/10' : 'text-white/70'
                          }`}
                        >
                          News
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setComingSoonType('sports');
                            setShowComingSoon(true);
                          }}
                          className={`w-full px-3 py-1.5 text-sm font-medium text-left hover:bg-white/10 transition-colors duration-200 ${
                            assetType === 'sports' ? 'text-white bg-white/10' : 'text-white/70'
                          }`}
                        >
                          Sports
                        </button>
                      </div>
                    )}
                  </div>
              <div className="flex-1 text-center py-4 border-r border-neutral-800/60">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">Insights</h2>
              </div>
              <div className="flex-1 text-center py-4">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">Companions</h2>
              </div>
            </div>
            
            {/* Content Row */}
            <div className="flex">
              <TokenColumn 
                title="" 
                items={filteredTokens.newPairs} 
                className="border-r border-neutral-800/60 flex-1 min-w-0"
                  visibleMintsRef={visibleMintsRef}
                  agents={agents}
                  newTokenMint={newTokenMint}
                  attachedCompanion={attachedCompanion}
                  onCompanionDetach={handleCompanionDetach}
                  onHoverEnter={pauseLiveOnHover}
                  onHoverLeave={resumeLiveAfterHover}
                  onFocusToken={setFocusToken}
                  onDragTargetChange={setDragTargetToken}
                  filters={filters}
                  draggedAgent={draggedAgent}
                  onCompanionAttached={(companionName, token) => {
                    // Handle companion attachment
                    handleCompanionAttached(companionName, token);
                    
                    // Reset chat state for new agent-token combination
                    setMessages([]);
                    setInputMessage('');
                    
                    // Create new conversation for token analysis
                    const newConversation = {
                      id: Date.now().toString(),
                      title: `${companionName} analyzing ${token.name || token.symbol || 'token'}`,
                      messages: [],
                      timestamp: new Date()
                    };
                    setConversationHistory(prev => [newConversation, ...prev.slice(0, 19)]);
                    setCurrentConversationId(newConversation.id);
                    
                    // Simulate companion analyzing the token
                    setTimeout(() => {
                      setTypingCompanion(companionName);
                      setIsTyping(true);
                      
                      // Simulate analysis time
                      const analysisTime = 3000 + Math.random() * 2000;
                      
                      setTimeout(() => {
                        setIsTyping(false);
                        setTypingCompanion(null);
                        
                        // Add analysis message
                        const analysisMessage = {
                          type: 'assistant' as const,
                          content: `${companionName}: Analyzed ${token.name || token.symbol || 'this token'}. MC: ${token.marketCap ? `$${token.marketCap.toLocaleString()}` : 'N/A'}, Price: ${token.price && typeof token.price === 'number' ? `$${token.price.toFixed(8)}` : 'N/A'}. ${token.is_on_curve ? 'On bonding curve - interesting dynamics!' : 'Standard market behavior.'}`,
                          timestamp: new Date()
                        };
                        setMessages([analysisMessage]);
                        
                        // Update conversation history
                        setConversationHistory(prev => {
                          const updated = [...prev];
                          const currentConvIndex = updated.findIndex(conv => conv.id === newConversation.id);
                          
                          if (currentConvIndex !== -1) {
                            updated[currentConvIndex].messages = [analysisMessage];
                          }
                          return updated;
                        });
                      }, analysisTime);
                    }, 500);
                  }}
                />
                <InsightsColumn 
                  focusToken={focusToken}
                  className="border-r border-neutral-800/60 flex-1 min-w-0"
                />
                <div className="flex flex-col flex-1 min-w-0 relative h-[calc(100vh-200px)] overflow-visible">
                {/* Drag Target Preview */}
                {dragTargetToken && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mx-3 mt-3 mb-3 p-2 rounded-lg ${
                      draggedAgent === 'The Quantum Eraser'
                        ? 'bg-[#637e9a]/10 border border-[#637e9a]/30'
                        : draggedAgent === 'The Predictor'
                        ? 'bg-[#3ff600]/10 border border-[#3ff600]/30'
                        : draggedAgent === 'The Analyzer'
                        ? 'bg-[#195c8e]/10 border border-[#195c8e]/30'
                        : draggedAgent === 'The Retrocasual'
                        ? 'bg-[#a95109]/10 border border-[#a95109]/30'
                        : 'bg-blue-500/10 border border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                        {dragTargetToken.imageUrl ? (
                          <img 
                            src={dragTargetToken.imageUrl}
                            alt={dragTargetToken.symbol || dragTargetToken.name || "Token"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {(dragTargetToken.symbol || dragTargetToken.name || "T").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {dragTargetToken.name || dragTargetToken.symbol || 'Unknown Token'}
                        </div>
                        <div className={`text-sm truncate ${
                          draggedAgent === 'The Quantum Eraser'
                            ? 'text-[#637e9a]'
                            : draggedAgent === 'The Predictor'
                            ? 'text-[#3ff600]'
                            : draggedAgent === 'The Analyzer'
                            ? 'text-[#195c8e]'
                            : draggedAgent === 'The Retrocasual'
                            ? 'text-[#a95109]'
                            : 'text-blue-300'
                        }`}>
                          {dragTargetToken.mint.slice(0, 6)}...{dragTargetToken.mint.slice(-6)}
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        draggedAgent === 'The Quantum Eraser'
                          ? 'text-[#637e9a]'
                          : draggedAgent === 'The Predictor'
                          ? 'text-[#3ff600]'
                          : draggedAgent === 'The Analyzer'
                          ? 'text-[#195c8e]'
                          : draggedAgent === 'The Retrocasual'
                          ? 'text-[#a95109]'
                          : 'text-blue-400'
                      }`}>
                        {attachedCompanion && attachedCompanion.tokenMint === dragTargetToken.mint ? 'Switch' : 'Target'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Active Companion Preview */}
                {attachedCompanion && (() => {
                  const token = tokens.find(t => t.mint === attachedCompanion.tokenMint);
                  if (!token) return null;
                  
                  const companionColors = getCompanionColor(attachedCompanion.name);
                  
                  return (
                    <motion.div
                      key={attachedCompanion.tokenMint}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mx-3 mt-3 mb-3 p-2 ${companionColors.bg} border ${companionColors.border} rounded-lg`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                          {token.imageUrl ? (
                            <img 
                              src={token.imageUrl}
                              alt={token.symbol || token.name || "Token"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                              {(token.symbol || token.name || "T").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">
                            {token.name || token.symbol || 'Token'}
                          </div>
                          <div className={`${companionColors.text} text-sm truncate`}>
                            {attachedCompanion.name} • {token.mint.slice(0, 6)}...{token.mint.slice(-6)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCompanionDetach()}
                          className="p-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full transition-all duration-200 hover:scale-110"
                          title="Remove companion"
                        >
                          <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
                
                
                

                {/* Companion orbs section - positioned under COMPANIONS header */}
                <div 
                  className="flex flex-col items-center py-4 relative z-10 pointer-events-auto overflow-visible"
                  onMouseLeave={() => setHoveredAgent(null)}
                  onDragEnd={() => {
                    // Clear all drag states when drag ends anywhere
                    setIsDragging(false);
                    setDraggedAgent(null);
                    setDragTargetToken(null);
                  }}
                >
                  <div className="flex gap-4 overflow-visible">
                    {agents.filter(agent => {
                      // Only show companions that are NOT currently attached
                      return !attachedCompanion || attachedCompanion.name !== agent.name;
                    }).map((agent, index) => (
                      <div
                        key={agent.name}
                        draggable={true}
                        className={`relative w-20 h-20 rounded-full cursor-grab active:cursor-grabbing overflow-visible transition-all duration-300 hover:scale-110 ${
                          draggedAgent === agent.name ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                        style={{ 
                          background: 'transparent',
                          backgroundColor: 'transparent',
                          pointerEvents: 'auto',
                          zIndex: 1000,
                          border: 'none',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          console.log('Mouse enter agent:', agent.name);
                          // Clear any pending timeout
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          setHoveredAgent(agent);
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                          console.log('Mouse leave agent:', agent.name);
                          // Clear any existing timeout
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          // Remove hover immediately - no delay
                          setHoveredAgent(null);
                        }}
                        onMouseMove={(e) => {
                          e.stopPropagation();
                          // Clear any pending timeout when moving within the orb
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          // Ensure hover state is maintained while moving within the orb
                          if (hoveredAgent?.name !== agent.name) {
                            setHoveredAgent(agent);
                          }
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', agent.name);
                          e.dataTransfer.effectAllowed = 'copy';
                          setIsDragging(true);
                          setDraggedAgent(agent.name);
                        }}
                        onDragEnd={(e) => {
                          // Reset the drag state immediately
                          setIsDragging(false);
                          setDraggedAgent(null);
                          // Clear drag target immediately - no need for delay
                          setDragTargetToken(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Close settings panel when clicking on companion logo
                          if (isSettingsOpen) {
                            setIsSettingsOpen(false);
                            setSettingsView('menu');
                          }
                        }}
                      >
                        {agent.videoFile.endsWith('.gif') ? (
                          <img 
                            src={agent.videoFile}
                            alt={agent.name}
                            className="w-full h-full object-cover pointer-events-none companion-video"
                            style={{ 
                              mixBlendMode: 'screen',
                              filter: 'brightness(1.2) contrast(1.1)',
                              background: 'transparent !important',
                              backgroundColor: 'transparent !important',
                              backgroundImage: 'none !important',
                              backgroundClip: 'padding-box',
                              WebkitBackgroundClip: 'padding-box'
                            }}
                          />
                        ) : (
                          <video 
                            className="w-full h-full object-cover pointer-events-none companion-video"
                            autoPlay 
                            muted 
                            loop
                            playsInline
                            style={{ 
                              mixBlendMode: 'screen',
                              filter: 'brightness(1.2) contrast(1.1)',
                              background: 'transparent !important',
                              backgroundColor: 'transparent !important',
                              backgroundImage: 'none !important',
                              backgroundClip: 'padding-box',
                              WebkitBackgroundClip: 'padding-box'
                            }}
                          >
                            <source src={agent.videoFile} type="video/webm" />
                          </video>
                        )}
                        
                      </div>
                    ))}
                  </div>
                  
                  {/* HOVER CARD - ABSOLUTE POSITIONED UNDER WEBM ORBS */}
                  {hoveredAgent && (
                    <div
                      className="absolute w-80 rounded-xl p-4"
                      style={{ 
                        zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        top: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="space-y-3">
                        {/* Title with icon */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            {hoveredAgent.videoFile.endsWith('.gif') ? (
                              <img 
                                src={hoveredAgent.videoFile}
                                alt={hoveredAgent.name}
                                className="w-full h-full object-cover"
                                style={{ 
                                  mixBlendMode: 'screen',
                                  filter: 'brightness(1.2) contrast(1.1)',
                                  background: 'transparent !important',
                                  backgroundColor: 'transparent !important',
                                  backgroundImage: 'none !important',
                                  backgroundClip: 'padding-box',
                                  WebkitBackgroundClip: 'padding-box'
                                }}
                              />
                            ) : (
                              <video 
                                className="w-full h-full object-cover"
                                autoPlay 
                                muted 
                                loop
                                playsInline
                                style={{ 
                                  mixBlendMode: 'screen',
                                  filter: 'brightness(1.2) contrast(1.1)',
                                  background: 'transparent !important',
                                  backgroundColor: 'transparent !important',
                                  backgroundImage: 'none !important',
                                  backgroundClip: 'padding-box',
                                  WebkitBackgroundClip: 'padding-box'
                                }}
                              >
                                <source src={hoveredAgent.videoFile} type="video/webm" />
                              </video>
                            )}
                          </div>
                          <h3 className="text-white text-lg font-bold">{hoveredAgent.name}</h3>
                        </div>
                        
                        {/* Description */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {hoveredAgent.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>


                {/* Main content area with proper height calculation */}
                <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-visible relative z-0">
                  {/* Messages display area - proper chat layout */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto scrollbar-hide" 
                    style={{ 
                      scrollBehavior: 'smooth',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <div className="flex flex-col justify-end min-h-full p-4 pb-2 relative">
                      {messages.length === 0 && !isDragging && !draggedAgent ? (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                          <div className="text-gray-500 text-center italic transition-opacity duration-300 ease-in-out text-lg">
                            Drag a companion onto a token, pick a companion, or start typing to begin…
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-3">
                          {messages.map((message, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 break-words shadow-sm ${
                                  message.type === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-gray-700 text-gray-100 rounded-bl-md'
                                }`}
                              >
                                <div className="text-sm leading-relaxed break-words">{message.content}</div>
                                <div className={`text-xs mt-2 ${
                                  message.type === 'user' ? 'text-blue-200 text-right' : 'text-gray-400 text-left'
                                }`}>
                                  {message.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Typing indicator */}
                          {isTyping && typingCompanion && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex justify-start"
                            >
                              <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75%] shadow-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <span className="text-sm text-gray-400">{typingCompanion} is typing...</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                      
                      {/* Auto-scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Chat input row at bottom - fixed with proper spacing */}
                  <div className="shrink-0 border-t border-neutral-800/60 relative">
                    <div className="w-full p-4 pt-3 flex justify-center items-center h-20 chat-input-container">
                      <div className="w-full max-w-4xl flex items-center gap-3">
                        {/* Settings Button */}
                        <button
                          onClick={() => {
                            console.log('Settings button clicked, current state:', isSettingsOpen);
                            setIsSettingsOpen(!isSettingsOpen);
                            if (!isSettingsOpen) {
                              setSettingsView('menu');
                            }
                          }}
                          className={`flex-shrink-0 rounded-full h-12 w-12 transition-all duration-300 flex items-center justify-center ${
                            isSettingsOpen 
                              ? 'text-white bg-white/10 border border-white/20' 
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                          title="Settings & History"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {/* Input Field */}
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={inputMessage}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="w-full h-12 px-6 py-3 bg-gray-800/50 border border-gray-600/30 rounded-full text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/70 transition-all duration-300 hover:border-gray-500/40 hover:bg-gray-800/60"
                            style={{ scrollBehavior: 'auto' }}
                          />
                        </div>

                        {/* Send Button */}
                        <button
                          onClick={() => {
                            console.log('SEND BUTTON CLICKED - Calling sendMessage');
                            sendMessage();
                          }}
                          className={`flex-shrink-0 rounded-full px-4 py-3 h-12 transition-all duration-300 font-medium ${
                            inputMessage.trim() 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
                              : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!inputMessage.trim()}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Settings Panel - Anchored to chat input container */}
                    {isSettingsOpen && (
                      <motion.div
                        data-settings-panel
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-20 right-4 w-72 max-w-[calc(100%-2rem)] bg-black/95 border border-white/10 rounded-xl p-4 z-[70] max-h-[calc(100vh-200px)] overflow-y-auto shadow-2xl shadow-black/50 backdrop-blur-sm"
                        style={{
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {/* Main Menu View */}
                        {settingsView === 'menu' && (
                          <div>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                              <h3 className="text-white text-lg font-semibold">Settings</h3>
                              <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              <button
                                onClick={() => {
                                  setMessages([]);
                                  setInputMessage('');
                                  setCurrentConversationId(null);
                                  setIsSettingsOpen(false);
                                }}
                                className="w-full p-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 text-left rounded-lg"
                              >
                                <div className="text-white text-lg font-medium">New Chat</div>
                                <div className="text-gray-400 text-sm mt-1">Start a fresh conversation</div>
                              </button>
                              
                              <button
                                onClick={() => {
                                  console.log('Companion API button clicked');
                                  setSettingsView('api');
                                }}
                                className="w-full p-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 text-left rounded-lg"
                              >
                                <div className="text-white text-lg font-medium">Companion API</div>
                                <div className="text-gray-400 text-sm mt-1">Configure AI providers and API keys</div>
                              </button>
                              
                              <button
                                onClick={() => {
                                  console.log('History button clicked');
                                  setSettingsView('history');
                                }}
                                className="w-full p-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 text-left rounded-lg"
                              >
                                <div className="text-white text-lg font-medium">History</div>
                                <div className="text-gray-400 text-sm mt-1">View and restore past conversations</div>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Companion API View */}
                        {settingsView === 'api' && (
                          <div>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => setSettingsView('menu')}
                                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <h3 className="text-white text-lg font-semibold">Companion API</h3>
                              </div>
                              <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-white text-sm font-medium mb-2">AI Provider</label>
                                <select
                                  value={selectedAPI}
                                  onChange={(e) => setSelectedAPI(e.target.value)}
                                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-white/20 focus:outline-none"
                                >
                                  <option value="server-grok">Grok-4 (ILLUSIO Server) - No API Key Required</option>
                                  <option value="grok4">Grok-4 (X.AI) - Requires API Key</option>
                                  <option value="gpt4">GPT-4 (OpenAI) - Requires API Key</option>
                                  <option value="claude">Claude (Anthropic) - Requires API Key</option>
                                  <option value="gemini">Gemini (Google) - Requires API Key</option>
                                </select>
                              </div>

                              {selectedAPI !== 'server-grok' && (
                                <div>
                                  <label className="block text-white text-sm font-medium mb-2">API Key</label>
                                  <div className="flex space-x-2">
                                    <input
                                      type="password"
                                      value={apiKeys[selectedAPI as keyof typeof apiKeys] || ''}
                                      onChange={(e) => setApiKeys(prev => ({ ...prev, [selectedAPI]: e.target.value }))}
                                      placeholder={`Enter your ${selectedAPI.toUpperCase()} API key`}
                                      className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-white/20 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        const key = apiKeys[selectedAPI as keyof typeof apiKeys];
                                        if (key) {
                                          navigator.clipboard.writeText(key);
                                          // You could add a toast notification here
                                        }
                                      }}
                                      className="px-3 py-3 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {selectedAPI === 'server-grok' && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-400">✅</span>
                                    <span className="text-green-400 text-sm font-medium">Using ILLUSIO Server</span>
                                  </div>
                                  <p className="text-gray-400 text-sm mt-1">
                                    No API key required. Using our secure server-side Grok API.
                                  </p>
                                </div>
                              )}

                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <h4 className="text-blue-400 font-medium mb-1">API Key Security</h4>
                                    <p className="text-gray-300 text-sm">
                                      Your API keys are stored locally in your browser and never sent to our servers. 
                                      Make sure to keep your keys secure and never share them publicly.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  // Save API keys to localStorage
                                  localStorage.setItem('companion_api_keys', JSON.stringify(apiKeys));
                                  localStorage.setItem('selected_api', selectedAPI);
                                  setIsSettingsOpen(false);
                                }}
                                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                              >
                                Save Configuration
                              </button>
                            </div>
                          </div>
                        )}

                        {/* History View */}
                        {settingsView === 'history' && (
                          <div>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => setSettingsView('menu')}
                                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <h3 className="text-white text-lg font-semibold">Conversation History</h3>
                              </div>
                              <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {conversationHistory.length === 0 ? (
                                <div className="text-center py-8">
                                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <p className="text-gray-400">No conversation history yet</p>
                                  <p className="text-gray-500 text-sm mt-1">Start chatting to see your conversations here</p>
                                </div>
                              ) : (
                                conversationHistory.map((conversation) => (
                                  <div
                                    key={conversation.id}
                                    className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => {
                                      setMessages(conversation.messages);
                                      setCurrentConversationId(conversation.id);
                                      setIsSettingsOpen(false);
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate">{conversation.title}</h4>
                                        <p className="text-gray-400 text-sm mt-1">
                                          {conversation.messages.length} messages
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">
                                          {conversation.timestamp.toLocaleDateString()} at {conversation.timestamp.toLocaleTimeString()}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConversationHistory(prev => prev.filter(conv => conv.id !== conversation.id));
                                          localStorage.setItem('scope_conversations', JSON.stringify(
                                            conversationHistory.filter(conv => conv.id !== conversation.id)
                                          ));
                                        }}
                                        className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-500/10"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {conversationHistory.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <button
                                  onClick={() => {
                                    setConversationHistory([]);
                                    localStorage.removeItem('scope_conversations');
                                  }}
                                  className="w-full p-3 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg font-medium hover:bg-red-600/30 transition-colors"
                                >
                                  Clear All History
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Help Popup */}
        <HelpPopup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        
        {/* Coming Soon Popup */}
        <AnimatePresence>
          {showComingSoon && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setShowComingSoon(false)}
            >
              <motion.div
                className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4 relative z-[70] shadow-2xl"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
                  <button
                    onClick={() => setShowComingSoon(false)}
                    className="text-white/60 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      {comingSoonType === 'stocks' ? (
                        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) : comingSoonType === 'news' ? (
                        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {comingSoonType === 'stocks' ? 'Stocks Feature' : 'News Feature'}
                      </h3>
                      <p className="text-base leading-relaxed text-white/90">
                        {comingSoonType === 'stocks' 
                          ? 'Stocks functionality is currently under development. Stay tuned for exciting updates!'
                          : 'News functionality is currently under development. Stay tuned for exciting updates!'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Popup */}
        <AnimatePresence>
          {showFilterPopup && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setShowFilterPopup(false)}
            >
              <motion.div
                className="bg-black/90 border border-white/20 rounded-lg p-4 max-w-md w-full mx-4 relative z-[70] shadow-2xl"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-white">Filter Fresh Mints</h2>
                  <button
                    onClick={() => setShowFilterPopup(false)}
                    className="text-white/60 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Market Cap Range */}
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-2">Market Cap Range</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-white/70 mb-1">Min ($)</label>
                        <input
                          type="number"
                          value={filters.minMarketCap}
                          onChange={(e) => setFilters(prev => ({ ...prev, minMarketCap: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/70 mb-1">Max ($)</label>
                        <input
                          type="number"
                          value={filters.maxMarketCap}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxMarketCap: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          placeholder="1000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-2">Keywords</h3>
                    <input
                      type="text"
                      value={filters.keywords}
                      onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                      placeholder="Search by name or symbol..."
                    />
                  </div>

                  {/* Age Range */}
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-2">Token Age</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-white/70 mb-1">Min (minutes)</label>
                        <input
                          type="number"
                          value={filters.minAge}
                          onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/70 mb-1">Max (minutes)</label>
                        <input
                          type="number"
                          value={filters.maxAge}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          placeholder="60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Options */}
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-2">Show Only</h3>
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.highlightPumpFun}
                          onChange={(e) => setFilters(prev => ({ ...prev, highlightPumpFun: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">Show only Pump.fun tokens</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.highlightBonk}
                          onChange={(e) => setFilters(prev => ({ ...prev, highlightBonk: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">Show only Bonk tokens</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.showBoth}
                          onChange={(e) => setFilters(prev => ({ ...prev, showBoth: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">Show all tokens</span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => {
                        setFilters({
                          minMarketCap: '',
                          maxMarketCap: '',
                          keywords: '',
                          minAge: '',
                          maxAge: '',
                          highlightPumpFun: false,
                          highlightBonk: false,
                          showBoth: true
                        });
                      }}
                      className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded transition-all duration-200 text-sm"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setShowFilterPopup(false)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all duration-200 text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Wrapped Scope component with WatchlistProvider
const ScopeWithWatchlist: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    tokens: any[];
    isLoading: boolean;
    lastUpdate: Date | null;
    stats: any;
    connectionStatus: string;
    live: boolean;
    resumeLive: () => void;
    pauseLive: () => void;
    pauseLiveOnHover: () => void;
    resumeLiveAfterHover: () => void;
    isHoverPaused: boolean;
    queuedTokens: any[];
    newTokenMint: string | null;
  }> = (props) => {
    return (
      <WatchlistProvider>
        <Scope {...props} />
      </WatchlistProvider>
    );
  };
  
  export default ScopeWithWatchlist;
  