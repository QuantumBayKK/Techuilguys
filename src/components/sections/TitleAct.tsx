"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCapability } from "@/lib/useCapability";

/**
 * Act I — the cold open. On capable, motion-OK devices a real 3D poker chip
 * spins up, shatters and reforms into the two dealer cards (IntroChip3D). On
 * reduced-motion / no-WebGL it falls back to the pure-CSS turning chip. The
 * kinetic wordmark + scroll cue sit beneath either one.
 */
const IntroChip3D = dynamic(() => import("@/components/three/IntroChip3D"), {
  ssr: false,
});

const TITLE = "TECHUILA".split("");

export default function TitleAct() {
  const cap = useCapability();
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(
        !!(
          window.WebGLRenderingContext &&
          (c.getContext("webgl") || c.getContext("experimental-webgl"))
        )
      );
    } catch {
      setWebgl(false);
    }
  }, []);

  const use3D = cap.ready && webgl && !cap.reducedMotion;

  return (
    <section className="relative flex h-screen flex-col overflow-hidden text-center">
      {/* the hero stage — 3D chip→cards, or the CSS chip fallback */}
      <div className="relative flex-1">
        {use3D ? (
          <div className="absolute inset-0">
            <IntroChip3D />
          </div>
        ) : (
          <CssChip />
        )}

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="font-script absolute left-1/2 top-[12%] -translate-x-1/2 text-3xl text-[var(--color-brass-bright)] sm:text-4xl"
        >
          welcome to the
        </motion.p>
      </div>

      {/* wordmark + studio line + scroll cue */}
      <div className="relative z-10 flex flex-col items-center pb-10">
        <h1
          className="font-display flex overflow-hidden font-bold uppercase leading-[0.85] tracking-tight text-[var(--color-ink)]"
          style={{ fontSize: "clamp(2.5rem, 11vw, 6rem)" }}
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
          className="font-display -mt-1 text-2xl font-bold uppercase tracking-[0.3em] text-[var(--color-neon-amber)] sm:text-4xl"
          style={{ WebkitTextStroke: "1px var(--color-neon-amber)", color: "transparent" }}
        >
          Guys
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.3, duration: 0.8, ease: [0.65, 0.05, 0.36, 1] }}
          className="mt-4 flex w-52 items-center gap-3"
        >
          <span className="h-px flex-1 bg-[var(--color-line-warm)]" />
          <span className="text-[var(--color-brass)]">♠ ♣</span>
          <span className="h-px flex-1 bg-[var(--color-line-warm)]" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.6, duration: 0.9 }}
          className="font-script mt-2 text-xl text-[var(--color-muted)]"
        >
          a two-person software studio
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2.2, duration: 1 }}
          className="mt-5 flex flex-col items-center gap-2"
        >
          <span className="font-display text-[10px] uppercase tracking-[0.4em] text-[var(--color-muted)]">
            scroll to take a seat
          </span>
          <span className="scroll-cue h-8 w-px bg-gradient-to-b from-[var(--color-neon-amber)] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

/** Pure-CSS turning chip — the reduced-motion / no-WebGL fallback. */
function CssChip() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="chip-stage">
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
    </div>
  );
}
