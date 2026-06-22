"use client";

import { motion } from "framer-motion";
import PixelCat from "@/components/pixel/PixelCat";
import Founders from "@/components/sections/Founders";
import Marquee from "@/components/ui/Marquee";

/**
 * Act IV — the lounge. The story lands here: the living ASCII cat, the contact
 * line, and the sign-off. End of the scroll.
 */
export default function LoungeAct() {
  return (
    <section className="relative">
      <Marquee text="Two dealers · One table · Cinematic, engineered software" />

      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl"
        >
          Welcome to the{" "}
          <span className="text-[var(--color-neon-amber)]">lounge.</span>
        </motion.h2>
        <p className="mx-auto mt-4 max-w-md text-[var(--color-muted)]">
          Got a hand worth playing? Pull up a chair. The cat doesn&apos;t bite —
          and we answer our email.
        </p>

        <div className="mt-14 flex flex-col items-center">
          <PixelCat />
          <Founders />
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          <motion.a
            href="mailto:info.quantumbay@gmail.com"
            data-cursor="Email"
            data-magnetic
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display rounded-full border border-[var(--color-line-warm)] px-8 py-4 text-lg uppercase tracking-[0.2em] transition-colors hover:bg-[var(--color-neon-amber)]/10"
          >
            info.quantumbay@gmail.com
          </motion.a>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-neon-amber)]">
              <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[var(--color-neon-amber)]" />
              Available 2026
            </span>
            <span>Kailosh ♠ · Keni ♣</span>
            <a
              href="https://github.com/QuantumBayKK"
              target="_blank"
              rel="noreferrer"
              data-cursor="GitHub"
              className="hover:text-[var(--color-neon-amber)]"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t border-[var(--color-line)] px-6 py-8 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
        Techuila Guys — built in the browser · ♠ ♣
      </footer>
    </section>
  );
}
