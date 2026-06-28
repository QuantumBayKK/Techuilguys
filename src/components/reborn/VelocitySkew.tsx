"use client";

import { useEffect, useRef } from "react";
import { onScroll } from "@/lib/scrollSignal";

/**
 * Reborn — the whole frame leans into scroll velocity. Wraps content and
 * applies a tiny skewY proportional to how fast you're scrolling, eased back to
 * flat when you stop. Subtle on purpose. Disabled under reduced-motion.
 */
export default function VelocitySkew({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // skip on touch/mobile — it reads as jank, not polish, on a phone
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;

    let target = 0;
    let current = 0;
    let raf = 0;

    const unsub = onScroll((s) => {
      // clamp the influence so it never gets seasick
      target = Math.max(-2.2, Math.min(2.2, s.velocity * 0.9));
    });

    const loop = () => {
      current += (target - current) * 0.08;
      target *= 0.9; // bleed back to flat when scrolling stops
      el.style.transform = `skewY(${current.toFixed(3)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      if (el) el.style.transform = "";
    };
  }, []);

  return (
    <div ref={ref} className="will-change-transform">
      {children}
    </div>
  );
}
