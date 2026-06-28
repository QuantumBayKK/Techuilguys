"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Reborn — the statement. Big editorial type that scrubs sideways as you pass,
 * the two accent lines drifting against each other (Baffait kinetic type).
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
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          className="font-display max-w-3xl text-[clamp(1.6rem,3.4vw,3rem)] font-medium leading-[1.15] tracking-tight text-[var(--color-ink)]"
        >
          We don&apos;t pitch decks. We build the product — websites, apps, AI
          features, automations and payments that actually ship — and we make it
          feel{" "}
          <span className="font-script text-[var(--color-brass-bright)]">
            premium.
          </span>
        </motion.p>
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
