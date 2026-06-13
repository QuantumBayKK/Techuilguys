"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience, type Stage } from "@/lib/experience";

/**
 * Cowboy-Bebop-style subtitle dialogue. One line per stage, typed out with a
 * blinking caret. Keeps the room feeling narrated and in-world.
 */
const LINES: Partial<Record<Stage, string>> = {
  dealers: "Two dealers. One table. Pick who deals you in.",
  dealt: "Five cards. Five jobs we actually shipped. Go on — read 'em.",
  inspect: "Flip it. The whole build's printed on the back.",
};

export default function Dialogue() {
  const { stage } = useExperience();
  const line = LINES[stage] ?? "";
  const [shown, setShown] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setShown("");
    idx.current = 0;
    if (!line) return;
    const t = setInterval(() => {
      idx.current += 1;
      setShown(line.slice(0, idx.current));
      if (idx.current >= line.length) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [line]);

  return (
    <AnimatePresence mode="wait">
      {line && (
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none fixed bottom-[3.2rem] left-1/2 z-[78] -translate-x-1/2 px-6 text-center"
        >
          <p className="font-display text-sm italic tracking-wide text-[var(--color-brass-bright)] sm:text-base">
            <span className="text-[var(--color-neon-amber)]">“</span>
            {shown}
            <span className="ml-0.5 inline-block w-2 animate-pulse text-[var(--color-neon-amber)]">
              |
            </span>
            <span className="text-[var(--color-neon-amber)]">”</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
