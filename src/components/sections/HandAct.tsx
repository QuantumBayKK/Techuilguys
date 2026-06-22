"use client";

import { motion } from "framer-motion";
import { DEALERS, dealerById, type DealerId } from "@/data/dealers";
import { handFor } from "@/data/projects";
import ProjectShowcase from "@/components/cards/ProjectShowcase";

/**
 * Act III — the dealt hand, scrolled. The chosen dealer's five cards come
 * first; then "the rest of the deck" (the other dealer's hand). Every card is
 * a project with a live embedded demo. No clicks — pure scroll.
 */
export default function HandAct({ dealer }: { dealer: DealerId }) {
  const chosen = dealerById(dealer);
  const other = DEALERS.find((d) => d.id !== dealer)!;
  const mine = handFor(dealer);
  const theirs = handFor(other.id);

  return (
    <div id="the-hand" className="relative">
      <HandHeader
        no="01"
        eyebrow={`Dealt by ${chosen.name} ${chosen.suit}`}
        title="Your hand"
        sub={`Five jobs we actually shipped — ${chosen.rank.toLowerCase()}. Read 'em.`}
      />
      {mine.map((p, i) => (
        <ProjectShowcase key={p.id} project={p} number={i + 1} flip={i % 2 === 1} />
      ))}

      <div className="my-10 flex items-center gap-4 px-6">
        <span className="h-px flex-1 bg-[var(--color-line)]" />
        <span className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)]">
          the rest of the deck
        </span>
        <span className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <HandHeader
        no="02"
        eyebrow={`${other.name}'s hand ${other.suit}`}
        title="The other five"
        sub={other.tagline}
      />
      {theirs.map((p, i) => (
        <ProjectShowcase key={p.id} project={p} number={i + 1} flip={i % 2 === 1} />
      ))}
    </div>
  );
}

function HandHeader({
  no,
  eyebrow,
  title,
  sub,
}: {
  no: string;
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-20 text-center sm:text-left">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)] sm:justify-start"
      >
        <span className="font-mono text-[var(--color-neon-amber)]">({no})</span>
        <span className="h-px w-8 bg-[var(--color-line-warm)]" />
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.05 }}
        className="font-display mt-2 text-4xl font-bold uppercase leading-none tracking-tight sm:text-6xl"
      >
        {title}
      </motion.h2>
      <p className="mt-3 text-sm text-[var(--color-muted)]">{sub}</p>
    </div>
  );
}
