"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/**
 * Reborn ambience — playing cards drifting slowly down the left & right gutters
 * as you scroll. Pure decoration: a fixed, pointer-events-none layer behind the
 * content. Each card maps the page's scroll progress to a long downward travel
 * at its own pace (parallax), with a slow idle sway. Off under reduced-motion.
 */

type Spec = {
  side: "l" | "r";
  edge: number; // vw inset from its edge
  start: number; // starting vh from top
  travel: number; // how far it falls over the whole scroll (vh)
  size: number; // width px
  rot: number; // base rotation deg
  rank: string;
  suit: string;
  opacity: number;
  sway: number; // idle sway seconds
};

const SUITS = ["♠", "♣", "♥", "♦"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "7"];

// Deterministic spread (no RNG → stable SSR/build).
const BASE: Omit<Spec, "rank" | "suit">[] = [
  { side: "l", edge: 3, start: -8, travel: 150, size: 120, rot: -12, opacity: 0.22, sway: 9 },
  { side: "l", edge: 9, start: 22, travel: 120, size: 92, rot: 8, opacity: 0.16, sway: 11 },
  { side: "l", edge: 1, start: 55, travel: 175, size: 140, rot: -6, opacity: 0.26, sway: 13 },
  { side: "l", edge: 11, start: 90, travel: 110, size: 80, rot: 15, opacity: 0.13, sway: 8 },
  { side: "l", edge: 5, start: 130, travel: 160, size: 108, rot: -18, opacity: 0.2, sway: 12 },
  { side: "r", edge: 3, start: 4, travel: 165, size: 132, rot: 12, opacity: 0.24, sway: 10 },
  { side: "r", edge: 10, start: 34, travel: 115, size: 86, rot: -9, opacity: 0.15, sway: 12 },
  { side: "r", edge: 1, start: 70, travel: 180, size: 146, rot: 7, opacity: 0.27, sway: 14 },
  { side: "r", edge: 12, start: 108, travel: 105, size: 76, rot: -14, opacity: 0.12, sway: 9 },
  { side: "r", edge: 6, start: 145, travel: 150, size: 100, rot: 17, opacity: 0.19, sway: 11 },
];

const CARDS: Spec[] = BASE.map((c, i) => ({
  ...c,
  // lift the whole field so the cards read against the dark room
  opacity: Math.min(0.5, c.opacity + 0.17),
  rank: RANKS[i % RANKS.length],
  suit: SUITS[i % SUITS.length],
}));

export default function FallingCards() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 24,
    mass: 0.6,
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[5] hidden overflow-hidden motion-reduce:hidden sm:block"
    >
      {CARDS.map((c, i) => (
        <FallingCard key={i} spec={c} progress={smooth} dogEar={i === 7} />
      ))}
    </div>
  );
}

function FallingCard({
  spec,
  progress,
  dogEar = false,
}: {
  spec: Spec;
  progress: MotionValue<number>;
  dogEar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useTransform(progress, [0, 1], [`${spec.start}vh`, `${spec.start + spec.travel}vh`]);
  const rot = useTransform(progress, [0, 1], [spec.rot, spec.rot + (spec.side === "l" ? -40 : 40)]);

  const red = spec.suit === "♥" || spec.suit === "♦";

  return (
    <motion.div
      ref={ref}
      style={{
        y,
        rotate: rot,
        opacity: spec.opacity,
        width: spec.size,
        height: spec.size * 1.4,
        [spec.side === "l" ? "left" : "right"]: `${spec.edge}vw`,
        top: 0,
      }}
      className="absolute"
    >
      <div
        style={{ animationDuration: `${spec.sway}s` }}
        className={`card-sway relative h-full w-full rounded-[10px] border border-[var(--color-brass)]/60 bg-gradient-to-br from-[#241a10] via-[#15100a] to-[#0b0805] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] ${
          dogEar ? "dog-ear" : ""
        }`}
      >
        <span className="absolute inset-1.5 rounded-[7px] border border-[var(--color-brass)]/25" />
        <CardCorner rank={spec.rank} suit={spec.suit} red={red} className="left-2 top-1.5" />
        <span
          className="absolute inset-0 grid place-items-center text-[2.2em] leading-none"
          style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)", fontSize: spec.size * 0.42 }}
        >
          {spec.suit}
        </span>
        <CardCorner
          rank={spec.rank}
          suit={spec.suit}
          red={red}
          className="bottom-1.5 right-2 rotate-180"
        />
      </div>
    </motion.div>
  );
}

function CardCorner({
  rank,
  suit,
  red,
  className,
}: {
  rank: string;
  suit: string;
  red: boolean;
  className: string;
}) {
  return (
    <span
      className={`font-display absolute flex flex-col items-center leading-none ${className}`}
      style={{ color: red ? "var(--color-neon-amber)" : "var(--color-brass)" }}
    >
      <span className="text-[0.85rem] font-bold">{rank}</span>
      <span className="text-[0.7rem]">{suit}</span>
    </span>
  );
}
