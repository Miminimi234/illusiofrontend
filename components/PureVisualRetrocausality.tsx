'use client';

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useBirdeyeTrades } from '@/hooks/useBirdeyeTrades';

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

interface PhotonPair {
  id: string;
  transaction: Transaction;
  signal: Photon;
  idler: Photon;
  createdAt: number;
}

interface Photon {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  size: number;
  speed: number;
  trail: Array<{ x: number; y: number; opacity: number; timestamp: number }>;
  path: string[];
  currentPathIndex: number;
  isSignal: boolean;
  slippage: number;
}

interface DetectorHit {
  detectorId: string;
  timestamp: number;
  intensity: number;
  type: 'which-path' | 'erased';
}

interface InterferencePattern {
  type: 'stripes' | 'rings';
  intensity: number;
  timestamp: number;
  phase: number;
}

interface RetrocausalArc {
  id: string;
  fromDetector: string;
  progress: number;
  opacity: number;
  timestamp: number;
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

interface JupiterData {
  marketCap: number;
  price: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  priceChangePercent24h: number;
}

interface PureVisualRetrocausalityProps {
  onNodeHover?: (nodeId: string | null) => void;
  predictionData?: {
    confidence: number;
    expectedRange: { min: number; max: number };
    upProbability: number;
    downProbability: number;
    momentum?: {
      priceMomentum: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
      volumeMomentum: 'Accelerating' | 'Stable' | 'Declining';
      acceleration: 'Rapid' | 'Moderate' | 'Slow' | 'Stagnant';
      heatingCooling: 'Hot' | 'Warm' | 'Cool' | 'Cold';
    };
    signals?: string[];
    riskLevel?: 'Low' | 'Medium' | 'High' | 'Extreme';
    timeHorizon?: 'Short' | 'Medium' | 'Long';
  };
  selectedToken?: SearchToken | null;
  isSearching?: boolean;
}

export interface PureVisualRetrocausalityRef {
  zoomIn: () => void;
  zoomOut: () => void;
}

const PureVisualRetrocausality = forwardRef<PureVisualRetrocausalityRef, PureVisualRetrocausalityProps>(({ 
  onNodeHover, 
  predictionData = {
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
  },
  selectedToken = null,
  isSearching = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const photonPairsRef = useRef<PhotonPair[]>([]);
  const detectorHitsRef = useRef<DetectorHit[]>([]);
  const interferencePatternRef = useRef<InterferencePattern | null>(null);
  const retrocausalArcsRef = useRef<RetrocausalArc[]>([]);
  const lastTradeTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const engineBreathRef = useRef<number>(0);
  const currentStateRef = useRef<string>('');
  const tradesContainerRef = useRef<HTMLDivElement>(null);
  
  // Zoom and pan state
  const zoomRef = useRef<number>(1);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Jupiter data for animation
  const [jupiterData, setJupiterData] = useState<JupiterData | null>(null);
  const [jupiterLoading, setJupiterLoading] = useState(false);

  
  // Legend state
  const [showLegend, setShowLegend] = useState(false);
  
  // Live trades hook
  const { trades, loading: tradesLoading, error: tradesError } = useBirdeyeTrades({
    tokenMint: selectedToken?.id || '',
    limit: 20,
    pollInterval: 6000
  });

  // Debug logging for live trades
  useEffect(() => {
    console.log("🔍 PureVisualRetrocausality - Live trades state:", {
      selectedToken: selectedToken?.symbol || 'none',
      tokenMint: selectedToken?.id || 'none',
      selectedTokenObject: selectedToken,
      tradesCount: trades.length,
      loading: tradesLoading,
      error: tradesError
    });
  }, [selectedToken, trades.length, tradesLoading, tradesError]);

  // Auto-scroll to bottom when new trades arrive (newest trades at bottom)
  useEffect(() => {
    if (trades.length > 0 && tradesContainerRef.current) {
      const container = tradesContainerRef.current;
      console.log("🔍 Trades container debug:", {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        tradesCount: trades.length,
        needsScroll: container.scrollHeight > container.clientHeight
      });
      container.scrollTop = container.scrollHeight;
    }
  }, [trades]);

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
          
          setJupiterData({
            marketCap,
            price: tokenData.usdPrice || 0,
            volume24h: tokenData.volume24h || 0,
            liquidity: tokenData.liquidity || 0,
            priceChange24h: tokenData.priceChange24h || 0,
            priceChangePercent24h: tokenData.priceChangePercent24h || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Jupiter data:', error);
    } finally {
      setJupiterLoading(false);
    }
  }, []);


  // Fetch Jupiter data when token is selected
  useEffect(() => {
    if (selectedToken?.id) {
      fetchJupiterData(selectedToken.id);
    } else {
      setJupiterData(null);
      // Clear everything when no token selected
      photonPairsRef.current = [];
    }
  }, [selectedToken?.id, fetchJupiterData]);

  // Update prediction data based on Jupiter data
  useEffect(() => {
    if (jupiterData && selectedToken) {
      // Calculate prediction confidence based on market cap and volume
      const marketCapConfidence = Math.min(0.95, Math.max(0.3, Math.log10(jupiterData.marketCap) / 10));
      const volumeConfidence = Math.min(0.8, Math.max(0.2, Math.log10(jupiterData.volume24h + 1) / 8));
      const confidence = (marketCapConfidence + volumeConfidence) / 2;
      
      // Calculate expected range based on price volatility
      const volatility = Math.abs(jupiterData.priceChangePercent24h) / 100;
      const expectedRange = {
        min: jupiterData.price * (1 - volatility * 0.5),
        max: jupiterData.price * (1 + volatility * 0.5)
      };
      
      // Calculate probabilities based on price change
      const upProbability = jupiterData.priceChangePercent24h >= 0 ? 
        Math.min(0.9, 0.5 + (jupiterData.priceChangePercent24h / 100) * 2) : 
        Math.max(0.1, 0.5 + (jupiterData.priceChangePercent24h / 100) * 2);
      const downProbability = 1 - upProbability;
      
      // Update prediction data (this would need to be passed up to parent component)
      // For now, we'll store it locally for visualization
      console.log('Updated prediction data:', {
        confidence,
        expectedRange,
        upProbability,
        downProbability
      });
    }
  }, [jupiterData, selectedToken]);

  // Precision scientific instrument layout - centered with zoom/pan
  const getCenteredNodes = useCallback((canvasWidth: number, canvasHeight: number) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    return {
      LASER: { x: centerX - 300, y: centerY, type: 'laser', depth: 1 },
      BBO: { x: centerX - 150, y: centerY, type: 'bbo', depth: 2 },
      BSa: { x: centerX - 50, y: centerY - 100, type: 'splitter', depth: 2 },
      BSb: { x: centerX - 50, y: centerY, type: 'splitter', depth: 2 },
      BSc: { x: centerX + 100, y: centerY - 50, type: 'splitter', depth: 2 },
      BSd: { x: centerX + 100, y: centerY + 50, type: 'splitter', depth: 2 },
      D0: { x: centerX + 250, y: centerY, type: 'detector', depth: 3 },
      D1: { x: centerX - 100, y: centerY - 180, type: 'detector', depth: 1 },
      D2: { x: centerX + 50, y: centerY - 180, type: 'detector', depth: 1 },
      D3: { x: centerX - 100, y: centerY + 180, type: 'detector', depth: 1 },
      D4: { x: centerX + 50, y: centerY + 180, type: 'detector', depth: 1 },
      PREDICTION_ENGINE: { x: centerX + 400, y: centerY, type: 'engine', depth: 3 }
    };
  }, []);

  // Path definitions with weights - extended paths through the quantum circuit
  const paths = {
    signal: ['BBO', 'BSb', 'D0'], // Signal goes through BSb to D0
    idler: {
      whichPath: ['BBO', 'BSa', 'BSb', 'BSc', 'D2'], // Which-path: goes through multiple beam splitters
      erased: ['BBO', 'BSa', 'BSb', 'BSd', 'D4'] // Erased: different path through BSd
    }
  };

  // Color palette - desaturated, scientific
  const colors = {
    background: '#000000',
    rails: '#141925',
    text: '#E9EEF5',
    buy: '#8EEA5A',
    sell: '#FF6A5A',
    neutral: '#5AD7E1',
    splitter: '#7C84D8',
    detector: '#FFFFFF'
  };

  // Create photon pair from real transaction
  const createPhotonPair = useCallback((transaction: Transaction, canvasWidth: number, canvasHeight: number): PhotonPair => {
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
    const bboPos = nodes.BBO;
    const d0Pos = nodes.D0;
    
    // Use transaction data to determine path and properties
    let isErased: boolean;
    let size: number;
    let speed: number;
    let slippage: number;
    
    if (transaction.type === 'MARKET_CAP') {
      // Jupiter market cap data - use market cap size for photon properties
      const marketCapSize = Math.log10(transaction.amount || 1);
      isErased = marketCapSize > 8; // Large market caps more likely to be erased
      size = Math.max(3, Math.min(10, marketCapSize / 2));
      speed = Math.max(0.8, Math.min(2.0, 1.0 + (marketCapSize - 6) / 4)); // Faster speeds for longer paths
      slippage = Math.min(0.5, (transaction.amount || 0) / 1000000000); // Higher market cap = less slippage
    } else if (transaction.type === 'TRADE') {
      // Birdeye trade data - use trade volume and side for properties
      const tradeVolume = Math.log10(transaction.amount || 1);
      const priceImpact = Math.abs(transaction.price || 0);
      
      // Sell trades create more retrocausal effects (path erasure)
      isErased = transaction.side === 'SELL' || Math.random() < 0.4;
      
      // Size based on trade volume
      size = Math.max(2, Math.min(8, tradeVolume / 3));
      
      // Speed based on trade urgency (recent trades move faster)
      const tradeAge = Date.now() - transaction.timestamp;
      const urgency = Math.max(0, 1 - tradeAge / 60000); // Fade over 1 minute
      speed = Math.max(0.8, Math.min(2.0, 1.0 + urgency * 1.0)); // Faster speeds
      
      // Slippage based on trade size and price impact
      slippage = Math.min(0.4, (transaction.amount || 0) / 1000000 + priceImpact / 100);
    } else if (transaction.type === 'HIGH_VOLUME_TRADE') {
      // High volume trades - create more dramatic effects
      const tradeVolume = Math.log10(transaction.amount || 1);
      const priceImpact = Math.abs(transaction.price || 0);
      
      // High volume trades have different retrocausal properties
      isErased = transaction.side === 'SELL' ? Math.random() < 0.7 : Math.random() < 0.3;
      
      // Larger size for high volume trades
      size = Math.max(4, Math.min(12, tradeVolume / 2));
      
      // Faster speed for high volume trades
      const tradeAge = Date.now() - transaction.timestamp;
      const urgency = Math.max(0, 1 - tradeAge / 30000); // Fade over 30 seconds
      speed = Math.max(1.0, Math.min(2.5, 1.5 + urgency * 1.0)); // Even faster for high volume
      
      // Lower slippage for high volume trades
      slippage = Math.min(0.2, (transaction.amount || 0) / 10000000 + priceImpact / 200);
    } else {
      // Default behavior for other transaction types
      isErased = Math.random() < 0.6;
      size = Math.max(2, Math.min(8, Math.log(transaction.amount) / 2.5));
      speed = Math.max(0.8, Math.min(2.0, 1.0)); // Consistent faster speed
      slippage = Math.random() * 0.3;
    }
    
    const idlerPath = isErased ? paths.idler.erased : paths.idler.whichPath;
    const idlerEndNode = nodes[idlerPath[idlerPath.length - 1] as keyof typeof nodes];
    
    // Signal photon (direct to D0)
    const signal: Photon = {
      id: `${transaction.signature}_signal`,
      x: bboPos.x,
      y: bboPos.y,
      targetX: d0Pos.x,
      targetY: d0Pos.y,
      progress: 0,
      size,
      speed,
      trail: [],
      path: paths.signal,
      currentPathIndex: 0,
      isSignal: true,
      slippage
    };
    
    // Idler photon (through splitter network)
    const idler: Photon = {
      id: `${transaction.signature}_idler`,
      x: bboPos.x,
      y: bboPos.y,
      targetX: idlerEndNode.x,
      targetY: idlerEndNode.y,
      progress: 0,
      size,
      speed,
      trail: [],
      path: idlerPath,
      currentPathIndex: 0,
      isSignal: false,
      slippage
    };
    
    return {
      id: transaction.signature,
      transaction,
      signal,
      idler,
      createdAt: Date.now()
    };
  }, []);

  // Update photon with buttery easing - independent of changing data
  const updatePhoton = useCallback((photon: Photon, deltaTime: number, canvasWidth: number, canvasHeight: number): void => {
    // Use cached node positions to prevent photons from being affected by changing data
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
    
    // Debug logging for photon movement
    if (photon.id.includes('signal') && Math.random() < 0.01) { // Log 1% of signal photons
      console.log('Photon debug:', {
        id: photon.id,
        currentPathIndex: photon.currentPathIndex,
        path: photon.path,
        progress: photon.progress,
        position: { x: photon.x, y: photon.y },
        deltaTime
      });
    }
    
    if (photon.currentPathIndex >= photon.path.length - 1) {
      // Photon reached destination
      const detectorId = photon.path[photon.path.length - 1];
      const hitType = ['D1', 'D2'].includes(detectorId) ? 'which-path' : 'erased';
      
      detectorHitsRef.current.push({
        detectorId,
        timestamp: Date.now(),
        intensity: photon.size,
        type: hitType
      });
      
      // Create retrocausal arc
      if (detectorId !== 'D0') {
        retrocausalArcsRef.current.push({
          id: `arc_${Date.now()}`,
          fromDetector: detectorId,
          progress: 0,
          opacity: 1,
          timestamp: Date.now()
        });
      }
      
      // Update interference pattern at D0
      if (detectorId === 'D0') {
        interferencePatternRef.current = {
          type: hitType === 'which-path' ? 'stripes' : 'rings',
          intensity: photon.size,
          timestamp: Date.now(),
          phase: 0
        };
        
        // Update state message based on trading data
        if (hitType === 'erased') {
          const tradeCount = photonPairsRef.current.length;
          currentStateRef.current = `Path erased → interference at D0 → confidence ↑ (${tradeCount} trades analyzed)`;
        } else {
          const tradeCount = photonPairsRef.current.length;
          currentStateRef.current = `Path known → no interference → confidence ↓ (${tradeCount} trades analyzed)`;
        }
      }
      
      return;
    }

    const currentNode = photon.path[photon.currentPathIndex];
    const nextNode = photon.path[photon.currentPathIndex + 1];
    const currentPos = nodes[currentNode as keyof typeof nodes];
    const nextPos = nodes[nextNode as keyof typeof nodes];

    // Cubic-bezier easing: (0.22,0.61,0.36,1)
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    // Increase speed multiplier to make photons move faster through longer paths
    photon.progress += photon.speed * deltaTime * 0.005;
    const easedProgress = easeOutCubic(Math.min(photon.progress, 1));
    
    if (photon.progress >= 1) {
      // Move to next segment
      photon.progress = 0;
      photon.currentPathIndex++;
      
      // Update current position to the node we just reached
      photon.x = nextPos.x;
      photon.y = nextPos.y;
      
      // Set up next target if there are more nodes in the path
      if (photon.currentPathIndex < photon.path.length - 1) {
        const nextTarget = nodes[photon.path[photon.currentPathIndex + 1] as keyof typeof nodes];
        photon.targetX = nextTarget.x;
        photon.targetY = nextTarget.y;
      }
    } else {
      // Smooth interpolation between current and next node
      photon.x = currentPos.x + (nextPos.x - currentPos.x) * easedProgress;
      photon.y = currentPos.y + (nextPos.y - currentPos.y) * easedProgress;
    }
    
    // Debug: Log photon progress
    if (photon.id.includes('signal') && Math.random() < 0.1) { // Log 10% of signal photons
      console.log(`Photon ${photon.id} progress:`, {
        currentPathIndex: photon.currentPathIndex,
        pathLength: photon.path.length,
        progress: photon.progress.toFixed(3),
        currentNode: photon.path[photon.currentPathIndex],
        nextNode: photon.path[photon.currentPathIndex + 1],
        position: { x: photon.x.toFixed(1), y: photon.y.toFixed(1) }
      });
    }

    // Update trail with slippage encoding
    const trailLength = Math.max(3, Math.min(12, Math.floor(photon.slippage * 20)));
    photon.trail.push({ 
      x: photon.x, 
      y: photon.y, 
      opacity: 1, 
      timestamp: Date.now() 
    });
    photon.trail = photon.trail.slice(-trailLength);
    photon.trail.forEach(point => {
      const age = Date.now() - point.timestamp;
      point.opacity = Math.max(0, 1 - age / 1000);
    });
  }, [predictionData]);

  // Draw film grain background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle film grain
    ctx.save();
    ctx.globalAlpha = 0.02;
    for (let i = 0; i < width * height / 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }, []);

