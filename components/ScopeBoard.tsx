"use client";
import { useEffect, useState } from "react";
import CreationTimeDisplay from './CreationTimeDisplay';
import { useFirebaseWebSocket, TokenData } from '../hooks/useFirebaseWebSocket';

// TokenData type is now imported from useFirebaseWebSocket hook

export default function ScopeBoard() {
  const { 
    tokens, 
    connectionStatus, 
    loading, 
    reconnect 
  } = useFirebaseWebSocket();

  if (loading) return <div className="text-white p-6">Loading Scope...</div>;

  if (!Array.isArray(tokens)) {
    return (
      <div className="text-white p-6">
        <div className="text-red-400 mb-2">Error loading tokens</div>
        <button 
          onClick={reconnect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Since all Firebase tokens are "new", let's categorize them by market cap and age
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const sixHoursAgo = now - (6 * 60 * 60 * 1000);
  
  const newPairs = tokens.filter((t) => {
    const updatedAt = new Date(t.updatedAt).getTime();
    return updatedAt > oneHourAgo; // Very recent tokens
  });
  
  const finalStretch = tokens.filter((t) => {
    const updatedAt = new Date(t.updatedAt).getTime();
    return updatedAt <= oneHourAgo && updatedAt > sixHoursAgo; // 1-6 hours old
  });
  
  const migrated = tokens.filter((t) => {
    const updatedAt = new Date(t.updatedAt).getTime();
    return updatedAt <= sixHoursAgo; // Older than 6 hours
  });

  return (
    <div style={{ background: 'radial-gradient(circle at bottom center, rgba(0,0,0,0.9), rgba(0,0,0,0.7))' }}>
      {/* Connection Status Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  connectionStatus.isConnected 
                    ? 'bg-green-500 animate-pulse' 
                    : connectionStatus.isConnecting 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-white/80">
                {connectionStatus.isConnected 
                  ? 'Live' 
                  : connectionStatus.isConnecting 
                  ? 'Connecting...' 
                  : 'Disconnected'
                }
              </span>
            </div>
            {connectionStatus.lastUpdate && (
              <span className="text-xs text-white/60">
                Last update: {connectionStatus.lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="text-sm text-white/80">
            {tokens.length} tokens
          </div>
        </div>
        {connectionStatus.error && (
          <div className="mt-2 text-xs text-red-400">
            Error: {connectionStatus.error}
            <button 
              onClick={reconnect}
              className="ml-2 text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      
      {/* Token Grid */}
      <div className="grid grid-cols-3 gap-6 p-6 text-white">
        <TokenColumn title="Fresh Mints" tokens={newPairs} />
        <TokenColumn title="Active Tokens" tokens={finalStretch} />
        <TokenColumn title="Established" tokens={migrated} />
      </div>
    </div>
  );
}

function TokenColumn({ title, tokens }: { title: string; tokens: TokenData[] }) {
  return (
    <div className="bg-black/40 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="text-sm text-white/60 bg-white/10 px-2 py-1 rounded">
          {tokens.length}
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {tokens.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            No tokens in this category
          </div>
        ) : (
          tokens.map((t, index) => (
            <div
              key={t.id}
              className={`p-3 rounded bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-glow ${
                index === 0 ? 'ring-2 ring-green-400/50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{t.name} ({t.symbol})</span>
                    {index === 0 && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {t.id.slice(0,8)}…{t.id.slice(-6)}
                  </div>
                </div>
                {t.icon && (
                  <img 
                    src={t.icon} 
                    alt={t.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              
              <div className="mt-2 space-y-1">
                <div className="text-sm opacity-80">
                  <span className="text-green-400">MC:</span> ${t.mcap ? t.mcap.toLocaleString() : 'N/A'}
                </div>
                <div className="text-sm opacity-80">
                  <span className="text-blue-400">Liquidity:</span> ${t.liquidity ? t.liquidity.toLocaleString() : 'N/A'}
                </div>
                <div className="text-sm opacity-80">
                  <span className="text-purple-400">Vol 24h:</span> ${t.volume24h ? t.volume24h.toLocaleString() : 'N/A'}
                </div>
                {t.usdPrice && t.usdPrice > 0 && (
                  <div className="text-sm opacity-80">
                    <span className="text-yellow-400">Price:</span> ${t.usdPrice.toFixed(6)}
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <CreationTimeDisplay createdAt={t.updatedAt} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
