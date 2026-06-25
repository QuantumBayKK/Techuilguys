"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "@/lib/audio";

/**
 * #87 — suit shortcuts. Tap a key to jump tables: T(able), S(pades→deck),
 * H(earts→the tell), D(iamonds→dealers), C(lubs→lounge). Shows a one-time hint
 * card the first few seconds, then gets out of the way.
 */
const MAP: Record<string, string> = {
  t: "rb-hero",
  s: "rb-riffle",
  w: "rb-deck",
  h: "rb-tell",
  d: "rb-dealers",
  c: "rb-lounge",
};

export default function SuitShortcuts() {
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const id = MAP[e.key.toLowerCase()];
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
      audio.play("chip");
      setHint(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => setHint(false), 6500);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ delay: 1.6 }}
          className="pointer-events-none fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--color-line-warm)] bg-[var(--color-noir-2)]/70 px-4 py-1.5 backdrop-blur-md lg:flex"
        >
          <span className="font-display text-[9px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
            jump tables
          </span>
          {[
            ["S", "♠"],
            ["H", "♥"],
            ["D", "♦"],
            ["C", "♣"],
          ].map(([k, s]) => (
            <span key={k} className="flex items-center gap-1 text-[11px]">
              <kbd className="rounded border border-[var(--color-line)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-brass)]">
                {k}
              </kbd>
              <span className="text-[var(--color-neon-amber)]">{s}</span>
            </span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
