"use client";

import { useEffect, useRef } from "react";

/**
 * Reborn ambience — a soft pool of warm light that trails the cursor across the
 * whole room, so the background feels lit by where you're looking. Fixed,
 * pointer-events-none, fine-pointer only. Updates CSS vars on pointermove (no
 * rAF). Hidden under reduced-motion / touch.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const el = ref.current;
    if (!el) return;
    el.style.opacity = "1";

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 -z-[4] opacity-0 transition-opacity duration-1000"
      style={{ willChange: "transform" }}
    >
      <div
        className="-translate-x-1/2 -translate-y-1/2"
        style={{
          width: "46rem",
          height: "46rem",
          background:
            "radial-gradient(circle, rgba(255,176,90,0.10), rgba(255,157,47,0.05) 35%, transparent 68%)",
        }}
      />
    </div>
  );
}
