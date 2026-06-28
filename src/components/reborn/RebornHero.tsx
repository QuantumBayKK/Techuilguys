"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ShaderBackdrop from "@/components/ui/ShaderBackdrop";

/**
 * Reborn — Act 0. A full-bleed shader field under a slab of kinetic type.
 * Editorial/cinematic (Baffait), with the poker identity kept to a whisper:
 * the suits ride the eyebrow, nothing more. Headline parallaxes out on scroll.
 *
 * Reveal timings are offset by INTRO so the type wipes up AS the curtain
 * (RebornIntro, ~1.5s) lifts, instead of playing hidden behind it.
 */
const LINE_ONE = "TECHUILA";
const LINE_TWO = "GUYS";
const INTRO = 1.9;

export default function RebornHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(8px)"]);

  return (
    <section
      id="rb-hero"
      ref={ref}
      className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden"
    >
      {/* warped shader field — gated off on phones / reduced-motion */}
      <ShaderBackdrop
        shape="warp"
        type="8x8"
        colorBack="#0a0907"
        colorFront="#2c1c0b"
        pxSize={2}
        speed={0.42}
        opacity={0.65}
        className="-z-10"
      />
      {/* warm key light from the top, like a lamp over the table */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 50% at 50% -10%, rgba(255,176,90,0.16), transparent 60%)",
        }}
      />

      {/* top meta row */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: INTRO + 0.1, duration: 0.9 }}
        className="font-display flex items-center justify-between px-6 pt-[12vh] text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)] sm:px-10"
      >
        <span>Studio · cinematic software</span>
        <span className="hidden sm:inline">♠ ♣</span>
        <span>Est. 2026</span>
      </motion.div>

      {/* headline */}
      <motion.div
        style={{ y, opacity: fade, filter: blur }}
        className="px-6 sm:px-10"
      >
        <Headline text={LINE_ONE} delay={INTRO + 0.1} />
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-[3vw]">
          <Headline text={LINE_TWO} delay={INTRO + 0.25} />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.7, duration: 1 }}
            className="max-w-sm text-sm leading-relaxed text-[var(--color-muted)] sm:mb-[1.6vw] sm:text-base"
          >
            We design and build SaaS products that ship — websites, apps, AI
            features, automations and payments. Idea to live, in weeks.
          </motion.p>
        </div>
      </motion.div>

      {/* bottom row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO + 0.9, duration: 1 }}
        className="flex items-end justify-between px-6 pb-[6vh] sm:px-10"
      >
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
          <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[var(--color-neon-amber)]" />
          Available 2026
        </div>
        <div className="font-display flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-[var(--color-brass)]">
          Scroll
          <span className="scroll-cue h-10 w-px bg-[var(--color-line-warm)]" />
        </div>
        <div className="hidden text-right text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)] sm:block">
          Six works
          <br />
          Two hands
        </div>
      </motion.div>
    </section>
  );
}

/** A single slab line whose letters wipe up from a clipped baseline. */
function Headline({ text, delay }: { text: string; delay: number }) {
  return (
    <h1 className="font-display m-0 select-none text-[clamp(3.2rem,17vw,15rem)] font-bold uppercase leading-[0.82] tracking-[-0.03em] text-[var(--color-ink)]">
      <span className="inline-flex overflow-hidden pb-[0.06em]">
        {text.split("").map((ch, i) => (
          <motion.span
            key={`${ch}-${i}`}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
              delay: delay + i * 0.04,
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block"
          >
            {ch}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}
