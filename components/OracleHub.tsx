"use client";
import React, { useEffect, useState } from "react";
import { useFirebaseWebSocket } from "@/hooks/useFirebaseWebSocket";
import { getDatabase, ref, onValue, DataSnapshot } from 'firebase/database';
import { app } from '../lib/firebase';
import { OracleMessage } from '../hooks/useOracleChat';
import OracleChat from "@/components/OracleChat";

interface OracleHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArchiveEntry {
  id: string;
  date: string;
  time: string;
  messageCount: number;
  messages: OracleMessage[];
  asciiBanner?: string;
  conclusion?: string;
}

export default function OracleHub({ isOpen, onClose }: OracleHubProps) {
  const [animateIn, setAnimateIn] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<ArchiveEntry | null>(null);

  // Firebase connection for real-time token data
  const {
    tokens,
    connectionStatus,
    loading: firebaseLoading,
    reconnect: reconnectFirebase
  } = useFirebaseWebSocket();

  // Load archives from localStorage on mount
  useEffect(() => {
    try {
      const savedArchives = localStorage.getItem('oracle-archives');
      if (savedArchives) {
        try {
          const parsedArchives = JSON.parse(savedArchives);
          setArchives(parsedArchives);
        } catch (error) {
          console.error('Error parsing archives:', error);
        }
      }
    } catch (storageError) {
      console.warn('Could not access localStorage for archives:', storageError);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the component is rendered before animating
      const id = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(id);
    } else if (isVisible) {
      // Only animate out if we were previously visible
      setAnimateIn(false);
      // Delay hiding the component until animation completes
      const timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 700); // Match the animation duration
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isVisible]);

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

  // Archive functions
  const toggleArchiveMode = () => {
    setIsArchiveMode(!isArchiveMode);
    setSearchQuery('');
  };

  // Fetch all messages from Firebase and create archive
  const createArchiveFromAllMessages = async () => {
    try {
      const db = getDatabase(app);
      const messagesRef = ref(db, 'oracle-messages');
      
      // Fetch all messages without limit
      const snapshot = await new Promise<DataSnapshot>((resolve, reject) => {
        onValue(messagesRef, (snapshot) => {
          resolve(snapshot);
        }, (error) => {
          reject(error);
        }, { onlyOnce: true });
      });

      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const allMessages = Object.values(messagesData) as OracleMessage[];
        
        // Sort by timestamp
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Create archive entry
        const archiveId = `archive-${Date.now()}`;
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();
        
        const newArchive: ArchiveEntry = {
          id: archiveId,
          date,
          time,
          messageCount: allMessages.length,
          messages: allMessages,
          asciiBanner: generateAsciiBanner(allMessages),
          conclusion: generateConclusion(allMessages)
        };
        
        // Save to archives
        const updatedArchives = [...archives, newArchive];
        setArchives(updatedArchives);
        localStorage.setItem('oracle-archives', JSON.stringify(updatedArchives));
        
        console.log(`📦 Created archive with ${allMessages.length} messages`);
        return newArchive;
      } else {
        console.log('No messages found to archive');
        return null;
      }
    } catch (error) {
      console.error('Error creating archive:', error);
      throw error;
    }
  };

  // Generate ASCII banner from messages
  const generateAsciiBanner = (messages: OracleMessage[]) => {
    const agentCounts = messages.reduce((acc, msg) => {
      acc[msg.agent] = (acc[msg.agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return `
    ╔══════════════════════════════════════╗
    ║           ORACLE ARCHIVE             ║
    ║     ${messages.length} messages • ${Object.keys(agentCounts).length} agents    ║
    ╚══════════════════════════════════════╝`;
  };

  // Generate conclusion from messages
  const generateConclusion = (messages: OracleMessage[]) => {
    const recentMessages = messages.slice(-10);
    const topics = recentMessages.map(msg => msg.message.substring(0, 50)).join(' | ');
    return `Recent topics: ${topics}...`;
  };

  const getFilteredArchives = () => {
    if (!searchQuery) return archives;
    
    return archives.filter(archive => 
      archive.asciiBanner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      archive.conclusion?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Oracle Hub - STRICTLY constrained to right half only */}
      <div 
        className={`oracle-hub fixed right-0 top-0 h-full w-1/2 bg-black border-l border-white/20 z-[60] transition-all duration-700 ease-in-out flex flex-col overflow-hidden ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          backgroundColor: '#000000', // Fully opaque solid black base
          maxWidth: '50vw', // Ensure it never exceeds 50% viewport width
          boxSizing: 'border-box', // Ensure padding/borders don't extend beyond bounds
        }}
      >
        <button
          onClick={onClose}
          className="hub-close-button absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200 z-50 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="p-8 border-b border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
            Oracle
          </h1>
          <p className="text-white/80 text-lg leading-relaxed" style={{ fontFamily: 'VT323, monospace' }}>
            Retrocausality made conversational. AI agents debate trades as if tomorrow already happened, weaving time-bent insights into a market outlook.
          </p>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="space-y-4 h-full flex flex-col">
            {/* AI Agents Section */}
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                Companions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Analyzer
                  </h3>
                  <p className="text-white/70 text-sm leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Analyzes wallet movements and trading patterns.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Predictor
                  </h3>
                  <p className="text-white/70 text-sm leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Projects future price movements and trends.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Quantum Eraser
                  </h3>
                  <p className="text-white/70 text-sm leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Removes noise to reveal quantum signals.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Retrocausal
                  </h3>
                  <p className="text-white/70 text-sm leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Reasons backwards from future outcomes.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Firebase Token Data Section */}
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                Live Token Data
              </h2>
              <div className="bg-white/5 border border-white/20 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80" style={{ fontFamily: 'VT323, monospace' }}>
                    Connection Status:
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    connectionStatus.isConnected 
                      ? 'text-green-400 bg-green-400/20' 
                      : 'text-red-400 bg-red-400/20'
                  }`} style={{ fontFamily: 'VT323, monospace' }}>
                    {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-white/80 mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                  Tokens: {tokens.length} | Loading: {firebaseLoading ? 'Yes' : 'No'}
                </div>
                {tokens.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {tokens.slice(0, 5).map((token, index) => (
                        <div key={token.id} className="text-sm text-white/70 bg-black/30 p-2 rounded" style={{ fontFamily: 'VT323, monospace' }}>
                          <div className="flex justify-between">
                            <span className="truncate max-w-[120px]">{token.symbol || 'Unknown'}</span>
                            <span className="text-green-400">
                              ${token.usdPrice ? token.usdPrice.toFixed(6) : 'N/A'}
                            </span>
                          </div>
                          <div className="text-white/50 truncate max-w-[200px]">
                            {token.id.slice(0, 8)}...{token.id.slice(-6)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {tokens.length > 5 && (
                      <div className="text-sm text-white/50 text-center mt-1" style={{ fontFamily: 'VT323, monospace' }}>
                        +{tokens.length - 5} more tokens...
                      </div>
                    )}
                  </div>
                )}
                {!connectionStatus.isConnected && (
                  <button
                    onClick={reconnectFirebase}
                    className="mt-2 px-3 py-1 bg-white/10 border border-white/20 rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors duration-200 text-sm"
                    style={{ fontFamily: 'VT323, monospace' }}
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
            
            {/* Live Chat or Archive */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'VT323, monospace' }}>
                  {isArchiveMode ? 'Archive' : 'Live Chat'}
                </h2>
              </div>

              {/* Search bar - only show in archive mode */}
              {isArchiveMode && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search archives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    style={{ fontFamily: 'VT323, monospace' }}
                  />
                </div>
              )}

              {/* Archive info - only show in archive mode */}
              {isArchiveMode && (
                <div className="mb-2 text-white/60 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                  {archives.length > 0 ? (
                    <>
                      {getFilteredArchives().length} archive{getFilteredArchives().length !== 1 ? 's' : ''} found
                      {searchQuery && ` for "${searchQuery}"`}
                    </>
                  ) : (
                    'No archives yet'
                  )}
                </div>
              )}
              
              {/* Chat or Archive Content */}
              {isArchiveMode ? (
                <div className="bg-black/50 border border-white/20 rounded p-2 overflow-y-auto flex-1">
                    <div className="space-y-2">
                      {getFilteredArchives().map((archive) => (
                        <div 
                          key={archive.id} 
                          className="p-3 bg-black/30 border border-white/10 rounded cursor-pointer hover:bg-black/50 transition-colors"
                          onClick={() => {
                            setSelectedArchive(archive);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                              Archive #{archive.id.split('-')[1].slice(-6)}
                            </h3>
                            <span className="text-white/60 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                              {archive.date} • {archive.time}
                            </span>
                          </div>
                          
                          {/* ASCII Banner Preview - smaller */}
                          {archive.asciiBanner && (
                            <div className="mb-2 p-1 bg-black/50 rounded">
                              <pre className="text-green-400 text-sm leading-tight whitespace-pre-wrap" style={{ fontFamily: 'VT323, monospace' }}>
                                {archive.asciiBanner.split('\n').slice(0, 2).join('\n')}...
                              </pre>
                            </div>
                          )}
                          
                          <div className="text-white/80 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                            {archive.messageCount} messages • Click to view
                          </div>
                        </div>
                      ))}
                      
                      {getFilteredArchives().length === 0 && (
                        <div className="text-white/60 text-center py-8" style={{ fontFamily: 'VT323, monospace' }}>
                          No archives found
                        </div>
                      )}
                    </div>
                </div>
              ) : (
                <div className="bg-black/50 border border-white/20 rounded p-2 overflow-hidden flex-1">
                  <OracleChat className="h-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
