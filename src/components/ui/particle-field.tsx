"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  fadeStart: number;
  fadingOut: boolean;
  reset: () => void;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * Drifting motes of light on a 2D canvas — the particle technique lifted from
 * the 21st.dev ParticleHero, re-tuned for the saloon: warm embers rising
 * through the room instead of cold white stars. Cheap (no WebGL), fills its
 * positioned parent, and goes still under reduced-motion.
 */
export default function ParticleField({
  color = "255, 200, 130",
  density = 9000,
  className = "",
}: {
  /** "r, g, b" string for the mote color. */
  color?: string;
  /** Higher = fewer particles (one per `density` px²). */
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const make = (): Particle => {
      const p: Particle = {
        x: 0,
        y: 0,
        speed: 0,
        opacity: 1,
        fadeStart: 0,
        fadingOut: false,
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.speed = Math.random() / 4 + 0.08;
          this.opacity = 1;
          this.fadeStart = performance.now() + Math.random() * 600 + 100;
          this.fadingOut = false;
        },
        update() {
          this.y -= this.speed;
          if (this.y < 0) this.reset();
          if (!this.fadingOut && performance.now() > this.fadeStart) this.fadingOut = true;
          if (this.fadingOut) {
            this.opacity -= 0.008;
            if (this.opacity <= 0) this.reset();
          }
        },
        draw(c) {
          c.fillStyle = `rgba(${color}, ${this.opacity})`;
          c.fillRect(this.x, this.y, 0.5, Math.random() * 2 + 1);
        },
      };
      p.reset();
      p.y = Math.random() * canvas.height;
      return p;
    };

    const init = () => {
      const count = Math.floor((canvas.width * canvas.height) / density);
      particlesRef.current = Array.from({ length: count }, make);
    };

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      init();
    };

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        p.update();
        p.draw(ctx);
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    resize();
    if (reduced) {
      // paint one static frame, no loop
      for (const p of particlesRef.current) p.draw(ctx);
    } else {
      frame();
    }

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [color, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
