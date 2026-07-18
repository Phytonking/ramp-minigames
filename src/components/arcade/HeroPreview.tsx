"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

/**
 * Live canvas preview — an abstract of Spend Sort: tasks stream down and get
 * routed into three cost-tier bins. "Show the real artifact," per DESIGN.md.
 * DPR-aware, rAF-driven, cleans up, and renders a single static frame under
 * prefers-reduced-motion.
 */

const COLORS = {
  bg: "#0b0b0c",
  card: "#1a1a1d",
  border: "#2a2a2e",
  muted: "#9a9a9f",
  solar: "#e4f222",
};

type Chip = {
  col: number; // 0..2
  born: number; // ms
  dur: number; // ms travel time
  solar: boolean;
};

export function HeroPreview({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const chips: Chip[] = [];
    let lastSpawn = 0;
    let raf = 0;
    const start = performance.now();

    const binGeom = () => {
      const pad = Math.max(24, width * 0.08);
      const usable = width - pad * 2;
      const gap = 16;
      const binW = (usable - gap * 2) / 3;
      const binH = 14;
      const binY = height - 34;
      const xs = [0, 1, 2].map((i) => pad + i * (binW + gap));
      return { xs, binW, binH, binY };
    };

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const drawFrame = (now: number) => {
      const t = now - start;
      const { xs, binW, binH, binY } = binGeom();

      ctx.clearRect(0, 0, width, height);

      // bins
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = COLORS.card;
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        roundRect(ctx, xs[i], binY, binW, binH, 4);
        ctx.fill();
        ctx.stroke();
      }

      for (let i = chips.length - 1; i >= 0; i--) {
        const c = chips[i];
        const p = (now - c.born) / c.dur;
        if (p >= 1) {
          chips.splice(i, 1);
          continue;
        }
        const e = easeOut(p);
        const targetX = xs[c.col] + binW / 2;
        const startX = width / 2;
        const x = startX + (targetX - startX) * e;
        const y = 22 + (binY - 22) * e;
        const size = 9;
        const alpha = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = c.solar ? COLORS.solar : COLORS.muted;
        roundRect(ctx, x - size / 2, y - size / 2, size, size, 2.5);
        ctx.fill();
        // faint trail
        ctx.globalAlpha = alpha * 0.18;
        roundRect(ctx, x - size / 2, y - size / 2 - 10, size, 8, 2.5);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // source node
      ctx.fillStyle = COLORS.border;
      roundRect(ctx, width / 2 - 16, 12, 32, 8, 3);
      ctx.fill();
    };

    if (reduce) {
      // Static, balanced frame.
      chips.push(
        { col: 0, born: start - 700, dur: 1600, solar: false },
        { col: 1, born: start - 1100, dur: 1600, solar: true },
        { col: 2, born: start - 400, dur: 1600, solar: false }
      );
      drawFrame(start + 900);
      return () => ro.disconnect();
    }

    const loop = (now: number) => {
      if (now - lastSpawn > 620 && chips.length < 9) {
        lastSpawn = now;
        chips.push({
          col: Math.floor(Math.random() * 3),
          born: now,
          dur: 1500 + Math.random() * 500,
          solar: Math.random() < 0.28,
        });
      }
      drawFrame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      role="presentation"
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
