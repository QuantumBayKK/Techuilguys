"use client";

import { AnimatePresence, motion } from "framer-motion";
import { experience, useExperience } from "@/lib/experience";
import { audio } from "@/lib/audio";
import { useCapability } from "@/lib/useCapability";

/**
 * Entry gate = a Cowboy-Bebop-flavoured kinetic title sequence + the audio
 * unlock. Color-card wipes, masked letter reveals, cursive accents. Tapping
 * unlocks audio and starts the cinematic (or snaps to the table on reduced
 * motion). The spinning chip lives in the WebGL layer behind this.
 */

const TITLE = "TECHUILA";

export default function EntryGate() {
  const { stage } = useExperience();
  const cap = useCapability();

  const enter = () => {
    audio.unlock();
    audio.play("chip");
    experience.set({ stage: cap.reducedMotion ? "dealers" : "intro" });
  };

  return (
    <AnimatePresence>
      {stage === "gate" && (
        <motion.div
          key="gate"
          initial={{ opacity: 1 }}
          exit={{
            clipPath: "inset(0 0 100% 0)",
            transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-noir)]/55 via-[var(--color-noir)]/5 to-[var(--color-noir)]/80" />

          {/* Bebop color-card wipes on load */}
          {!cap.reducedMotion &&
            ["var(--color-neon-amber)", "var(--color-felt)", "var(--color-noir-2)"].map(
              (c, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 1 }}
                  animate={{ scaleY: 0 }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.76, 0, 0.24, 1] }}
                  style={{ background: c, transformOrigin: i % 2 ? "top" : "bottom" }}
                  className="absolute inset-0 z-30"
                />
              )
            )}

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* cursive overline */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.9 }}
              className="font-script text-3xl text-[var(--color-brass-bright)] sm:text-4xl"
            >
              welcome to the
            </motion.p>

            {/* masked letter reveal */}
            <h1 className="font-display flex overflow-hidden text-6xl font-bold uppercase leading-[0.85] tracking-tight text-[var(--color-ink)] sm:text-8xl">
              {TITLE.split("").map((ch, i) => (
                <span key={i} className="overflow-hidden">
                  <motion.span
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      delay: 1.15 + i * 0.06,
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
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
              transition={{ delay: 1.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display -mt-1 text-3xl font-bold uppercase tracking-[0.3em] text-[var(--color-neon-amber)] sm:text-5xl"
              style={{ WebkitTextStroke: "1px var(--color-neon-amber)", color: "transparent" }}
            >
              Guys
            </motion.div>

            {/* suit rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 2, duration: 0.8, ease: [0.65, 0.05, 0.36, 1] }}
              className="mt-6 flex w-56 items-center gap-3"
            >
              <span className="h-px flex-1 bg-[var(--color-line-warm)]" />
              <span className="text-[var(--color-brass)]">♠ ♣</span>
              <span className="h-px flex-1 bg-[var(--color-line-warm)]" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 2.2, duration: 0.8 }}
              className="font-script mt-3 text-2xl text-[var(--color-muted)]"
            >
              tech you can drink to
            </motion.p>

            <motion.button
              data-cursor="Enter"
              data-magnetic
              onClick={enter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.8 }}
              className="group relative mt-12 flex items-center gap-3 rounded-full border border-[var(--color-line-warm)] px-8 py-3"
            >
              <span className="absolute inset-0 rounded-full bg-[var(--color-neon-amber)]/0 transition-colors duration-300 group-hover:bg-[var(--color-neon-amber)]/12" />
              <span className="relative h-2 w-2 animate-pulse rounded-full bg-[var(--color-neon-amber)]" />
              <span className="relative font-display text-sm uppercase tracking-[0.4em] text-[var(--color-ink)]">
                Tap to enter
              </span>
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: 3, duration: 1 }}
              className="mt-5 text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]"
            >
              Sound on · headphones recommended · a short cinematic plays
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
