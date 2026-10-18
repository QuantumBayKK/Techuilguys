"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrowserFrame from "./BrowserFrame";
import { WORK, hostOf } from "@/content/work";

const DWELL = 5000;

/**
 * The hero's proof: our live products, cycling in a browser frame. Auto-advances
 * every few seconds, pauses while hovered or focused, and the tabs below are the
 * manual control. Reduced motion → no auto-advance, tabs only.
 */
export default function HeroShowcase() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = WORK[index];

  const next = useCallback(() => setIndex((i) => (i + 1) % WORK.length), []);

  useEffect(() => {
    if (reduce || paused) return;
    const t = window.setTimeout(next, DWELL);
    return () => window.clearTimeout(t);
  }, [index, paused, reduce, next]);

  return (
    <div
      className="frame-in"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link
        href={`/work/${active.slug}`}
        aria-label={`${active.name} case study`}
        className="group block rounded-2xl"
      >
        <BrowserFrame host={hostOf(active.live)}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={active.slug}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={active.image}
                alt={`${active.name} homepage`}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 680px, 100vw"
                className="object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-ink/85 px-3 py-1.5 text-sm text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
            Read the {active.name} case study
          </span>
        </BrowserFrame>
      </Link>

      <div role="tablist" aria-label="Products we've shipped" className="mt-2 grid grid-cols-5 gap-3 sm:mt-5">
        {WORK.map((w, i) => {
          const on = i === index;
          return (
            <button
              key={w.slug}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setIndex(i)}
              aria-label={w.name}
              className="group/tab py-3 text-left sm:py-0"
            >
              <span className="block h-[2px] overflow-hidden rounded-full bg-ink/12">
                <span
                  key={on ? `${w.slug}-${index}` : w.slug}
                  style={{ ["--dur" as string]: `${DWELL}ms` }}
                  className={`tab-progress block h-full bg-ink ${
                    on ? (reduce ? "is-running" : `is-running ${paused ? "is-paused" : ""}`) : ""
                  }`}
                />
              </span>
              <span
                className={`mt-2 hidden truncate text-sm transition-colors sm:block ${
                  on ? "text-ink" : "text-muted group-hover/tab:text-ink"
                }`}
              >
                {w.name}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-sm sm:hidden">
        {active.name} <span className="text-muted">— {active.sector}</span>
      </p>
    </div>
  );
}
