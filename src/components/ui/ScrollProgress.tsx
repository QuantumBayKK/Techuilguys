"use client";

import { useEffect, useRef } from "react";
import { onScroll } from "@/lib/scrollSignal";

/**
 * A hair-thin progress rail across the very top of the viewport. Reads the
 * shared Lenis scroll progress each frame and scales a brass→amber gradient
 * bar — a small, technical "you are here" that reinforces the smooth scroll.
 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const set = (p: number) => {
      if (bar.current)
        bar.current.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;
    };
    const fromWindow = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      set(max > 0 ? window.scrollY / max : 0);
    };
    // Lenis drives scrollSignal.progress; fall back to native scroll (e.g. when
    // Lenis is disabled under reduced-motion).
    const unsub = onScroll((s) => (s.progress ? set(s.progress) : fromWindow()));
    window.addEventListener("scroll", fromWindow, { passive: true });
    fromWindow();
    return () => {
      unsub();
      window.removeEventListener("scroll", fromWindow);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[2px] bg-transparent">
      <div
        ref={bar}
        className="scroll-rail h-full w-full"
        style={{
          transform: "scaleX(0)",
          background:
            "linear-gradient(90deg, var(--color-brass), var(--color-neon-amber))",
        }}
      />
    </div>
  );
}
