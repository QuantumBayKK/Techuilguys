"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import { audio } from "@/lib/audio";

/**
 * Section B — a tactile "your hand". Five cards fan out when you hover; grab one
 * and it tilts with your drag velocity (card weight), springs back if you let
 * go gently, or flies off with spin if you flick it hard (throw-to-dismiss),
 * then is re-dealt. Pure framer-motion drag — no physics engine.
 */
const HAND = [
  { rank: "A", suit: "♠" },
  { rank: "K", suit: "♥" },
  { rank: "Q", suit: "♣" },
  { rank: "J", suit: "♦" },
  { rank: "10", suit: "♠" },
];

export default function DragHand() {
  const [spread, setSpread] = useState(false);
  // touch devices can't hover and shouldn't have cards stealing the scroll
  const [interactive, setInteractive] = useState(true);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) {
      setInteractive(false);
      setSpread(true); // show a fanned hand at rest instead of a flat stack
    }
  }, []);

  return (
    <section className="relative overflow-hidden py-[12vh]">
      <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
        <p className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--color-brass)]">
          (interlude)
        </p>
        <h2 className="font-ink mt-2 text-[clamp(1.6rem,5vw,3.2rem)] leading-tight text-[var(--color-brass-bright)]">
          {interactive ? "here — feel the cards. drag one. flick it away." : "the hand we play."}
        </h2>

        <div
          className="relative mx-auto mt-12 flex h-[260px] w-full max-w-md items-center justify-center sm:h-[280px]"
          onPointerEnter={() => interactive && setSpread(true)}
          onPointerLeave={() => interactive && setSpread(false)}
          style={{ perspective: 1200 }}
        >
          {HAND.map((c, i) => (
            <FanCard
              key={i}
              card={c}
              index={i}
              count={HAND.length}
              spread={spread}
              interactive={interactive}
            />
          ))}
        </div>
        {interactive && (
          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
            drag to fan · flick to throw · they come back
          </p>
        )}
      </div>
    </section>
  );
}

function FanCard({
  card,
  index,
  count,
  spread,
  interactive,
}: {
  card: { rank: string; suit: string };
  index: number;
  count: number;
  spread: boolean;
  interactive: boolean;
}) {
  const controls = useAnimationControls();
  const tilt = useMotionValue(0);
  const dragging = useRef(false);
  const red = card.suit === "♥" || card.suit === "♦";

  const mid = (count - 1) / 2;
  const off = index - mid;
  // resting (stacked) vs fanned layout
  const baseRot = spread ? off * 9 : off * 2.5;
  const baseX = spread ? off * 56 : off * 14;
  const baseY = spread ? Math.abs(off) * 10 : Math.abs(off) * 3;

  const onDrag = (_: unknown, info: PanInfo) => {
    tilt.set(Math.max(-25, Math.min(25, info.velocity.x * 0.02)));
  };

  const onDragStart = () => {
    dragging.current = true;
    audio.play("hover");
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false;
    const speed = Math.hypot(info.velocity.x, info.velocity.y);
    if (speed > 700) {
      // throw off-screen with spin, then re-deal
      audio.play("deal");
      const dir = Math.atan2(info.velocity.y, info.velocity.x);
      controls
        .start({
          x: Math.cos(dir) * 900,
          y: Math.sin(dir) * 900,
          rotate: (info.velocity.x > 0 ? 1 : -1) * 540,
          opacity: 0,
          transition: { duration: 0.55, ease: "easeOut" },
        })
        .then(() => {
          controls.set({ x: baseX, y: baseY, rotate: baseRot, opacity: 0, scale: 0.8 });
          audio.play("flip");
          return controls.start({
            x: baseX,
            y: baseY,
            rotate: baseRot,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 120, damping: 14, delay: 0.15 },
          });
        });
    } else {
      // gentle release → spring home
      tilt.set(0);
      controls.start({
        x: baseX,
        y: baseY,
        rotate: baseRot,
        transition: { type: "spring", stiffness: 200, damping: 16 },
      });
    }
  };

  return (
    <motion.div
      drag={interactive}
      dragMomentum={false}
      onDragStart={interactive ? onDragStart : undefined}
      onDrag={interactive ? onDrag : undefined}
      onDragEnd={interactive ? onDragEnd : undefined}
      data-cursor={interactive ? "Grab" : undefined}
      initial={{ x: baseX, y: baseY, rotate: baseRot }}
      animate={dragging.current ? undefined : { x: baseX, y: baseY, rotate: baseRot }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      whileTap={interactive ? { scale: 1.08, zIndex: 30 } : undefined}
      style={{ rotate: tilt, zIndex: 10 + index }}
      className={`worn-edge absolute h-[180px] w-[128px] select-none overflow-hidden rounded-xl border border-[var(--color-line-warm)] bg-gradient-to-br from-[#1b140d] via-[#120d08] to-[#0a0705] shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)] sm:h-[200px] sm:w-[145px] ${
        interactive ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none"
      }`}
    >
      <span className="pointer-events-none absolute inset-2 rounded-lg border border-[var(--color-brass)]/25" />
      <span
        className="font-display absolute left-3 top-2 text-lg font-bold leading-none"
        style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
      >
        {card.rank}
        <br />
        {card.suit}
      </span>
      <span
        className="absolute inset-0 grid place-items-center text-5xl"
        style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
      >
        {card.suit}
      </span>
      <span
        className="font-display absolute bottom-2 right-3 rotate-180 text-lg font-bold leading-none"
        style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
      >
        {card.rank}
        <br />
        {card.suit}
      </span>
    </motion.div>
  );
}
