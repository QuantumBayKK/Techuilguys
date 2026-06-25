"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Reborn — the curtain. On load a small deck riffles/shuffles in the centre, the
 * wordmark settles, then the curtain lifts to reveal the room. Locks scroll
 * while present; collapses to a quick flash (static stack) under reduced-motion.
 */
const DECK = 9;
const SUITS = ["♠", "♣", "♥", "♦"];

export default function RebornIntro() {
  const [gone, setGone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => setGone(true), r ? 400 : 2100);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (gone) document.body.style.overflow = "";
  }, [gone]);

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[130] flex flex-col items-center justify-center gap-10 bg-[var(--color-noir)]"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* shuffling deck */}
          <div
            className="relative h-[140px] w-[110px]"
            style={{ perspective: "700px" }}
          >
            {Array.from({ length: DECK }).map((_, i) => {
              const toRight = i % 2 === 0;
              const red = i % 4 >= 2;
              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 h-[112px] w-[80px] rounded-[8px] border border-[var(--color-brass)]/50 bg-gradient-to-br from-[#17120b] via-[#0e0b07] to-[#070504] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.8)]"
                  style={{ marginLeft: -40, marginTop: -56 }}
                  initial={{ x: 0, y: -i * 1.2, rotate: 0, opacity: i === 0 ? 1 : 0.96 }}
                  animate={
                    reduced
                      ? { x: 0, y: -i * 1.2, rotate: (i - DECK / 2) * 1.5 }
                      : {
                          x: [0, toRight ? 96 : -96, toRight ? 70 : -70, 0, 0],
                          y: [-i * 1.2, -36 - i * 2, -10, -i * 1.2, -i * 1.2],
                          rotate: [0, toRight ? 16 : -16, toRight ? 8 : -8, 0, 0],
                        }
                  }
                  transition={
                    reduced
                      ? { duration: 0.4 }
                      : {
                          duration: 1.25,
                          times: [0, 0.32, 0.6, 0.85, 1],
                          ease: [0.65, 0, 0.35, 1],
                          repeat: Infinity,
                          repeatDelay: 0.15,
                          delay: i * 0.05,
                        }
                  }
                >
                  <span className="pointer-events-none absolute inset-[5px] rounded-[5px] border border-[var(--color-brass)]/15" />
                  <span
                    className="font-display absolute inset-0 grid place-items-center text-2xl"
                    style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
                  >
                    {SUITS[i % SUITS.length]}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="font-script text-2xl text-[var(--color-brass-bright)] sm:text-3xl">
              welcome to the table
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)] sm:text-5xl">
              Techuila <span className="text-[var(--color-neon-amber)]">Guys</span>
            </h1>
            <p className="font-display mt-4 text-[10px] uppercase tracking-[0.5em] text-[var(--color-muted)]">
              shuffling the deck<span className="loading-dots" />
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
