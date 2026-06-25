"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { DEALERS, type Dealer } from "@/data/dealers";
import { handJitter } from "@/lib/seededNoise";
import { audio } from "@/lib/audio";

/**
 * Act — "The Tell". Every player has one. Two face-down cards; hover (or tap)
 * flips a card to reveal the founder behind it and their tell — a quirk/habit.
 * Reading the table, the about-section reframed as poker.
 */
export default function TheTell() {
  return (
    <section id="rb-tell" className="relative py-[14vh]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="misprint font-display text-[clamp(2rem,6vw,5rem)] font-bold uppercase leading-none tracking-tight">
            The&nbsp;tell
          </h2>
          <p className="font-display mb-2 hidden text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)] sm:block">
            Read the player ↻
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {DEALERS.map((d, i) => (
            <TellCard key={d.id} dealer={d} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TellCard({ dealer, index }: { dealer: Dealer; index: number }) {
  const jitter = handJitter(`tell-${dealer.id}`, 0.6);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      style={{ rotate: jitter.rotate }}
      className="group [perspective:1600px]"
      onPointerEnter={() => audio.play("flip")}
    >
      <div
        className="relative aspect-[16/9] w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"
      >
        {/* face-down: card back */}
        <div
          className="worn-edge absolute inset-0 grid place-items-center overflow-hidden rounded-2xl border border-[var(--color-line-warm)] [backface-visibility:hidden]"
          style={{
            background:
              "repeating-linear-gradient(45deg, #14100a 0 10px, #0f0b07 10px 20px)",
          }}
        >
          <span className="pointer-events-none absolute inset-2.5 rounded-xl border border-[var(--color-brass)]/30" />
          <span className="font-display text-6xl text-[var(--color-brass)]/50">{dealer.suit}</span>
          <span className="font-ink absolute bottom-4 text-lg text-[var(--color-muted)]">
            hover to read the tell
          </span>
        </div>

        {/* face-up: the player + their tell */}
        <div className="worn-edge absolute inset-0 flex items-center gap-5 overflow-hidden rounded-2xl border border-[var(--color-line-warm)] bg-[var(--color-noir-2)]/60 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--color-line-warm)] sm:h-24 sm:w-24">
            <Image
              src={dealer.portrait}
              alt={dealer.name}
              fill
              sizes="96px"
              className="object-cover"
              style={{ filter: "grayscale(0.3) contrast(1.05)" }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              {dealer.name} <span className="text-[var(--color-brass)]">{dealer.suit}</span>
            </p>
            <p className="font-ink mt-1 text-lg leading-snug text-[var(--color-brass-bright)]/90">
              the tell:
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-ink)]/85">
              {dealer.tell}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
