"use client";

import { useEffect, useState } from "react";

/**
 * Persistent studio wordmark, top-left. Fades in after the first scroll so it
 * never competes with the cold-open title, then stays as a quiet anchor. Click
 * returns to the top of the story.
 */
export default function Header() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      data-cursor="Top"
      data-magnetic
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`font-display fixed left-4 top-4 z-[80] flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-noir-2)]/70 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink)] backdrop-blur transition-all duration-500 hover:border-[var(--color-line-warm)] sm:left-5 sm:top-5 ${
        show ? "translate-y-0 opacity-100" : "-translate-y-3 pointer-events-none opacity-0"
      }`}
    >
      <span className="text-[var(--color-neon-amber)]">♠</span>
      Techuila&nbsp;Guys
      <span className="text-[var(--color-brass)]">♣</span>
    </button>
  );
}
