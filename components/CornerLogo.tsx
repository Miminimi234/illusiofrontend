"use client";
import { useEffect, useRef, useState } from "react";
import p5 from "p5";

interface CornerLogoProps {
  size?: number;
  isVisible?: boolean;
}

export default function CornerLogo({ size = 64, isVisible = true }: CornerLogoProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;

    const sketch = (p: p5) => {
      let gfx: p5.Graphics;    // glow geometry overlay
      let maskG: p5.Graphics;  // white stroke mask (no glow)
      let clipG: p5.Graphics;  // video buffer masked by maskG
      let bgVideo: HTMLVideoElement | null = null;
      let t = 0;

      const D = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      const S = () => Math.min(p.width, p.height) / 1200;

      p.setup = () => {
        const canvas = p.createCanvas(size, size);
        // make the logo canvas transparent
        if (canvas && canvas.elt) {
          (canvas.elt as HTMLCanvasElement).style.background = "transparent";
        }
        p.pixelDensity(D);

        gfx   = p.createGraphics(p.width, p.height);
        maskG = p.createGraphics(p.width, p.height);
        clipG = p.createGraphics(p.width, p.height);
        [gfx, maskG, clipG].forEach(g => g.pixelDensity(D));

        // Use the existing page background video
        bgVideo = (document.querySelector("video") as HTMLVideoElement) || null;
      };

      p.draw = () => {
        // 1) Build mask (white strokes, thicker so video fills the lines)
        maskG.clear();
        maskG.push();
        maskG.translate(p.width / 2, p.height / 2);
        maskG.noFill();
        maskG.stroke(255);
        maskG.strokeWeight(Math.max(2, 10 * S()));
        drawSystem(maskG, false, t, S);
        maskG.pop();

        // 2) Draw EXISTING page video into clipG and clip with maskG ---
        clipG.clear();
        if (bgVideo && bgVideo.readyState >= 2) {
          const cctx = (clipG as any).drawingContext as CanvasRenderingContext2D;
          // fit/cover the small canvas
          cctx.drawImage(bgVideo, 0, 0, p.width, p.height);
        }
        const ctx = (clipG as any).drawingContext as CanvasRenderingContext2D;
        ctx.globalCompositeOperation = "destination-in";
        clipG.image(maskG, 0, 0);
        ctx.globalCompositeOperation = "source-over";

        // 3) Transparent bg + masked video
        p.clear(0, 0, 0, 0);
        p.image(clipG, 0, 0);

        // 4) Crisp geometry overlay (no glow)
        gfx.clear();
        gfx.push();
        gfx.translate(p.width / 2, p.height / 2);
        gfx.rotate(t * 0.12);

        // Single crisp stroke
        const breathe = p.map(p.sin(t * 1.5), -1, 1, 0.7, 1.0);
        gfx.stroke(255, 220 * breathe);
        gfx.strokeWeight(Math.max(1.2, size * 0.02) * breathe);
        drawSystem(gfx, true, t, S);

        gfx.pop();
        p.image(gfx, 0, 0);

        t += p.deltaTime * 0.001;
      };

      // Same geometry as main view (numbers/motion unchanged)
      function drawSystem(g: p5.Graphics, finalPass: boolean, time: number, Sfn: () => number) {
        const s = Sfn();
        const R_outer = 520 * s;
        const R_side  = 220 * s;
        const R_center= 230 * s;
        const R_tb    = 180 * s;
        const R_ves   = 170 * s;
        const CX      = 270 * s;
        const TOP     = 320 * s;

        g.noFill();

        const outerPulse = 1 + 0.012 * Math.sin(time * 0.8);
        g.circle(0, 0, R_outer * 2 * outerPulse);

        const orbitR = 26 * s;
        const orbitA = time * 1.4;
        g.circle(-CX + orbitR * Math.cos(orbitA), orbitR * Math.sin(orbitA), R_side * 2);
        g.circle( CX + orbitR * Math.cos(orbitA + Math.PI), orbitR * Math.sin(orbitA + Math.PI), R_side * 2);

        const lisX = 14 * s * Math.sin(time * 1.6);
        const lisY = 14 * s * Math.sin(time * 2.3 + Math.PI/4);
        g.circle(lisX, lisY, R_center * 2);

        const vx = 120 * s;
        const pha = time * 2.1, phb = time * 1.3 + Math.PI/3;
        g.circle(-vx + 10*s * Math.sin(pha), 12*s * Math.sin(phb), R_ves * 2);
        g.circle( vx + 10*s * Math.sin(pha + Math.PI), 12*s * Math.sin(phb + Math.PI), R_ves * 2);

        const bob = 26 * s * Math.sin(time * 1.1);
        g.circle(0, -TOP + bob, R_tb * 2);
        g.circle(0,  TOP - bob, R_tb * 2);

        const prec = 0.18 * Math.sin(time * 1.25);
        g.push();
        g.rotate(prec);
        g.line(-R_outer, 0, R_outer, 0);
        g.line(0, -R_outer, 0, R_outer);
        g.pop();

        const barX = 210 * s;
        const swing = 0.12 * Math.sin(time * 1.35 + Math.PI/6);
        g.push();
        g.rotate(swing);
        g.line(-barX, 0, barX, 0);
        g.line(-barX, 0, -80 * s, -80 * s);
        g.line( barX, 0,  80 * s, -80 * s);
        g.pop();

        const apex = 480 * s;
        g.push();
        g.rotate(-prec * 1.2);
        g.triangle(0, -apex, -CX, 0, CX, 0);
        g.triangle(0,  apex, -CX, 0, CX, 0);
        g.pop();

        if (finalPass) {
          const sqBase = 110 * s;
          const sqSize = sqBase * (1 + 0.06 * Math.sin(time * 1.8));
          g.rectMode(p.CENTER);
          g.rect(0, 120 * s + sqSize / 2, sqSize, sqSize);

          g.push();
          g.noStroke();
          const dPulse = 1 + 0.25 * Math.sin(time * 2.2);
          g.fill(255, 220);
          g.circle(-360 * s + 6 * s * Math.sin(time * 1.7), 0, 10 * s * dPulse);
          g.circle( 360 * s + 6 * s * Math.sin(time * 1.7 + Math.PI), 0, 10 * s * dPulse);
          g.circle(0, -365 * s + 6 * s * Math.cos(time * 1.9), 8 * s * dPulse);
          g.circle(0,  365 * s + 6 * s * Math.cos(time * 1.9 + Math.PI), 8 * s * dPulse);
          g.pop();
        }
      }
    };

    const instance = new p5(sketch, hostRef.current!);
    return () => instance.remove();
  }, [size]);

  // Glitch effect timer - triggers every 10 seconds
  useEffect(() => {
    if (!isVisible) return;

    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      
      // Glitch duration - random between 200-500ms
      const glitchDuration = 200 + Math.random() * 300;
      
      setTimeout(() => {
        setIsGlitching(false);
      }, glitchDuration);
    }, 10000); // Every 10 seconds

    return () => clearInterval(glitchInterval);
  }, [isVisible]);

  return (
    <div
      className={`fixed top-6 left-6 z-[40] pointer-events-none transition-opacity duration-300 ease-in-out flex items-center gap-3 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={hostRef}
        className="corner-logo"
        style={{ width: size, height: size }}
      />
      <span 
        className={`text-white text-2xl font-bold tracking-wider transition-all duration-75 ${
          isGlitching ? 'illusio-glitch-effect' : ''
        }`}
        style={{ 
          fontFamily: 'VT323, monospace',
          textShadow: isGlitching 
            ? '2px 0 0 #ff0000, -2px 0 0 #00ffff, 0 2px 0 #00ff00, 0 -2px 0 #ffff00'
            : '0 0 10px rgba(255, 255, 255, 0.5)',
          filter: isGlitching 
            ? 'hue-rotate(90deg) saturate(2) contrast(1.5)'
            : 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))',
          transform: isGlitching 
            ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`
            : 'translate(0, 0)'
        }}
      >
        ILLUSIO
      </span>
    </div>
  );
}
