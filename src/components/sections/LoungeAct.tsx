"use client";

import { motion } from "framer-motion";
import PixelCat from "@/components/pixel/PixelCat";
import Founders from "@/components/sections/Founders";
import Marquee from "@/components/ui/Marquee";
import RippleReveal from "@/components/ui/RippleReveal";
import ParticleField from "@/components/ui/particle-field";
import GlowCard from "@/components/ui/spotlight-card";
import DealerGreeting from "@/components/ui/DealerGreeting";

/**
 * Act IV — the lounge. The story lands here: the living ASCII cat, the contact
 * line, and the sign-off. End of the scroll.
 */
export default function LoungeAct() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* stage atmosphere — rising embers + two slow spotlight cones */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ParticleField color="255, 198, 128" density={11000} />
        <span className="lounge-spot lounge-spot--l" />
        <span className="lounge-spot lounge-spot--r" />
      </div>

      <Marquee text="Two dealers · One table · Cinematic, engineered software" />

      <RippleReveal className="mx-auto max-w-4xl px-6 py-28 text-center">
        <DealerGreeting className="font-script mb-3 block text-2xl text-[var(--color-brass-bright)] sm:text-3xl" />
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

        <GlowCard
          customSize
          glowColor="orange"
          className="mt-16 !flex w-full max-w-lg flex-col items-center gap-6 !rounded-3xl !p-8"
        >
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
        </GlowCard>
      </RippleReveal>

      <footer className="flex flex-col items-center gap-2 border-t border-[var(--color-line)] px-6 py-8 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
        <span>Techuila Guys — built in the browser · ♠ ♣</span>
        <a
          href="/reborn"
          data-cursor="Reborn"
          className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-neon-amber)]"
        >
          view the reborn cut ↗
        </a>
      </footer>
    </section>
  );
}
