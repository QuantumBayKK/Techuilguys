"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useState } from "react";
import { DEALERS, type Dealer } from "@/data/dealers";
import { experience, useExperience } from "@/lib/experience";
import { audio } from "@/lib/audio";

/**
 * Pick your dealer. Two noir court-card portraits flank the table. Hover
 * colorizes + lights a neon rim; selecting steps that dealer forward, recedes
 * the other, and deals their hand.
 */
export default function DealerStage() {
  const { stage } = useExperience();
  const [hover, setHover] = useState<string | null>(null);
  const visible = stage === "dealers";

  const pick = (d: Dealer) => {
    audio.play("select");
    experience.set({ dealer: d.id, stage: "dealt" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="dealers"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center"
        >
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-display absolute top-[14%] text-xs uppercase tracking-[0.5em] text-[var(--color-brass)]"
          >
            Pick your dealer
          </motion.p>

          <div className="flex w-full max-w-5xl items-center justify-center gap-6 px-6 sm:gap-16">
            {DEALERS.map((d, i) => {
              const dim = hover && hover !== d.id;
              return (
                <motion.button
                  key={d.id}
                  data-cursor="Deal"
                  data-magnetic
                  onMouseEnter={() => {
                    setHover(d.id);
                    audio.play("hover");
                  }}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => pick(d)}
                  initial={{ y: 60, opacity: 0, rotateY: i === 0 ? 12 : -12 }}
                  animate={{
                    y: dim ? 14 : 0,
                    opacity: dim ? 0.45 : 1,
                    scale: hover === d.id ? 1.04 : 1,
                    rotateY: 0,
                  }}
                  transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 120, damping: 18 }}
                  className="pointer-events-auto group relative w-[42vw] max-w-[300px]"
                  style={{ perspective: 1100 }}
                >
                  <CourtPortrait dealer={d} active={hover === d.id} />
                </motion.button>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
            className="absolute bottom-[10%] text-[11px] tracking-wide text-[var(--color-muted)]"
          >
            Each dealer holds a five-card hand. Choose one to be dealt in.
          </motion.p>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function CourtPortrait({ dealer, active }: { dealer: Dealer; active: boolean }) {
  // pointer-driven tilt → the poster catches the light like a held card
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [9, -9]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(px, [0, 1], [-11, 11]), { stiffness: 140, damping: 16 });
  const sheenX = useTransform(px, [0, 1], ["0%", "100%"]);
  const suit = dealer.id === "kailosh" ? "♠" : "♣";

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX: active ? rx : 0,
        rotateY: active ? ry : 0,
        transformStyle: "preserve-3d",
        borderColor: active ? "var(--color-neon-amber)" : "var(--color-line)",
        boxShadow: active
          ? "0 30px 80px -20px var(--color-neon-amber), inset 0 0 0 1px rgba(255,157,47,0.4)"
          : "var(--shadow-table)",
      }}
      className="relative aspect-[3/4.4] overflow-hidden rounded-[var(--radius-card)] border-2 transition-[box-shadow,border-color] duration-300"
    >
      {/* brass court-card frame */}
      <div className="pointer-events-none absolute inset-2 z-20 rounded-[10px] border border-[var(--color-brass)]/40" />
      <span className="font-display absolute left-3 top-2 z-20 text-sm text-[var(--color-brass)]">
        {suit}
      </span>
      <span className="font-display absolute bottom-2 right-3 z-20 rotate-180 text-sm text-[var(--color-brass)]">
        {suit}
      </span>

      <Image
        src={dealer.portrait}
        alt={dealer.name}
        fill
        sizes="300px"
        className="object-cover transition-all duration-700"
        style={{
          filter: active
            ? "grayscale(0) contrast(1.05) saturate(1.12)"
            : "grayscale(0.92) contrast(1.28) brightness(0.8) sepia(0.18)",
          transform: active ? "scale(1.08)" : "scale(1)",
        }}
        priority
      />

      {/* duotone wash that lifts on hover */}
      <div
        className="absolute inset-0 z-10 mix-blend-color transition-opacity duration-500"
        style={{
          opacity: active ? 0 : 0.45,
          background:
            "linear-gradient(180deg, var(--color-felt-deep), var(--color-noir))",
        }}
      />

      {/* moving light sweep */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay"
        style={{
          opacity: active ? 0.6 : 0,
          background: useTransform(
            sheenX,
            (x) =>
              `radial-gradient(40% 55% at ${x} 18%, rgba(255,230,180,0.55), transparent 70%)`
          ),
        }}
      />
      {/* chromatic edge flicker on hover */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: active ? 0.5 : 0,
          boxShadow:
            "inset 2px 0 6px -2px rgba(255,80,80,0.6), inset -2px 0 6px -2px rgba(80,180,255,0.6)",
        }}
      />

      {/* bottom gradient + name (parallax layer) */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--color-noir)] via-[var(--color-noir)]/70 to-transparent p-4 pt-12"
        style={{ transform: "translateZ(30px)" }}
      >
        <p
          className="font-display text-2xl font-bold uppercase tracking-tight transition-colors duration-300"
          style={{ color: active ? "var(--color-neon-amber)" : "var(--color-ink)" }}
        >
          {dealer.name}
        </p>
        <p className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--color-brass)]">
          {dealer.rank}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">
          {dealer.tagline}
        </p>
      </div>
    </motion.div>
  );
}
