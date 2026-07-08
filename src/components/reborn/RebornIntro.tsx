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
          {/* shuffling deck + the room reacting to it */}
          <div
            className="relative h-[140px] w-[110px]"
            style={{ perspective: "700px" }}
          >
            {!reduced && <ShuffleAura />}
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

/**
 * The background answering the shuffle. Every layer runs on the same 1.4s
 * clock as the card cycle (1.25s riffle + 0.15s rest), so the room breathes
 * WITH the deck instead of idling behind it:
 *  — a table glow that flares as the cards fan out (peak ≈ t 0.29) and gives a
 *    second soft thump when they snap back together (≈ t 0.76),
 *  — a shockwave ring on the fan-out and a tighter one on the snap,
 *  — air-gust streaks flung left and right exactly when the cards fly,
 *  — the four suits glinting in the dark on the beat,
 *  — a floor shadow that widens under the spread.
 */
const CYCLE = 1.25 + 0.15;
const BEAT = { duration: CYCLE, repeat: Infinity, ease: "easeInOut" as const };

function ShuffleAura() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {/* table glow — flare on the fan, thump on the snap */}
      <motion.span
        className="absolute rounded-full"
        style={{
          width: 340,
          height: 340,
          left: -170,
          top: -170,
          background:
            "radial-gradient(circle, rgba(255,157,47,0.22), rgba(255,157,47,0.07) 45%, transparent 70%)",
        }}
        animate={{ opacity: [0.3, 1, 0.45, 0.75, 0.3], scale: [1, 1.28, 1.04, 1.14, 1] }}
        transition={{ ...BEAT, times: [0, 0.29, 0.55, 0.76, 1] }}
      />

      {/* shockwave rings — one on the fan-out, a tighter one on the snap */}
      <motion.span
        className="absolute rounded-full border border-[var(--color-neon-amber)]/40"
        style={{ width: 150, height: 150, left: -75, top: -75 }}
        animate={{ scale: [0.4, 0.4, 2.6, 2.9], opacity: [0, 0.55, 0, 0] }}
        transition={{ ...BEAT, ease: "easeOut", times: [0, 0.29, 0.8, 1] }}
      />
      <motion.span
        className="absolute rounded-full border border-[var(--color-brass)]/50"
        style={{ width: 110, height: 110, left: -55, top: -55 }}
        animate={{ scale: [0.35, 0.35, 1.9], opacity: [0, 0.5, 0] }}
        transition={{ ...BEAT, ease: "easeOut", times: [0, 0.76, 1] }}
      />

      {/* air gusts — streaks flung outward as the cards fly to each side */}
      {[
        { y: -34, len: 74, dir: 1, t: 0.06 },
        { y: -6, len: 110, dir: 1, t: 0.1 },
        { y: 26, len: 84, dir: 1, t: 0.14 },
        { y: -22, len: 96, dir: -1, t: 0.08 },
        { y: 8, len: 120, dir: -1, t: 0.12 },
        { y: 38, len: 70, dir: -1, t: 0.16 },
      ].map((g, i) => (
        <motion.span
          key={i}
          className="absolute h-px rounded-full"
          style={{
            top: g.y,
            left: g.dir === 1 ? 30 : undefined,
            right: g.dir === -1 ? 30 : undefined,
            width: g.len,
            transformOrigin: g.dir === 1 ? "left center" : "right center",
            background: `linear-gradient(${g.dir === 1 ? 90 : 270}deg, rgba(255,200,130,0.7), transparent)`,
          }}
          animate={{
            x: [0, 0, g.dir * (g.len + 46), g.dir * (g.len + 46)],
            opacity: [0, 0.8, 0, 0],
            scaleX: [0.2, 1, 0.35, 0.35],
          }}
          transition={{ ...BEAT, ease: "easeOut", times: [g.t, 0.3, 0.62, 1] }}
        />
      ))}

      {/* the suits glinting in the dark on the beat */}
      {[
        { x: -120, y: -96, s: "♠", d: 0 },
        { x: 118, y: -72, s: "♥", d: 0.12 },
        { x: -132, y: 64, s: "♦", d: 0.2 },
        { x: 126, y: 92, s: "♣", d: 0.06 },
      ].map((g) => (
        <motion.span
          key={g.s}
          className="font-display absolute text-lg"
          style={{ left: g.x, top: g.y, color: "var(--color-brass)" }}
          animate={{ opacity: [0.08, 0.5, 0.08], y: [0, -6, 0], scale: [1, 1.15, 1] }}
          transition={{ ...BEAT, times: [0, 0.32, 1], delay: g.d }}
        >
          {g.s}
        </motion.span>
      ))}

      {/* floor shadow widening under the spread */}
      <motion.span
        className="absolute rounded-[50%]"
        style={{
          top: 86,
          left: -75,
          width: 150,
          height: 16,
          background: "radial-gradient(closest-side, rgba(0,0,0,0.65), transparent)",
        }}
        animate={{ scaleX: [1, 1.9, 1.15, 1.35, 1], opacity: [0.5, 0.85, 0.55, 0.7, 0.5] }}
        transition={{ ...BEAT, times: [0, 0.29, 0.55, 0.76, 1] }}
      />
    </div>
  );
}
