"use client";
import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface QuantumEraserSketchProps {
  onNodeHover?: (node: string | null) => void;
  predictionData?: {
    confidence: number;
    expectedRange: { min: number; max: number };
    upProbability: number;
    downProbability: number;
  };
}

export default function QuantumEraserSketch({ onNodeHover, predictionData }: QuantumEraserSketchProps) {
  const sketchRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!sketchRef.current) return;

    // Clean up any existing instance
    if (sketchRef.current.children.length > 0) {
      const existingInstance = (sketchRef.current as any)._p5Instance;
      if (existingInstance) {
        existingInstance.remove();
      }
      sketchRef.current.innerHTML = '';
    }

    const sketch = (p: p5) => {
      let t = 0;
      let particles: Array<{
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        progress: number;
        color: p5.Color;
        speed: number;
      }> = [];
      let currentHoveredNode: string | null = null;

      const canvasSize = () => {
        const el = sketchRef.current;
        return {
          w: el ? el.offsetWidth : 800,
          h: el ? el.offsetHeight : 600
        };
      };

      // Simplified, cleaner node definitions
      const nodes = {
        laser: { x: 0, y: 0, type: 'laser', label: 'LASER', color: [255, 100, 100], size: 25, description: 'Quantum light source' },
        bbo: { x: 0, y: 0, type: 'crystal', label: 'BBO', color: [100, 200, 255], size: 30, description: 'Entanglement crystal' },
        bsa: { x: 0, y: 0, type: 'splitter', label: 'BSa', color: [150, 150, 255], size: 22, description: 'Beam splitter A' },
        bsb: { x: 0, y: 0, type: 'splitter', label: 'BSb', color: [150, 150, 255], size: 22, description: 'Beam splitter B' },
        bsc: { x: 0, y: 0, type: 'splitter', label: 'BSc', color: [150, 150, 255], size: 22, description: 'Beam splitter C' },
        bsd: { x: 0, y: 0, type: 'splitter', label: 'BSd', color: [150, 150, 255], size: 22, description: 'Beam splitter D' },
        ma: { x: 0, y: 0, type: 'mirror', label: 'Ma', color: [100, 255, 100], size: 20, description: 'Mirror A' },
        mb: { x: 0, y: 0, type: 'mirror', label: 'Mb', color: [100, 255, 100], size: 20, description: 'Mirror B' },
        d0: { x: 0, y: 0, type: 'detector', label: 'D0', color: [255, 255, 255], size: 20, description: 'Detector 0' },
        d1: { x: 0, y: 0, type: 'detector', label: 'D1', color: [255, 255, 255], size: 20, description: 'Detector 1' },
        d2: { x: 0, y: 0, type: 'detector', label: 'D2', color: [255, 255, 255], size: 20, description: 'Detector 2' },
        d3: { x: 0, y: 0, type: 'detector', label: 'D3', color: [255, 255, 255], size: 20, description: 'Detector 3' },
        d4: { x: 0, y: 0, type: 'detector', label: 'D4', color: [255, 255, 255], size: 20, description: 'Detector 4' },
        prediction: { x: 0, y: 0, type: 'engine', label: 'PREDICTION ENGINE', color: [0, 200, 255], size: 50, description: 'Quantum prediction matrix' }
      };

      p.setup = () => {
        const { w, h } = canvasSize();
        p.createCanvas(w, h);
        p.colorMode(p.RGB, 255);
        initializeNodePositions(w, h);
      };

      p.windowResized = () => {
        const { w, h } = canvasSize();
        p.resizeCanvas(w, h);
        initializeNodePositions(w, h);
      };

      function initializeNodePositions(w: number, h: number) {
        // Much cleaner, more logical layout
        const centerY = h * 0.5;
        const leftX = w * 0.1;
        const rightX = w * 0.9;
        const midX = w * 0.5;
        
        // Laser (far left)
        nodes.laser.x = leftX;
        nodes.laser.y = centerY;
        
        // BBO Crystal (left-center)
        nodes.bbo.x = w * 0.25;
        nodes.bbo.y = centerY;
        
        // Beam Splitters (center area, well spaced)
        nodes.bsa.x = w * 0.4;
        nodes.bsa.y = centerY - 80;
        nodes.bsb.x = w * 0.5;
        nodes.bsb.y = centerY - 40;
        nodes.bsc.x = w * 0.6;
        nodes.bsc.y = centerY + 40;
        nodes.bsd.x = w * 0.7;
        nodes.bsd.y = centerY + 80;
        
        // Mirrors (strategically placed)
        nodes.ma.x = w * 0.35;
        nodes.ma.y = centerY + 120;
        nodes.mb.x = w * 0.65;
        nodes.mb.y = centerY - 120;
        
        // Detectors (well distributed)
        nodes.d0.x = rightX - 60;
        nodes.d0.y = centerY - 100;
        nodes.d1.x = w * 0.3;
        nodes.d1.y = centerY + 180;
        nodes.d2.x = w * 0.5;
        nodes.d2.y = centerY + 180;
        nodes.d3.x = w * 0.2;
        nodes.d3.y = centerY - 180;
        nodes.d4.x = w * 0.8;
        nodes.d4.y = centerY + 180;
        
        // Prediction Engine (right side, prominent)
        nodes.prediction.x = rightX;
        nodes.prediction.y = centerY;
      }

      p.draw = () => {
        t += 0.016;
        // Much darker, cleaner background
        p.background(8, 8, 12);
        
        // Subtle grid
        drawSubtleGrid();
        
        // Draw connections first (behind nodes)
        drawConnections();
        
        // Draw nodes
        drawNodes();
        
        // Draw particles
        drawParticles();
        
        // Update particles
        updateParticles();
        
        // Draw prediction panel
        drawPredictionPanel();
      };

      function drawSubtleGrid() {
        p.stroke(30, 30, 40, 30);
        p.strokeWeight(1);
        
        const gridSize = 50;
        for (let x = 0; x < p.width; x += gridSize) {
          p.line(x, 0, x, p.height);
        }
        for (let y = 0; y < p.height; y += gridSize) {
          p.line(0, y, p.width, y);
        }
      }

      function drawConnections() {
        // Simplified, cleaner connections
        const connections = [
          { from: 'laser', to: 'bbo', color: [255, 100, 100] },
          { from: 'bbo', to: 'bsa', color: [100, 200, 255] },
          { from: 'bbo', to: 'bsb', color: [100, 200, 255] },
          { from: 'bbo', to: 'bsc', color: [100, 200, 255] },
          { from: 'bsa', to: 'd3', color: [150, 150, 255] },
          { from: 'bsb', to: 'd2', color: [150, 150, 255] },
          { from: 'bsc', to: 'd4', color: [150, 150, 255] },
          { from: 'bsd', to: 'd0', color: [150, 150, 255] },
          { from: 'ma', to: 'd1', color: [100, 255, 100] },
          { from: 'mb', to: 'bsd', color: [100, 255, 100] },
          { from: 'd0', to: 'prediction', color: [255, 255, 255] },
          { from: 'd1', to: 'prediction', color: [255, 255, 255] },
          { from: 'd2', to: 'prediction', color: [255, 255, 255] },
          { from: 'd3', to: 'prediction', color: [255, 255, 255] },
          { from: 'd4', to: 'prediction', color: [255, 255, 255] }
        ];

        connections.forEach(conn => {
          const fromNode = nodes[conn.from as keyof typeof nodes];
          const toNode = nodes[conn.to as keyof typeof nodes];
          
          if (!fromNode || !toNode) return;
          
          // Much cleaner connection lines
          const pulse = p.sin(t * 2) * 0.2 + 0.8;
          const alpha = 80 + pulse * 40;
          
          p.strokeWeight(2);
          p.stroke(conn.color[0], conn.color[1], conn.color[2], alpha);
          p.line(fromNode.x, fromNode.y, toNode.x, toNode.y);
        });
      }

      function drawNodes() {
        Object.entries(nodes).forEach(([key, node]) => {
          const isHovered = currentHoveredNode === key;
          const pulse = p.sin(t * 3) * 0.1 + 0.9;
          const size = node.size + (isHovered ? 8 : 0) + pulse * 2;
          
          // Much cleaner glow effect
          for (let i = 5; i > 0; i--) {
            const alpha = 20 - i * 3;
            const glowSize = size + i * 3;
            
            p.fill(node.color[0], node.color[1], node.color[2], alpha);
            p.noStroke();
            
            if (node.type === 'splitter') {
              p.push();
              p.translate(node.x, node.y);
              p.rotate(p.PI / 4);
              p.rectMode(p.CENTER);
              p.rect(0, 0, glowSize, glowSize, 6);
              p.pop();
            } else if (node.type === 'mirror') {
              p.stroke(node.color[0], node.color[1], node.color[2], alpha);
              p.strokeWeight(glowSize / 4);
              p.line(node.x - glowSize/2, node.y - glowSize/2, node.x + glowSize/2, node.y + glowSize/2);
            } else {
              p.ellipse(node.x, node.y, glowSize);
            }
          }
          
          // Main node with much better contrast
          p.fill(node.color[0], node.color[1], node.color[2]);
          p.stroke(255, 255, 255, 100);
          p.strokeWeight(1);
          
          if (node.type === 'splitter') {
            p.push();
            p.translate(node.x, node.y);
            p.rotate(p.PI / 4);
            p.rectMode(p.CENTER);
            p.rect(0, 0, size, size, 6);
            p.pop();
          } else if (node.type === 'mirror') {
            p.stroke(node.color[0], node.color[1], node.color[2]);
            p.strokeWeight(size / 3);
            p.line(node.x - size/2, node.y - size/2, node.x + size/2, node.y + size/2);
          } else {
            p.ellipse(node.x, node.y, size);
          }
          
          // Much clearer labels
          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(node.type === 'engine' ? 12 : 10);
          p.textStyle(p.BOLD);
          p.text(node.label, node.x, node.y + (node.type === 'engine' ? 40 : 30));
        });
      }

      function drawParticles() {
        particles.forEach(particle => {
          const alpha = p.map(particle.progress, 0, 1, 200, 0);
          p.fill(particle.color);
          p.noStroke();
          p.ellipse(particle.x, particle.y, 4);
        });
      }

      function updateParticles() {
        // Add new particles on main connections
        if (p.frameCount % 20 === 0) {
          const mainConnections = [
            { from: nodes.laser, to: nodes.bbo },
            { from: nodes.bbo, to: nodes.bsa },
            { from: nodes.bbo, to: nodes.bsb },
            { from: nodes.d0, to: nodes.prediction },
            { from: nodes.d1, to: nodes.prediction },
            { from: nodes.d2, to: nodes.prediction }
          ];

          mainConnections.forEach(conn => {
            if (Math.random() < 0.4) {
              particles.push({
                x: conn.from.x,
                y: conn.from.y,
                targetX: conn.to.x,
                targetY: conn.to.y,
                progress: 0,
                color: p.color(100, 150, 255, 180),
                speed: 0.03 + Math.random() * 0.02
              });
            }
          });
        }
        
        // Update existing particles
        particles = particles.filter(particle => {
          particle.progress += particle.speed;
          particle.x = p.lerp(particle.x, particle.targetX, 0.15);
          particle.y = p.lerp(particle.y, particle.targetY, 0.15);
          return particle.progress < 1;
        });
      }

      function drawPredictionPanel() {
        const panelX = p.width - 280;
        const panelY = p.height - 200;
        
        // Much cleaner panel design
        p.fill(15, 15, 25, 220);
        p.stroke(100, 150, 255, 100);
        p.strokeWeight(1);
        p.rect(panelX, panelY, 260, 180, 12);
        
        // Title with better contrast
        p.fill(255);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.text('PREDICTION ENGINE', panelX + 16, panelY + 16);
        
        // Confidence bar with much better visibility
        const confidence = predictionData?.confidence || 0.75;
        const confidenceWidth = 200;
        const confidenceHeight = 8;
        
        // Background
        p.fill(30, 30, 40);
        p.rect(panelX + 16, panelY + 45, confidenceWidth, confidenceHeight, 4);
        
        // Confidence fill with color ramp
        const confidenceColor = confidence < 0.5 
          ? [255, 100, 100] 
          : confidence < 0.8 
          ? [255, 200, 100] 
          : [100, 255, 100];
        
        p.fill(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
        p.rect(panelX + 16, panelY + 45, confidenceWidth * confidence, confidenceHeight, 4);
        
        // Confidence text
        p.fill(200);
        p.textSize(12);
        p.textStyle(p.NORMAL);
        p.text(`Confidence: ${Math.round(confidence * 100)}%`, panelX + 16, panelY + 65);
        
        // Expected range
        if (predictionData?.expectedRange) {
          p.fill(200);
          p.textSize(11);
          p.text(`Range: ±${typeof predictionData.expectedRange.min === 'number' ? predictionData.expectedRange.min.toFixed(1) : '0.0'}% to ±${typeof predictionData.expectedRange.max === 'number' ? predictionData.expectedRange.max.toFixed(1) : '0.0'}%`, panelX + 16, panelY + 85);
        }
        
        // Up/Down probability with better visibility
        if (predictionData?.upProbability && predictionData?.downProbability) {
          p.fill(100, 255, 100);
          p.text(`↑ ${Math.round(predictionData.upProbability * 100)}%`, panelX + 16, panelY + 105);
          p.fill(255, 100, 100);
          p.text(`↓ ${Math.round(predictionData.downProbability * 100)}%`, panelX + 16, panelY + 120);
        }
        
        // Timeline predictions with better formatting
        p.fill(180);
        p.textSize(11);
        p.text('10m → $0', panelX + 16, panelY + 145);
        p.text('1h → $0', panelX + 16, panelY + 160);
        p.text('1d → $0', panelX + 16, panelY + 175);
      }

      // Mouse interaction
      p.mouseMoved = () => {
        let newHoveredNode: string | null = null;
        
        Object.entries(nodes).forEach(([key, node]) => {
          const distance = p.dist(p.mouseX, p.mouseY, node.x, node.y);
          if (distance < node.size + 15) {
            newHoveredNode = key;
          }
        });
        
        if (newHoveredNode !== currentHoveredNode) {
          currentHoveredNode = newHoveredNode;
          setHoveredNode(newHoveredNode);
          if (onNodeHover) {
            onNodeHover(newHoveredNode);
          }
        }
      };
    };

    const p5Instance = new p5(sketch, sketchRef.current);
    // Store instance reference for proper cleanup
    if (sketchRef.current) {
      (sketchRef.current as any)._p5Instance = p5Instance;
    }
    
    return () => {
      p5Instance.remove();
      if (sketchRef.current) {
        (sketchRef.current as any)._p5Instance = null;
      }
    };
  }, [onNodeHover, predictionData]);

  return (
    <div className="w-full h-full relative">
      <div ref={sketchRef} className="w-full h-full" />
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-black/95 border border-white/30 rounded-lg p-4 text-white text-sm max-w-xs pointer-events-none z-10 shadow-lg">
          <div className="font-bold mb-2 text-blue-300">{hoveredNode.toUpperCase()}</div>
          <div className="text-white/90 text-xs leading-relaxed">
            {hoveredNode === 'laser' && 'Quantum light source that initiates the experiment'}
            {hoveredNode === 'bbo' && 'Beta-Barium Borate crystal creates entangled photon pairs'}
            {hoveredNode === 'bsa' && 'Beam splitter A - splits the quantum signal'}
            {hoveredNode === 'bsb' && 'Beam splitter B - splits the quantum signal'}
            {hoveredNode === 'bsc' && 'Beam splitter C - splits the quantum signal'}
            {hoveredNode === 'bsd' && 'Beam splitter D - splits the quantum signal'}
            {hoveredNode === 'ma' && 'Mirror A - reflects quantum information'}
            {hoveredNode === 'mb' && 'Mirror B - reflects quantum information'}
            {hoveredNode === 'd0' && 'Detector 0 - measures primary quantum state'}
            {hoveredNode === 'd1' && 'Detector 1 - measures past market signals'}
            {hoveredNode === 'd2' && 'Detector 2 - measures present market signals'}
            {hoveredNode === 'd3' && 'Detector 3 - measures future market signals'}
            {hoveredNode === 'd4' && 'Detector 4 - measures quantum echo signals'}
            {hoveredNode === 'prediction' && 'Analyzes all detector data to predict market movements'}
          </div>
        </div>
      )}
    </div>
  );
}