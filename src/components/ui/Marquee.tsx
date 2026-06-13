"use client";

import { useEffect, useRef } from "react";
import { onScroll } from "@/lib/scrollSignal";

/** Brand marquee whose speed reacts to scroll velocity. */
export default function Marquee({ text }: { text: string }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = 0;
    let extra = 0;
    let raf = 0;
    const unsub = onScroll((s) => {
      extra = s.velocity * 8;
    });
    const loop = () => {
      x -= 0.6 + Math.abs(extra);
      const w = (track.current?.scrollWidth ?? 0) / 2;
      if (w && -x > w) x += w;
      if (track.current) track.current.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, []);

  const item = (
    <span className="font-display mx-6 text-[var(--color-brass)]/70">
      {text} <span className="text-[var(--color-neon-amber)]">♠</span>
    </span>
  );

  return (
    <div className="overflow-hidden border-y border-[var(--color-line)] py-4">
      <div
        ref={track}
        className="flex w-max whitespace-nowrap text-2xl uppercase tracking-[0.2em] sm:text-4xl"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}
