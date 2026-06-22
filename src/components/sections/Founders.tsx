"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DEALERS, type Dealer } from "@/data/dealers";
import { handFor } from "@/data/projects";
import { audio } from "@/lib/audio";

/**
 * "Ask the cat about the founders." A button beside the lounge cat that, when
 * tapped, has the cat introduce the two people behind the table — portrait,
 * suit, bio, focus areas, ship count and GitHub. Closes on Escape / backdrop.
 */
export default function Founders() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        data-cursor="Ask"
        data-magnetic
        onClick={() => {
          audio.play("select");
          setOpen(true);
        }}
        className="font-display group mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-line-warm)] px-6 py-3 text-[12px] uppercase tracking-[0.25em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-neon-amber)]/10"
      >
        <span className="text-[var(--color-neon-amber)] transition-transform group-hover:-rotate-12">
          🐾
        </span>
        Ask me about the founders
        <span className="text-[var(--color-brass)]">♠ ♣</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="founders"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[96] flex items-center justify-center p-4"
          >
            <button
              aria-label="Close"
              data-cursor="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[var(--color-noir)]/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.92, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              className="relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--color-line-warm)] bg-[var(--color-noir-2)]/80 p-6 backdrop-blur-md sm:p-8"
            >
              {/* the cat's intro line */}
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">🐱</span>
                <p className="font-script text-xl text-[var(--color-brass-bright)] sm:text-2xl">
                  &ldquo;Two dealers run this table. Let me introduce them…&rdquo;
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {DEALERS.map((d, i) => (
                  <FounderCard key={d.id} dealer={d} delay={i * 0.08} />
                ))}
              </div>

              <button
                data-cursor="Close"
                onClick={() => setOpen(false)}
                className="font-display mt-6 w-full rounded-full border border-[var(--color-line)] py-3 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-neon-amber)]"
              >
                ← back to the lounge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FounderCard({ dealer, delay }: { dealer: Dealer; delay: number }) {
  const shipped = handFor(dealer.id).length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay, duration: 0.5 }}
      className="flex flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-noir)]/40 p-5"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--color-brass)]/40">
          <Image
            src={dealer.portrait}
            alt={dealer.name}
            fill
            sizes="64px"
            className="object-cover"
            style={{ filter: "contrast(1.05) saturate(1.05)" }}
          />
        </div>
        <div>
          <p className="font-display text-xl font-bold uppercase tracking-tight text-[var(--color-neon-amber)]">
            {dealer.name} <span className="text-[var(--color-brass)]">{dealer.suit}</span>
          </p>
          <p className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-brass)]">
            {dealer.rank} · {shipped} cards in hand
          </p>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-ink)]/85">
        {dealer.bio}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {dealer.focus.map((f) => (
          <span
            key={f}
            className="rounded-full border border-[var(--color-line-warm)] bg-[var(--color-neon-amber)]/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-ink)]"
          >
            {f}
          </span>
        ))}
      </div>

      <a
        href={dealer.github}
        target="_blank"
        rel="noreferrer"
        data-cursor="GitHub"
        data-magnetic
        className="font-display mt-5 inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-neon-amber)]"
      >
        GitHub ↗
      </a>
    </motion.div>
  );
}
