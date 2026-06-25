"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { handJitter } from "@/lib/seededNoise";
import { audio } from "@/lib/audio";

/**
 * Act — "The River". The five community cards land across the felt; the last
 * one (the river) turns face-up on scroll-in to complete the winning hand and
 * reveal the way in. Leads into the contact CTA.
 */
const BOARD = [
  { rank: "10", suit: "♠" },
  { rank: "J", suit: "♠" },
  { rank: "Q", suit: "♠" },
  { rank: "K", suit: "♠" },
  { rank: "A", suit: "♠" }, // the river — flips to "the nuts"
];

export default function TheRiver() {
  const ref = useRef<HTMLDivElement>(null);
  const [dealt, setDealt] = useState(false);
  const [rivered, setRivered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDealt(true);
          window.setTimeout(() => {
            setRivered(true);
            audio.play("win"); // the winning hand lands
          }, 1100);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto mb-12 flex max-w-3xl items-end justify-center gap-2 sm:gap-3">
      {BOARD.map((c, i) => {
        const river = i === BOARD.length - 1;
        const jitter = handJitter(`river-${i}`, 0.7);
        const faceUp = river ? rivered : dealt;
        return (
          <motion.div
            key={i}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={dealt ? { y: 0, opacity: 1, rotate: jitter.rotate } : {}}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 140, damping: 15 }}
            onAnimationStart={() => dealt && audio.play("deal")}
            className="[perspective:1000px]"
            style={{ width: "clamp(48px, 13vw, 84px)" }}
          >
            <div
              className="relative aspect-[3/4.3] w-full transition-transform duration-700 [transform-style:preserve-3d]"
              style={{ transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* back */}
              <div
                className="absolute inset-0 overflow-hidden rounded-lg border border-[var(--color-line-warm)] [backface-visibility:hidden]"
                style={{ background: "repeating-linear-gradient(45deg, #14100a 0 8px, #0f0b07 8px 16px)" }}
              >
                <span className="pointer-events-none absolute inset-1.5 rounded-md border border-[var(--color-brass)]/25" />
              </div>
              {/* face */}
              <div
                className={`absolute inset-0 grid place-items-center overflow-hidden rounded-lg border [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                  river
                    ? "border-[var(--color-neon-amber)] bg-[var(--color-neon-amber)]/10 shadow-[0_0_40px_-8px_var(--color-neon-amber)]"
                    : "border-[var(--color-line-warm)] bg-[var(--color-noir-2)]/70"
                }`}
              >
                <span
                  className="font-display text-xl font-bold sm:text-2xl"
                  style={{ color: river ? "var(--color-neon-amber)" : "var(--color-brass)" }}
                >
                  {c.rank}
                </span>
                <span
                  className="font-display text-base sm:text-lg"
                  style={{ color: river ? "var(--color-neon-amber)" : "var(--color-brass)" }}
                >
                  {c.suit}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
