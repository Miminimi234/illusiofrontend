'use client';

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

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

interface PureVisualRetrocausalityProps {
  onNodeHover?: (nodeId: string | null) => void;
  predictionData?: {
    confidence: number;
    expectedRange: { min: number; max: number };
    upProbability: number;
    downProbability: number;
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
    downProbability: 0.4
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
  const legendVisibleRef = useRef<boolean>(true);
  const legendTimeoutRef = useRef<NodeJS.Timeout>();
  const currentStateRef = useRef<string>('');
  
  // Zoom and pan state
  const zoomRef = useRef<number>(1);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Path definitions with weights
  const paths = {
    signal: ['BBO', 'D0'],
    idler: {
      whichPath: ['BBO', 'BSa', 'D1'], // 40% weight
      erased: ['BBO', 'BSa', 'BSb', 'BSc', 'D3'] // 60% weight
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
    
    // Weighted random selection for idler path
    const isErased = Math.random() < 0.6; // 60% erased, 40% which-path
    const idlerPath = isErased ? paths.idler.erased : paths.idler.whichPath;
    const idlerEndNode = nodes[idlerPath[idlerPath.length - 1] as keyof typeof nodes];
    
    const size = Math.max(2, Math.min(8, Math.log(transaction.amount) / 2.5));
    const speed = Math.max(0.5, Math.min(2, 2 - (Date.now() - transaction.timestamp) / 10000));
    const slippage = Math.random() * 0.3; // 0-30% slippage
    
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

  // Update photon with buttery easing
  const updatePhoton = useCallback((photon: Photon, deltaTime: number, canvasWidth: number, canvasHeight: number): void => {
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
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
        
        // Update state message
        if (hitType === 'erased') {
          currentStateRef.current = `Path erased → interference at D0 → confidence ↑ (±${predictionData.expectedRange.min}%)`;
        } else {
          currentStateRef.current = `Path known → no interference → confidence ↓ (±${predictionData.expectedRange.max}%)`;
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
    photon.progress += photon.speed * deltaTime * 0.001;
    const easedProgress = easeOutCubic(Math.min(photon.progress, 1));
    
    if (photon.progress >= 1) {
      photon.progress = 0;
      photon.currentPathIndex++;
      photon.x = nextPos.x;
      photon.y = nextPos.y;
      
      if (photon.currentPathIndex < photon.path.length - 1) {
        const nextTarget = nodes[photon.path[photon.currentPathIndex + 1] as keyof typeof nodes];
        photon.targetX = nextTarget.x;
        photon.targetY = nextTarget.y;
      }
    } else {
      // Smooth interpolation
      photon.x = currentPos.x + (nextPos.x - currentPos.x) * easedProgress;
      photon.y = currentPos.y + (nextPos.y - currentPos.y) * easedProgress;
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

  // Draw interference patterns with animated phase drift
  const drawInterferencePattern = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void => {
    if (!interferencePatternRef.current) return;
    
    const nodes = getCenteredNodes(canvasWidth, canvasHeight);
    const pattern = interferencePatternRef.current;
    const d0Pos = nodes.D0;
    const timeSinceCreation = Date.now() - pattern.timestamp;
    const fadeOut = Math.max(0, 1 - timeSinceCreation / 4000);
    
    if (fadeOut <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = fadeOut * 0.3;
    
    if (pattern.type === 'stripes') {
      // Which-path: mild Gaussian stripes
      ctx.strokeStyle = colors.sell;
      ctx.lineWidth = 2;
      ctx.shadowColor = colors.sell;
      ctx.shadowBlur = 10;
      
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(d0Pos.x - 15, d0Pos.y - 8 + i * 16);
        ctx.lineTo(d0Pos.x + 15, d0Pos.y - 8 + i * 16);
        ctx.stroke();
      }
    } else {
      // Erased: soft interference rings with phase drift
      pattern.phase += 0.05;
      
      ctx.strokeStyle = colors.buy;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = colors.buy;
      ctx.shadowBlur = 15;
      
      for (let i = 0; i < 3; i++) {
        const radius = 20 + i * 8 + Math.sin(pattern.phase + i) * 2;
        ctx.beginPath();
        ctx.arc(d0Pos.x, d0Pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
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

  // Draw legend chip
  const drawLegend = useCallback((ctx: CanvasRenderingContext2D): void => {
    if (!legendVisibleRef.current) return;
    
    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.72;
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    
    const legendLines = [
      'Color = side • Thickness = size',
      'Halo = impact • Ring = confidence'
    ];
    
    legendLines.forEach((line, index) => {
      ctx.fillText(line, 20, 30 + index * 12);
    });
    
    ctx.restore();
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
    
    // Update photon pairs
    const deltaTime = timestamp - lastTradeTimeRef.current;
    photonPairsRef.current = photonPairsRef.current.filter(pair => {
      updatePhoton(pair.signal, deltaTime, width, height);
      updatePhoton(pair.idler, deltaTime, width, height);
      return pair.signal.currentPathIndex < pair.signal.path.length - 1 || 
             pair.idler.currentPathIndex < pair.idler.path.length - 1;
    });
    
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
    drawLegend(ctx);
    drawStateExplanation(ctx);
    
    lastTradeTimeRef.current = timestamp;
    animationRef.current = requestAnimationFrame(animate);
  }, [drawBackground, drawRails, drawNodes, drawPhotons, drawRetrocausalArcs, drawInterferencePattern, drawLegend, drawStateExplanation, updatePhoton]);

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

  // Process selected token data into photon pairs
  useEffect(() => {
    if (!selectedToken) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a mock transaction based on selected token for visualization
    const mockTransaction: Transaction = {
      signature: `selected-${selectedToken.id}`,
      timestamp: Date.now(),
      type: 'SELECTION',
      amount: selectedToken.mcap || 0,
      price: selectedToken.usdPrice || 0,
      side: 'BUY',
      user: 'user',
      slot: 0,
      fee: 0
    };
    
    // Clear existing photons and create new ones for selected token
    photonPairsRef.current = [];
    const photonPair = createPhotonPair(mockTransaction, canvas.width, canvas.height);
    photonPairsRef.current.push(photonPair);
    
    // Cap simultaneous photons (last 30 tx)
    if (photonPairsRef.current.length > 30) {
      photonPairsRef.current = photonPairsRef.current.slice(-30);
    }
  }, [selectedToken, createPhotonPair]);

  // Handle legend visibility
  useEffect(() => {
    const hideLegend = () => {
      legendVisibleRef.current = false;
    };
    
    const showLegend = () => {
      legendVisibleRef.current = true;
      if (legendTimeoutRef.current) {
        clearTimeout(legendTimeoutRef.current);
      }
      legendTimeoutRef.current = setTimeout(hideLegend, 4000);
    };
    
    // Show legend initially
    showLegend();
    
    // Show legend on inactivity
    const inactivityTimer = setInterval(() => {
      if (photonPairsRef.current.length === 0) {
        showLegend();
      }
    }, 6000);
    
    return () => {
      if (legendTimeoutRef.current) {
        clearTimeout(legendTimeoutRef.current);
      }
      clearInterval(inactivityTimer);
    };
  }, []);

  // Start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: colors.background }}
      />
    </div>
  );
});

export default PureVisualRetrocausality;