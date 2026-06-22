"use client";

import { motion } from "framer-motion";

/**
 * Act I — the cold open. A slowly turning poker chip (pure CSS 3D, zero WebGL),
 * the kinetic TECHUILA · GUYS title, and a scroll cue. No audio gate, no click:
 * the visitor just scrolls on.
 */
const TITLE = "TECHUILA".split("");

export default function TitleAct() {
  return (
    <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden text-center">
      {/* turning chip */}
      <div className="chip-stage mb-10">
        <div className="chip3d">
          <div className="chip3d__face">
            <span className="chip3d__suits">♠&nbsp;♣</span>
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="chip3d__spot"
              style={{ transform: `rotate(${i * 30}deg) translateY(clamp(-72px, -7.2vw, -50px))` }}
            />
          ))}
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9 }}
        className="font-script text-3xl text-[var(--color-brass-bright)] sm:text-4xl"
      >
        welcome to the
      </motion.p>

      <h1
        className="font-display flex overflow-hidden font-bold uppercase leading-[0.85] tracking-tight text-[var(--color-ink)]"
        style={{ fontSize: "clamp(2.75rem, 13vw, 7rem)" }}
      >
        {TITLE.map((ch, i) => (
          <span key={i} className="overflow-hidden">
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: 0.45 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-display -mt-1 text-3xl font-bold uppercase tracking-[0.3em] text-[var(--color-neon-amber)] sm:text-5xl"
        style={{ WebkitTextStroke: "1px var(--color-neon-amber)", color: "transparent" }}
      >
        Guys
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.3, duration: 0.8, ease: [0.65, 0.05, 0.36, 1] }}
        className="mt-6 flex w-56 items-center gap-3"
      >
        <span className="h-px flex-1 bg-[var(--color-line-warm)]" />
        <span className="text-[var(--color-brass)]">♠ ♣</span>
        <span className="h-px flex-1 bg-[var(--color-line-warm)]" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1.6, duration: 0.9 }}
        className="font-script mt-3 text-2xl text-[var(--color-muted)]"
      >
        a two-person software studio
      </motion.p>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-display text-[10px] uppercase tracking-[0.4em] text-[var(--color-muted)]">
          scroll to take a seat
        </span>
        <span className="scroll-cue h-8 w-px bg-gradient-to-b from-[var(--color-neon-amber)] to-transparent" />
      </motion.div>
    </section>
  );
}
