"use client";

import { motion } from "framer-motion";
import FlipGallery, { type FlipImage } from "@/components/ui/flip-gallery";
import RippleReveal from "@/components/ui/RippleReveal";
import { PROJECTS } from "@/data/projects";
import { dealerById } from "@/data/dealers";

/**
 * Act III½ — "the whole deck". A single flip-card cuts through every project's
 * hero-art like a dealer riffling the pack. Card art comes straight from the
 * deck data; until the generated art lands in `public/projects/`, the frames
 * read as empty felt with the title still flipping, so it never looks broken.
 */
const slides: FlipImage[] = PROJECTS.map((p) => ({
  title: `${dealerById(p.dealer).suit}  ${p.rank} · ${p.title} — ${p.subtitle}`,
  url: p.image ?? "",
}));

export default function DeckGallery() {
  return (
    <section className="relative isolate overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-6 text-center sm:text-left">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)] sm:justify-start"
        >
          <span className="font-mono text-[var(--color-neon-amber)]">(03)</span>
          <span className="h-px w-8 bg-[var(--color-line-warm)]" />
          Riffle the pack
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="font-display mt-2 text-4xl font-bold uppercase leading-none tracking-tight sm:text-6xl"
        >
          The whole deck
        </motion.h2>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Six cards, both hands. Cut through them.
        </p>
      </div>

      <RippleReveal className="mt-16 flex justify-center">
        {/* a felt table-top the riffling card sits on */}
        <div className="felt-grain relative overflow-hidden rounded-[28px] border border-[var(--color-line-warm)] bg-[var(--color-felt-deep)]/40 px-10 py-12 shadow-[var(--shadow-table)]">
          <FlipGallery images={slides} bare />
        </div>
      </RippleReveal>
    </section>
  );
}
