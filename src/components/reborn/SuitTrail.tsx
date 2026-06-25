"use client";

import { useEffect, useRef } from "react";

/**
 * Tiny ♠♣♥♦ glyphs that spit out behind the cursor and float up as they fade.
 * Canvas-based (cheap), fine-pointer only, and silent under reduced-motion.
 */
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; ch: string; rot: number; vr: number; size: number };

const SUITS = ["♠", "♣", "♥", "♦"];

export default function SuitTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ps: P[] = [];
    let lastX = 0;
    let lastY = 0;
    let lastSpawn = 0;
    let i = 0;

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.hypot(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
      // spawn rate scales with cursor speed, throttled
      if (now - lastSpawn < 28 || speed < 2) return;
      lastSpawn = now;
      ps.push({
        x: e.clientX,
        y: e.clientY,
        vx: dx * 0.05 + (Math.random() - 0.5) * 0.4,
        vy: dy * 0.05 - 0.3 - Math.random() * 0.4,
        life: 0,
        max: 700 + Math.random() * 500,
        ch: SUITS[i % 4],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.04,
        size: 9 + Math.random() * 7,
      });
      i++;
      if (ps.length > 90) ps.splice(0, ps.length - 90);
    };

    let raf = 0;
    let prev = performance.now();
    const frame = (now: number) => {
      const dt = now - prev;
      prev = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let k = ps.length - 1; k >= 0; k--) {
        const p = ps[k];
        p.life += dt;
        if (p.life >= p.max) {
          ps.splice(k, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.004 * dt; // slight gravity reversal so they drift up then settle
        p.rot += p.vr;
        const t = p.life / p.max;
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        const red = p.ch === "♥" || p.ch === "♦";
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, alpha) * 0.8;
        ctx.fillStyle = red ? "#ff9d2f" : "#c9a24b";
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] hidden h-full w-full sm:block"
    />
  );
}
