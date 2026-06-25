"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Reborn — the chapter rail. A fixed editorial index on the right edge that
 * lights the section you're in. Sections register by id; the rail observes them
 * and highlights the active one. Hidden on small screens.
 */
const CHAPTERS = [
  { id: "rb-hero", n: "00", label: "Table" },
  { id: "rb-statement", n: "01", label: "Statement" },
  { id: "rb-riffle", n: "02", label: "Riffle" },
  { id: "rb-deck", n: "03", label: "The Deck" },
  { id: "rb-dealers", n: "04", label: "Dealers" },
  { id: "rb-lounge", n: "05", label: "Lounge" },
];

export default function ChapterRail() {
  const [active, setActive] = useState("rb-hero");

  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Sections"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
    >
      {CHAPTERS.map((c) => {
        const on = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-label={`Go to ${c.label}`}
            aria-current={on ? "true" : undefined}
            onClick={() =>
              document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth" })
            }
            className="group pointer-events-auto flex items-center gap-3"
          >
            <span
              className={`font-display text-[10px] uppercase tracking-[0.3em] transition-all duration-300 ${
                on
                  ? "text-[var(--color-neon-amber)] opacity-100"
                  : "text-[var(--color-muted)] opacity-0 group-hover:opacity-70"
              }`}
            >
              {c.label}
            </span>
            <span className="font-mono text-[10px] text-[var(--color-faint)]">{c.n}</span>
            <motion.span
              animate={{ width: on ? 28 : 12, opacity: on ? 1 : 0.4 }}
              className="block h-px bg-[var(--color-brass)]"
            />
          </button>
        );
      })}
    </nav>
  );
}
