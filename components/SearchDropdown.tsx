'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

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

interface SearchDropdownProps {
  onTokenSelect: (token: SearchToken) => void;
  className?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ onTokenSelect, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const searchTokens = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get('https://lite-api.jup.ag/tokens/v2/search', {
        params: { query: searchQuery },
        headers: { 'Accept': 'application/json' }
      });
      
      setResults(response.data || []);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTokens(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleTokenSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleTokenSelect = (token: SearchToken) => {
    onTokenSelect(token);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search tokens by symbol, name, or mint address..."
          className="w-full px-3 pr-10 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all duration-200 text-sm"
        />
        
        {/* Search Icon or Loading Spinner */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-400 border-t-transparent"></div>
          ) : (
            <svg 
              className="w-4 h-4 text-white/50" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-white/50 text-center">
              {isLoading ? 'Searching...' : 'No tokens found'}
            </div>
          ) : (
            <div className="py-2">
              {results.map((token, index) => (
                <div
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    index === selectedIndex
                      ? 'bg-teal-400/20 border-l-2 border-teal-400'
                      : 'hover:bg-white/5'
                  }`}
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
                        <span className="text-xs font-bold text-white/60">
                          {token.symbol.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{token.symbol}</span>
                        <span className="text-white/60 text-sm truncate">{token.name}</span>
                        {token.isVerified && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50 font-mono mt-1">
                        {token.id.slice(0, 8)}...{token.id.slice(-8)}
                      </div>
                    </div>

                    {/* Token Metrics */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-white">
                        {formatNumber(token.usdPrice)}
                      </div>
                      <div className="text-xs text-white/60">
                        MC: {formatNumber(token.mcap)}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                    {token.liquidity && (
                      <span>LP: {formatNumber(token.liquidity)}</span>
                    )}
                    {token.holderCount && (
                      <span>Holders: {token.holderCount.toLocaleString()}</span>
                    )}
                    {token.organicScoreLabel && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        token.organicScoreLabel === 'high' ? 'bg-green-500/20 text-green-400' :
                        token.organicScoreLabel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {token.organicScoreLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
