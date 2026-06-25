"use client";

import Image from "next/image";
import { useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { DEALERS, type Dealer } from "@/data/dealers";
import { audio } from "@/lib/audio";
import { handJitter } from "@/lib/seededNoise";

/**
 * Reborn — the two hands at the table, as an editorial spread. The loud
 * spotlight glow is gone; each card instead leans toward the cursor in 3D, its
 * portrait colorizes from grey on hover, a giant suit watermarks the back, and
 * only a faint amber pool tracks the pointer.
 */
export default function Dealers() {
  return (
    <section id="rb-dealers" className="relative py-[14vh]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-14 flex items-end justify-between">
          <h2 className="misprint font-display text-[clamp(2rem,6vw,5rem)] font-bold uppercase leading-none tracking-tight">
            The&nbsp;dealers
          </h2>
          <p className="font-display mb-2 text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)]">
            Two at the table
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {DEALERS.map((d, i) => (
            <DealerCard key={d.id} dealer={d} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DealerCard({ dealer, index }: { dealer: Dealer; index: number }) {
  const [hover, setHover] = useState(false);
  const jitter = handJitter(`dealer-${dealer.id}`, 0.7); // gentler off-square

  // 3D tilt + a faint amber pool that follows the pointer
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 130, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 130, damping: 18 });
  const pool = useMotionTemplate`radial-gradient(240px 240px at ${gx}px ${gy}px, rgba(255,157,47,0.08), transparent 70%)`;

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
    gx.set(e.clientX - r.left);
    gy.set(e.clientY - r.top);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="[perspective:1400px]"
    >
      <motion.div
        onPointerMove={onMove}
        onPointerEnter={() => {
          setHover(true);
          audio.play("hover");
        }}
        onPointerLeave={onLeave}
        style={{
          rotateX: hover ? rx : 0,
          rotateY: hover ? ry : 0,
          rotate: jitter.rotate,
          x: jitter.x,
          y: jitter.y,
          transformStyle: "preserve-3d",
        }}
        className="worn-edge group relative h-full overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-noir-2)]/40 p-7 backdrop-blur-[3px] transition-colors duration-300 hover:border-[var(--color-line-warm)] sm:p-9"
      >
        {/* faint cursor pool — replaces the old loud glow */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{ background: pool, opacity: hover ? 1 : 0 }}
        />
        {/* giant suit watermark */}
        <span
          className="font-display pointer-events-none absolute -bottom-12 -right-6 select-none leading-none text-[var(--color-brass)]/[0.05] transition-transform duration-700 group-hover:scale-110 group-hover:text-[var(--color-neon-amber)]/[0.07]"
          style={{ fontSize: "18rem" }}
        >
          {dealer.suit}
        </span>

        <div className="relative flex h-full flex-col" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-start justify-between">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--color-line-warm)] sm:h-24 sm:w-24">
              <Image
                src={dealer.portrait}
                alt={dealer.name}
                fill
                sizes="96px"
                className="object-cover transition-all duration-700"
                style={{
                  filter: hover
                    ? "grayscale(0) contrast(1.05) saturate(1.1)"
                    : "grayscale(0.95) contrast(1.15) brightness(0.85)",
                  transform: hover ? "scale(1.08)" : "scale(1)",
                }}
              />
              {/* sweep ring on hover */}
              <span
                className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset transition-all duration-500"
                style={{ boxShadow: hover ? "inset 0 0 0 1px rgba(255,157,47,0.5)" : "none" }}
              />
            </div>
            <span className="font-display text-5xl text-[var(--color-brass)] transition-colors duration-300 group-hover:text-[var(--color-neon-amber)] sm:text-6xl">
              {dealer.suit}
            </span>
          </div>

          <h3 className="font-display mt-6 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            {dealer.name}
          </h3>
          <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--color-brass)]">
            {dealer.rank}
          </p>
          {/* #8 — a hand-signed annotation, slightly baseline-drunk */}
          <span
            className="font-ink mt-1 block text-xl text-[var(--color-brass-bright)]/80"
            style={{ transform: `rotate(${jitter.rotate * -1.4}deg)` }}
          >
            ~ dealt by {dealer.name.toLowerCase()}
          </span>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-ink)]/85">
            {dealer.bio}
          </p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {dealer.focus.map((f, j) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + j * 0.06 }}
                className="rounded-full border border-[var(--color-line-warm)] bg-[var(--color-neon-amber)]/5 px-2.5 py-0.5 text-[11px] tracking-wide text-[var(--color-ink)] transition-colors duration-300 hover:bg-[var(--color-neon-amber)]/15"
              >
                {f}
              </motion.span>
            ))}
          </div>

          <a
            href={dealer.github}
            target="_blank"
            rel="noreferrer"
            data-cursor="GitHub"
            className="ink-link mt-7 inline-flex w-fit items-center gap-1.5 text-lg text-[var(--color-muted)] hover:text-[var(--color-neon-amber)]"
          >
            github ↗
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
