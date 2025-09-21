"use client";
import React, { useEffect, useRef, useState } from "react";
import { useOracleChat, OracleMessage } from "@/hooks/useOracleChat";

interface OracleChatProps {
  className?: string;
}

export default function OracleChat({ className = "" }: OracleChatProps) {
  const { messages, loading, error, isConnected } = useOracleChat(100);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll, isUserScrolling]);

  // Detect user scrolling
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    setShouldAutoScroll(isAtBottom);
    
    if (!isAtBottom) {
      setIsUserScrolling(true);
      // Reset user scrolling flag after 2 seconds of no scrolling
      setTimeout(() => setIsUserScrolling(false), 2000);
    }
  };

  // Helper functions for agent styling
  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'analyzer':
        return '#4ECDC4'; // Teal
      case 'predictor':
        return '#45B7D1'; // Blue
      case 'quantum-eraser':
        return '#96CEB4'; // Green
      case 'retrocausal':
        return '#FF6B6B'; // Red
      case 'system':
        return '#6C757D'; // Gray
      default:
        return '#6C757D'; // Gray
    }
  };

  const getAgentInfo = (agent: string) => {
    switch (agent) {
      case 'analyzer':
        return { 
          name: 'The Analyzer', 
          gif: '/WIZZARD/The Analyzer.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'predictor':
        return { 
          name: 'The Predictor', 
          gif: '/WIZZARD/The Predictor.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'quantum-eraser':
        return { 
          name: 'The Quantum Eraser', 
          gif: '/WIZZARD/The Quantum Eraser.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'retrocausal':
        return { 
          name: 'The Retrocausal', 
          gif: '/WIZZARD/The Retrocasual.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'system':
        return { 
          name: 'System', 
          gif: '',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      default:
        return { 
          name: 'Unknown', 
          gif: '',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '00:00';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-white/60 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
          Loading Oracle messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-red-400 text-sm text-center" style={{ fontFamily: 'VT323, monospace' }}>
          <div className="mb-2">Failed to load messages</div>
          <div className="text-white/60">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Connection Status */}
      <div className="flex-shrink-0 mb-2">
        <div className="flex items-center justify-between text-xs" style={{ fontFamily: 'VT323, monospace' }}>
          <span className="text-white/60">
            Oracle Chat • {messages.length} messages
          </span>
          <span className={`px-2 py-1 rounded ${
            isConnected 
              ? 'text-green-400 bg-green-400/20' 
              : 'text-red-400 bg-red-400/20'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 pr-2"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-center" style={{ fontFamily: 'VT323, monospace' }}>
              <div className="mb-2">No messages yet</div>
              <div className="text-sm">Waiting for Oracle agents to speak...</div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const agentInfo = getAgentInfo(message.agent);
            
            return (
              <div key={message.id} className="flex items-end space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-transparent">
                  {agentInfo.gif ? (
                    <img 
                      key={`${message.agent}-${message.id}`}
                      src={agentInfo.gif}
                      alt={agentInfo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      style={{ 
                        mixBlendMode: 'screen',
                        filter: 'brightness(1.2) contrast(1.1)',
                        background: 'transparent !important',
                        backgroundColor: 'transparent !important',
                        backgroundImage: 'none !important',
                        backgroundClip: 'padding-box',
                        WebkitBackgroundClip: 'padding-box',
                        maxWidth: '48px',
                        maxHeight: '48px',
                        imageRendering: 'auto'
                      }}
                      onError={(e) => {
                        // Fallback to colored circle if GIF fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center" style="background-color: ${getAgentColor(message.agent)}"><span class="text-white text-sm font-bold">${agentInfo.name.charAt(0)}</span></div>`;
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{ backgroundColor: getAgentColor(message.agent) }}
                    >
                      <span className="text-white text-sm font-bold">
                        {agentInfo.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className="flex flex-col max-w-[80%]">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                      {agentInfo.name}
                    </h4>
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'VT323, monospace' }}>
                      {formatTime(message.timestamp)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      message.type === 'analysis' ? 'bg-teal-500/20 text-teal-400' :
                      message.type === 'prediction' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`} style={{ fontFamily: 'VT323, monospace' }}>
                      {message.type}
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                    <p className="text-white/90 text-sm leading-relaxed" style={{ fontFamily: 'VT323, monospace' }}>
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
