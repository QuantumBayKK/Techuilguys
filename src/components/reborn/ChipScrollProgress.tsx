"use client";

import { useEffect, useState } from "react";

/**
 * #82 — scroll progress as a growing chip stack instead of a bar. The stack
 * climbs as you read; the top chip carries the percentage. Fixed bottom-left,
 * desktop only, pointer-events-none.
 */
const MAX = 12;

export default function ChipScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const lit = Math.max(1, Math.round(p * MAX));

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-5 left-5 z-40 hidden flex-col-reverse items-center gap-[2px] lg:flex"
    >
      <span className="mt-1 font-mono text-[9px] tracking-widest text-[var(--color-brass)]">
        {Math.round(p * 100)}
      </span>
      {Array.from({ length: MAX }).map((_, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            className="h-[5px] w-9 rounded-full transition-all duration-300"
            style={{
              background: on
                ? i % 2 === 0
                  ? "var(--color-neon-amber)"
                  : "var(--color-brass)"
                : "rgba(201,162,75,0.12)",
              transform: `translateX(${on ? (i % 2 === 0 ? -1 : 1) : 0}px)`,
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
