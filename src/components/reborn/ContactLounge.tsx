"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ParticleField from "@/components/ui/particle-field";
import PixelCat from "@/components/pixel/PixelCat";
import ChipStack from "@/components/reborn/ChipStack";
import DealerGreeting from "@/components/ui/DealerGreeting";
import TheRiver from "@/components/reborn/TheRiver";
import NeonSign from "@/components/reborn/NeonSign";

/**
 * Reborn — the close. Embers and two stage-light cones under an oversized
 * "deal us in" call, the house cat keeping the seat warm. End of the scroll.
 */
export default function ContactLounge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["20%", "0%"]);

  return (
    <section
      id="rb-lounge"
      ref={ref}
      className="relative isolate overflow-hidden border-t border-[var(--color-line)] pt-[16vh]"
    >
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ParticleField color="255, 198, 128" density={10000} />
        <span className="lounge-spot lounge-spot--l" />
        <span className="lounge-spot lounge-spot--r" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
        {/* #59 — the bar's neon sign, buzzing */}
        <NeonSign />

        {/* the river completes the hand → the way in */}
        <TheRiver />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--color-brass)]"
        >
          Royal flush. Your move.
        </motion.p>

        {/* #94/#100 — time + return-aware dealer greeting, handwritten */}
        <DealerGreeting className="font-ink mt-2 block text-xl text-[var(--color-brass-bright)]/85" />

        <motion.a
          href="mailto:info.quantumbay@gmail.com"
          data-cursor="Email"
          data-magnetic
          onMouseEnter={() =>
            window.dispatchEvent(new CustomEvent("ace:react", { detail: "happy" }))
          }
          style={{ y }}
          className="misprint font-display mx-auto mt-6 block text-[clamp(2.6rem,13vw,11rem)] font-bold uppercase leading-[0.85] tracking-[-0.02em] text-[var(--color-ink)] transition-colors hover:text-[var(--color-neon-amber)]"
        >
          Deal us
          <br />
          in<span className="text-[var(--color-neon-amber)]">.</span>
        </motion.a>

        {/* #10 — the pot: two uneven chip stacks on the felt */}
        <div className="mt-10 flex items-end justify-center gap-3">
          <ChipStack seed="pot-a" count={6} />
          <ChipStack seed="pot-b" count={9} color="var(--color-brass-bright)" />
          <ChipStack seed="pot-c" count={4} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-neon-amber)]">
            <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[var(--color-neon-amber)]" />
            Available 2026
          </span>
          <a href="mailto:info.quantumbay@gmail.com" className="hover:text-[var(--color-neon-amber)]">
            info.quantumbay@gmail.com
          </a>
          <a
            href="https://github.com/QuantumBayKK"
            target="_blank"
            rel="noreferrer"
            data-cursor="GitHub"
            className="hover:text-[var(--color-neon-amber)]"
          >
            GitHub ↗
          </a>
        </motion.div>

        <div className="mt-16 flex flex-col items-center">
          <PixelCat />
        </div>
      </div>

      {/* "The Rake" — the house takes its cut: credits, stack, the egg hint */}
      <footer className="mt-[12vh] border-t border-[var(--color-line)] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <p className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)]">
              The Rake
            </p>
            <p className="font-ink mt-1 text-lg text-[var(--color-muted)]">
              every table takes its cut — here&apos;s ours.
            </p>
          </div>
          <div className="text-left text-[10px] uppercase leading-relaxed tracking-[0.25em] text-[var(--color-faint)] sm:text-right">
            <p>
              Built in the browser · Next · R3F-free · pure CSS/SVG/Canvas/WebGL
            </p>
            <p>
              Stack:&nbsp;
              <span className="text-[var(--color-muted)]">
                Next · React · Framer · Lenis · GSAP · Three · Claude
              </span>
            </p>
            <p className="mt-1 text-[var(--color-muted)]/70">
              psst — open the console, or try ↑↑↓↓←→←→ B A
            </p>
          </div>
        </div>
        {/* #79 — copyright styled as a chip count */}
        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
          <span className="text-[var(--color-brass)]">© {new Date().getFullYear()}</span>
          <span>·</span>
          <span>
            pot:&nbsp;<span className="text-[var(--color-neon-amber)]">∞</span>&nbsp;chips
          </span>
          <span>·</span>
          <span>Kailosh ♠ · Keni ♣</span>
          <span>·</span>
          <span>the house always remembers</span>
        </p>
      </footer>
    </section>
  );
}
