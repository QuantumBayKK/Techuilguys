"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "@/lib/audio";

/**
 * Konami code (↑ ↑ ↓ ↓ ← → ← → B A) → JACKPOT. Gold flash, a shower of chips &
 * cards, a screen-wide "JACKPOT", a little slot-machine fanfare, and Ace loses
 * his mind. Auto-dismisses. Pure reward, no gate beyond reduced-motion for the
 * shake.
 */
const SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const COIN = "🪙";
const CARDS = ["🂡", "🂮", "🃁", "🃎", "🂱", "🃑"];

export default function KonamiJackpot() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const want = SEQUENCE[idx];
      if (e.key.toLowerCase() === want.toLowerCase()) {
        idx++;
        if (idx === SEQUENCE.length) {
          idx = 0;
          fire();
        }
      } else {
        idx = e.key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fire = () => {
    setOn(true);
    audio.unlock();
    audio.play("spin");
    window.setTimeout(() => audio.play("win"), 250);
    window.setTimeout(() => audio.play("chip"), 500);
    window.setTimeout(() => audio.play("thud"), 700);
    // Ace celebrates (meow + hearts)
    window.dispatchEvent(new CustomEvent("ace:react", { detail: "meow" }));
    window.setTimeout(() => setOn(false), 3800);
  };

  const drops = Array.from({ length: 46 }, (_, i) => ({
    left: (i * 137.5) % 100, // golden-angle scatter
    delay: (i % 12) * 0.12,
    dur: 2.6 + (i % 7) * 0.25,
    glyph: i % 3 === 0 ? CARDS[i % CARDS.length] : COIN,
    size: 18 + (i % 5) * 8,
    rot: (i % 2 ? 1 : -1) * (120 + (i % 5) * 60),
  }));

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[140] overflow-hidden"
        >
          {/* gold wash + flash */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.18, 0.28] }}
            transition={{ duration: 1, times: [0, 0.1, 0.4, 1] }}
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgba(255,200,90,0.45), transparent 60%), linear-gradient(0deg, rgba(255,157,47,0.12), rgba(201,162,75,0.12))",
              mixBlendMode: "screen",
            }}
          />

          {/* coin / card shower */}
          {drops.map((d, i) => (
            <motion.span
              key={i}
              className="absolute top-[-8%] select-none"
              style={{ left: `${d.left}%`, fontSize: d.size }}
              initial={{ y: "-10vh", rotate: 0, opacity: 0 }}
              animate={{ y: "112vh", rotate: d.rot, opacity: [0, 1, 1, 0.9] }}
              transition={{ duration: d.dur, delay: d.delay, ease: "easeIn" }}
            >
              {d.glyph}
            </motion.span>
          ))}

          {/* JACKPOT wordmark */}
          <div className="absolute inset-0 grid place-items-center">
            <motion.div
              initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
              animate={{ scale: [0.4, 1.15, 1], rotate: [-8, 3, 0], opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="motion-safe:animate-pulse text-center"
            >
              <p className="font-script text-2xl text-[var(--color-brass-bright)] sm:text-4xl">
                the cat smiles
              </p>
              <h2
                className="font-display text-[clamp(3rem,16vw,12rem)] font-bold uppercase leading-none tracking-tight"
                style={{
                  color: "#ffcf6a",
                  textShadow:
                    "0 0 24px rgba(255,200,90,0.7), 0 6px 0 #8a6f2f, 0 8px 30px rgba(0,0,0,0.6)",
                }}
              >
                Jackpot
              </h2>
              <p className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--color-neon-amber)]">
                ♠ ♣ ♥ ♦ you found the code ♦ ♥ ♣ ♠
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
