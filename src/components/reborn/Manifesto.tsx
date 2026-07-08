"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import TextRevealScroll from "@/components/framer/TextRevealScroll";

/**
 * Reborn — the statement. The words light up one by one as you scroll through
 * (Framer text-reveal-scroll port), with the two accent lines drifting against
 * each other underneath (Baffait kinetic type). The hero's old "we design and
 * build SaaS" line lives here now, revealed as the second beat.
 */
export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const xLeft = useTransform(scrollYProgress, [0, 1], ["8%", "-22%"]);
  const xRight = useTransform(scrollYProgress, [0, 1], ["-12%", "16%"]);

  return (
    <section
      id="rb-statement"
      ref={ref}
      className="relative overflow-hidden border-y border-[var(--color-line)] py-[18vh]"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <TextRevealScroll
          parts={[
            {
              text: "We don't pitch decks. We build the product — websites, apps, AI features, automations and payments that actually ship — and we make it feel",
            },
            {
              text: "premium.",
              className: "font-script text-[var(--color-brass-bright)]",
            },
          ]}
          startOffset={0.85}
          endOffset={0.35}
          className="font-display max-w-3xl text-[clamp(1.6rem,3.4vw,3rem)] font-medium leading-[1.15] tracking-tight text-[var(--color-ink)]"
        />

        {/* the hero's old CTA line, re-seated here as the second beat */}
        <TextRevealScroll
          parts={[
            {
              text: "We design and build SaaS products that ship. Idea to live, in weeks.",
            },
          ]}
          startOffset={0.8}
          endOffset={0.3}
          className="mt-8 max-w-xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg"
        />
      </div>

      {/* the scrubbing accent band */}
      <div
        aria-hidden
        className="pointer-events-none mt-[10vh] flex flex-col gap-2 opacity-[0.14]"
      >
        <motion.span
          style={{ x: xLeft }}
          className="font-display whitespace-nowrap text-[clamp(3rem,11vw,10rem)] font-bold uppercase leading-none tracking-tighter text-[var(--color-ink)]"
        >
          web · apps · design · ai · automation ·
        </motion.span>
        <motion.span
          style={{ x: xRight }}
          className="font-display whitespace-nowrap text-[clamp(3rem,11vw,10rem)] font-bold uppercase leading-none tracking-tighter text-[var(--color-brass)]"
        >
          built to ship · built to last · built to ship ·
        </motion.span>
      </div>
    </section>
  );
}