  // Draw precision rails
  const drawRails = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void => {
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
    ctx.save();
    ctx.strokeStyle = colors.rails;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.6;
    
    // Signal rail (BBO to D0)
    const bboPos = nodes.BBO;
    const d0Pos = nodes.D0;
    
    ctx.beginPath();
    ctx.moveTo(bboPos.x, bboPos.y);
    ctx.lineTo(d0Pos.x, d0Pos.y);
    ctx.stroke();
    
    // Idler rails
    const idlerPaths = [
      ['BBO', 'BSa', 'D1'],
      ['BBO', 'BSa', 'BSb', 'BSc', 'D3']
    ];
    
    idlerPaths.forEach(path => {
      ctx.beginPath();
      for (let i = 0; i < path.length - 1; i++) {
        const fromNode = nodes[path[i] as keyof typeof nodes];
        const toNode = nodes[path[i + 1] as keyof typeof nodes];
        
        if (i === 0) {
          ctx.moveTo(fromNode.x, fromNode.y);
        }
        
        // Bezier splines with constant curvature
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        const offset = Math.sin(Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)) * 15;
        
        ctx.quadraticCurveTo(midX + offset, midY - offset, toNode.x, toNode.y);
      }
      ctx.stroke();
    });
    
    ctx.restore();
  }, []);

  // Draw nodes with depth-of-field
  const drawNodes = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void => {
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
    Object.entries(nodes).forEach(([id, node]) => {
      ctx.save();
      
      // Micro-parallax based on mouse position
      const parallaxOffset = (node.depth - 2) * 2;
      const mouseInfluence = {
        x: (mousePosRef.current.x - node.x) * 0.0001 * parallaxOffset,
        y: (mousePosRef.current.y - node.y) * 0.0001 * parallaxOffset
      };
      
      const adjustedX = node.x + mouseInfluence.x;
      const adjustedY = node.y + mouseInfluence.y;
      
      if (node.type === 'laser') {
        // Small red pilot light
        ctx.fillStyle = '#FF4444';
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.type === 'bbo') {
        // Cyan core entangler
        ctx.fillStyle = colors.neutral;
        ctx.shadowColor = colors.neutral;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.type === 'splitter') {
        // Muted indigo beam splitters with bevel
        ctx.fillStyle = colors.splitter;
        ctx.shadowColor = colors.splitter;
        ctx.shadowBlur = 8;
        ctx.translate(adjustedX, adjustedY);
        ctx.rotate(Math.PI / 4);
        
        // Inner glow
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#9CA3F0';
        ctx.fillRect(-4, -4, 8, 8);
        
        ctx.rotate(-Math.PI / 4);
        ctx.translate(-adjustedX, -adjustedY);
      } else if (node.type === 'detector') {
        // Porcelain white cores with thin halo
        const recentHits = detectorHitsRef.current.filter(hit => 
          hit.detectorId === id && Date.now() - hit.timestamp < 2000
        );
        
        if (recentHits.length > 0) {
          // Pulse effect on hit
          const pulseScale = 1 + Math.sin((Date.now() - recentHits[0].timestamp) * 0.01) * 0.1;
          ctx.scale(pulseScale, pulseScale);
        }
        
        // Thin halo
        ctx.strokeStyle = colors.detector;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.detector;
        ctx.shadowColor = colors.detector;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.type === 'engine') {
        // Prediction Engine with breathing animation
        engineBreathRef.current += 0.02;
        const breathScale = 1 + Math.sin(engineBreathRef.current) * 0.015;
        ctx.scale(breathScale, breathScale);
        
        // Confidence ring
        const confidence = predictionData.confidence;
        const ringThickness = confidence * 8;
        
        ctx.strokeStyle = colors.neutral;
        ctx.lineWidth = ringThickness;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 15 + ringThickness / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.neutral;
        ctx.shadowColor = colors.neutral;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      // Draw labels outside nodes
      ctx.save();
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.72;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      
      // Position labels outside nodes
      let labelX = adjustedX;
      let labelY = adjustedY - 25;
      
      if (node.type === 'detector') {
        labelY = adjustedY - 20;
      } else if (node.type === 'engine') {
        labelY = adjustedY - 30;
      }
      
      ctx.fillText(id, labelX, labelY);
      ctx.restore();
    });
  }, [predictionData]);

  // Draw photons with quantum wake turbulence
  const drawPhotons = useCallback((ctx: CanvasRenderingContext2D): void => {
    photonPairsRef.current.forEach(pair => {
      // Draw signal photon
      const signal = pair.signal;
      ctx.save();
      
      // Quantum wake turbulence for high-value photons
      if (signal.size > 6) {
        ctx.shadowColor = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
        ctx.shadowBlur = 20;
      }
      
      // Draw trail with slippage encoding
      signal.trail.forEach((point, index) => {
        ctx.globalAlpha = point.opacity * 0.4;
        ctx.fillStyle = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
        ctx.beginPath();
        ctx.arc(point.x, point.y, signal.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw photon
      ctx.globalAlpha = 1;
      ctx.fillStyle = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
      ctx.shadowColor = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(signal.x, signal.y, signal.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Draw idler photon
      const idler = pair.idler;
      ctx.save();
      
      if (idler.size > 6) {
        ctx.shadowColor = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
        ctx.shadowBlur = 20;
      }
      
      // Draw trail
      idler.trail.forEach((point, index) => {
        ctx.globalAlpha = point.opacity * 0.4;
        ctx.fillStyle = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
        ctx.beginPath();
        ctx.arc(point.x, point.y, idler.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw photon
      ctx.globalAlpha = 1;
      ctx.fillStyle = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
      ctx.shadowColor = pair.transaction.side === 'BUY' ? colors.buy : colors.sell;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(idler.x, idler.y, idler.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }, []);

  // Draw interference patterns with animated phase drift - DISABLED
  const drawInterferencePattern = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void => {
    // Interference pattern drawing disabled to remove thick green lines
    return;
  }, []);

  // Draw retrocausal arcs with afterimage
  const drawRetrocausalArcs = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void => {
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
    retrocausalArcsRef.current.forEach(arc => {
      const fromDetector = nodes[arc.fromDetector as keyof typeof nodes];
      const d0Pos = nodes.D0;
      
      ctx.save();
      ctx.strokeStyle = colors.neutral;
      ctx.globalAlpha = arc.opacity * 0.6;
      ctx.lineWidth = 0.8;
      ctx.shadowColor = colors.neutral;
      ctx.shadowBlur = 6;
      
      // Create curved arc
      const midX = (fromDetector.x + d0Pos.x) / 2;
      const midY = (fromDetector.y + d0Pos.y) / 2 - 40;
      
      ctx.beginPath();
      ctx.moveTo(fromDetector.x, fromDetector.y);
      ctx.quadraticCurveTo(midX, midY, d0Pos.x, d0Pos.y);
      ctx.stroke();
      
      ctx.restore();
    });
  }, []);


  // Draw state explanation
  const drawStateExplanation = useCallback((ctx: CanvasRenderingContext2D): void => {
    if (!currentStateRef.current) return;
    
    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.8;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    
    const canvas = canvasRef.current;
    if (canvas) {
      ctx.fillText(currentStateRef.current, canvas.width - 20, 30);
    }
    
    ctx.restore();
  }, []);

  // Animation loop at 60fps
  const animate = useCallback((timestamp: number): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Safety check to prevent infinite loops
    if (width === 0 || height === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    // Clear canvas
    drawBackground(ctx, width, height);
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);
    
    // Draw rails
    drawRails(ctx, width, height);
    
    // Draw nodes with depth-of-field
    drawNodes(ctx, width, height);
    
    // Update photon pairs with safety checks - each animation round is independent
    const deltaTime = Math.min(timestamp - lastTradeTimeRef.current, 100); // Cap deltaTime to prevent large jumps
    
    // Update each animation round independently
    activeAnimationRoundsRef.current.forEach((roundPairs, roundId) => {
      roundPairs.forEach(pair => {
        if (pair.signal && pair.idler) {
          // Update both photons independently
          updatePhoton(pair.signal, deltaTime, width, height);
          updatePhoton(pair.idler, deltaTime, width, height);
        }
      });
    });
    
    // Filter main photon pairs array
    photonPairsRef.current = photonPairsRef.current.filter(pair => {
      if (pair.signal && pair.idler) {
        // Keep the pair until BOTH photons complete their paths
        const signalComplete = pair.signal.currentPathIndex >= pair.signal.path.length - 1;
        const idlerComplete = pair.idler.currentPathIndex >= pair.idler.path.length - 1;
        
        // Only remove the pair when both photons have completed their journeys
        return !(signalComplete && idlerComplete);
      }
      return false;
    });
    
    // Limit number of photon pairs to prevent performance issues
    if (photonPairsRef.current.length > 50) {
      photonPairsRef.current = photonPairsRef.current.slice(-50);
    }
    
    // Draw photons
    drawPhotons(ctx);
    
    // Update retrocausal arcs
    retrocausalArcsRef.current = retrocausalArcsRef.current.filter(arc => {
      arc.progress += 0.015;
      arc.opacity -= 0.008;
      return arc.progress < 1 && arc.opacity > 0;
    });
    
    // Draw retrocausal arcs
    drawRetrocausalArcs(ctx, width, height);
    
    // Draw interference pattern
    drawInterferencePattern(ctx, width, height);
    
    // Restore transformations for UI elements
    ctx.restore();
    
    // Clean up old detector hits
    detectorHitsRef.current = detectorHitsRef.current.filter(hit => 
      Date.now() - hit.timestamp < 3000
    );
    
    // Draw UI elements (not affected by zoom/pan)
    drawStateExplanation(ctx);
    
    lastTradeTimeRef.current = timestamp;
    
    // Schedule next frame
    if (animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, []); // Remove all dependencies to prevent unnecessary restarts

  // Constrain pan to container boundaries
  const constrainPan = useCallback((canvasWidth: number, canvasHeight: number) => {
    const maxPanX = canvasWidth * 0.3; // Allow 30% pan in each direction
    const maxPanY = canvasHeight * 0.3;
    
    panRef.current.x = Math.max(-maxPanX, Math.min(maxPanX, panRef.current.x));
    panRef.current.y = Math.max(-maxPanY, Math.min(maxPanY, panRef.current.y));
  }, []);

  // Zoom control functions
  const zoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const zoomFactor = 1.2;
    const newZoom = Math.max(0.1, Math.min(5, zoomRef.current * zoomFactor));
    
    // Zoom towards center - adjust pan to keep center in view
    const zoomChange = newZoom / zoomRef.current;
    panRef.current.x = panRef.current.x * zoomChange;
    panRef.current.y = panRef.current.y * zoomChange;
    
    zoomRef.current = newZoom;
    constrainPan(canvas.width, canvas.height);
  }, [constrainPan]);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const zoomFactor = 0.8;
    const newZoom = Math.max(0.1, Math.min(5, zoomRef.current * zoomFactor));
    
    // Zoom towards center - adjust pan to keep center in view
    const zoomChange = newZoom / zoomRef.current;
    panRef.current.x = panRef.current.x * zoomChange;
    panRef.current.y = panRef.current.y * zoomChange;
    
    zoomRef.current = newZoom;
    constrainPan(canvas.width, canvas.height);
  }, [constrainPan]);

  // Expose zoom functions via ref
  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut
  }), [zoomIn, zoomOut]);

  // Mouse tracking for micro-parallax, zoom, and pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      mousePosRef.current = { x: mouseX, y: mouseY };
      
      // Handle panning with boundary constraints
      if (isDraggingRef.current) {
        const deltaX = mouseX - lastMousePosRef.current.x;
        const deltaY = mouseY - lastMousePosRef.current.y;
        
        panRef.current.x += deltaX;
        panRef.current.y += deltaY;
        
        // Apply boundary constraints
        constrainPan(canvas.width, canvas.height);
        
        lastMousePosRef.current = { x: mouseX, y: mouseY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        isDraggingRef.current = true;
        const rect = canvas.getBoundingClientRect();
        lastMousePosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoomRef.current * zoomFactor));
      
      // Zoom towards mouse position
      const zoomChange = newZoom / zoomRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate the offset from center
      const offsetX = mouseX - centerX;
      const offsetY = mouseY - centerY;
      
      // Adjust pan to zoom towards mouse position
      panRef.current.x = panRef.current.x + offsetX * (1 - zoomChange);
      panRef.current.y = panRef.current.y + offsetY * (1 - zoomChange);
      
      zoomRef.current = newZoom;
      
      // Apply boundary constraints after zoom
      constrainPan(canvas.width, canvas.height);
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // Disable right-click context menu
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', handleContextMenu);
    
    // Set initial cursor
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [constrainPan]);

  // Process Jupiter data and Helius trades into photon pairs
  useEffect(() => {
    if (!selectedToken || !jupiterData) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create photon pairs based on Jupiter market data
    const marketCapTransaction: Transaction = {
      signature: `jupiter-mcap-${selectedToken.id}`,
      timestamp: Date.now(),
      type: 'MARKET_CAP',
      amount: jupiterData.marketCap,
      price: jupiterData.price,
      side: jupiterData.priceChangePercent24h >= 0 ? 'BUY' : 'SELL',
      user: 'jupiter',
      slot: 0,
      fee: 0
    };
    
    // Clear existing photons and create new ones for Jupiter data
    photonPairsRef.current = [];
    const marketCapPhotonPair = createPhotonPair(marketCapTransaction, canvas.width, canvas.height);
    photonPairsRef.current.push(marketCapPhotonPair);
    
    // Cap simultaneous photons (last 30 tx)
    if (photonPairsRef.current.length > 30) {
      photonPairsRef.current = photonPairsRef.current.slice(-30);
    }
  }, [selectedToken, jupiterData, createPhotonPair]);

  // Track processed trades and animation rounds
  const processedTradesRef = useRef<Set<string>>(new Set());
  const activeAnimationRoundsRef = useRef<Map<string, PhotonPair[]>>(new Map());
  
  // Clear everything when token changes
  useEffect(() => {
    processedTradesRef.current.clear();
    activeAnimationRoundsRef.current.clear();
    photonPairsRef.current = [];
  }, [selectedToken]);
  
  // Process each trade as a separate animation round
  useEffect(() => {
    if (!selectedToken || trades.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Find new trades that haven't been processed yet
    const newTrades = trades.filter(trade => !processedTradesRef.current.has(trade.txHash));
    
    if (newTrades.length === 0) return;
    
    // Process each new trade as a separate animation round
    newTrades.forEach((trade, index) => {
      // Stagger each animation round
      setTimeout(() => {
        processedTradesRef.current.add(trade.txHash);
        
        // Create a single photon pair for this trade
        const tradeTransaction: Transaction = {
          signature: trade.txHash,
          timestamp: trade.blockUnixTime * 1000,
          type: trade.volumeUsd > 10000 ? 'HIGH_VOLUME_TRADE' : 'TRADE',
          amount: trade.amount,
          price: trade.priceUsd,
          side: (trade.side === 'buy' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
          user: trade.owner,
          slot: 0,
          fee: 0
        };
        
        const tradePhotonPair = createPhotonPair(tradeTransaction, canvas.width, canvas.height);
        
        // Create a separate animation round for this trade
        const roundId = `round_${trade.txHash}_${Date.now()}`;
        activeAnimationRoundsRef.current.set(roundId, [tradePhotonPair]);
        
        // Add to main photon pairs for rendering
        photonPairsRef.current.push(tradePhotonPair);
        
        // Clean up this animation round after 10 seconds
        setTimeout(() => {
          activeAnimationRoundsRef.current.delete(roundId);
          // Remove the photon pair from main array
          photonPairsRef.current = photonPairsRef.current.filter(pair => pair.id !== tradePhotonPair.id);
        }, 10000);
        
        console.log(`🔄 Created separate animation round for trade: ${trade.txHash}`);
      }, index * 500); // 500ms delay between each animation round
    });
  }, [trades, selectedToken, createPhotonPair]);




  // Start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let isActive = true;
    
    const resizeCanvas = () => {
      if (!isActive) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start animation loop
    const startAnimation = () => {
      if (!isActive) return;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    startAnimation();
    
    return () => {
      isActive = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      // Clear all refs to prevent memory leaks
      photonPairsRef.current = [];
      retrocausalArcsRef.current = [];
      detectorHitsRef.current = [];
    };
  }, []); // Remove animate dependency to prevent restarts

  return (
    <div className="w-full h-full relative flex">
      {/* Simulation Canvas - Always Visible */}
      <div className="flex-1 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: colors.background }}
      />
        
        {/* Legend Button - Bottom Right Corner */}
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-3 py-2 bg-black/80 hover:bg-black/90 border border-white/30 rounded-full text-white/70 hover:text-white text-sm transition-all duration-200 shadow-lg"
          >
            Legend
          </button>
        </div>
        

        {/* Legend Panel */}
        {showLegend && (
          <div className="absolute bottom-16 right-4 z-20 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-xs">
            <h3 className="text-white font-bold mb-3 text-sm">Quantum Simulation Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-white/80">Signal Photon</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-white/80">Idler Photon</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-white/80">Entangled Pair</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span className="text-white/80">Quantum State</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-white/80">Detector Hit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-white/80">Retrocausal Arc</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/20">
              <p className="text-white/60 text-xs">
                Click and drag to pan, scroll to zoom, right-click for context menu
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Panel - Always Visible */}
      <div className="w-96 h-full bg-black/90 backdrop-blur-sm border-l border-white/10 flex flex-col">

        {/* Live Trades Panel */}
        <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Trades</h3>
          </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${tradesLoading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                <span className="text-sm text-white/60">
                  {tradesLoading ? 'Loading...' : 'Connected'}
                </span>
              </div>
              {trades.length > 0 && (
                <div className="text-xs text-white/40">
                  {trades.length} trades
                </div>
              )}
            </div>
          </div>

          {/* Trades Display */}
          <div className="flex-1 overflow-y-auto p-4" ref={tradesContainerRef}>
            {!selectedToken ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-white/40 text-lg mb-2">🔍</div>
                  <div className="text-white/60">Select a token from the search bar to view live trades</div>
                </div>
              </div>
            ) : tradesError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-400 text-lg mb-2">❌</div>
                  <div className="text-red-400 mb-2">Error loading trades</div>
                  <div className="text-white/60 text-sm">{tradesError}</div>
                </div>
              </div>
            ) : tradesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-white/60">🔄 Connecting…</div>
                </div>
              </div>
            ) : trades.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-white/40 text-lg mb-2">📊</div>
                  <div className="text-white/60">No recent trades found</div>
                </div>
              </div>
            ) : (
              <div>
                <ul className="space-y-2">
                  {trades.map((trade) => (
                    <li 
                      key={trade.txHash} 
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span 
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            trade.side === 'buy' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {trade.side ? trade.side.toUpperCase() : 'UNKNOWN'}
                        </span>
                        <span className="text-white font-mono text-sm">
                          {trade.amount && trade.amount >= 1000000 ? 
                            `${(trade.amount / 1000000).toFixed(2)}M` :
                            trade.amount && trade.amount >= 1000 ? 
                            `${(trade.amount / 1000).toFixed(2)}K` :
                            trade.amount ? trade.amount.toFixed(2) : '0'
                          }
                        </span>
                        <span className="text-white/60 text-sm">
                          {selectedToken?.symbol || 'TOKEN'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-white/80 text-sm font-mono">
                          ${trade.priceUsd ? trade.priceUsd.toFixed(4) : '0.0000'}
                        </div>
                        <div className="text-white/40 text-xs">
                          {trade.blockUnixTime ? new Date(trade.blockUnixTime * 1000).toLocaleTimeString() : 'Unknown'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </div>
        </div>

    </div>
  );
});

export default PureVisualRetrocausality;