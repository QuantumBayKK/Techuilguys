"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "@/lib/useInView";

/**
 * Port of Framer's "Pro Text Type" typewriter. Types each string character by
 * character (50ms), pauses (2s), deletes (30ms), moves to the next, loops.
 * Blinking pipe cursor (0.5s easeInOut fade each way). `variableSpeed` adds a
 * human 30–80ms jitter. Starts when scrolled into view; under reduced-motion
 * it just shows the first string.
 */
export default function TextType({
  strings,
  typingSpeed = 50,
  deletingSpeed = 30,
  pause = 2000,
  loop = true,
  cursorChar = "|",
  variableSpeed = true,
  className,
  cursorClassName,
}: {
  strings: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pause?: number;
  loop?: boolean;
  cursorChar?: string;
  variableSpeed?: boolean;
  className?: string;
  cursorClassName?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.1 });
  const [text, setText] = useState("");
  const [reduced, setReduced] = useState(false);
  const state = useRef({ si: 0, ci: 0, deleting: false, started: false });

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!inView || reduced || state.current.started) return;
    state.current.started = true;
    let timer = 0;
    let alive = true;

    const step = () => {
      if (!alive) return;
      const s = state.current;
      const current = strings[s.si] ?? "";
      let delay: number;

      if (!s.deleting) {
        s.ci += 1;
        setText(current.slice(0, s.ci));
        if (s.ci >= current.length) {
          const last = s.si === strings.length - 1;
          if (last && !loop) return; // rest on the final sentence
          s.deleting = true;
          delay = pause;
        } else {
          delay = variableSpeed
            ? 30 + Math.random() * 50
            : typingSpeed;
        }
      } else {
        s.ci -= 1;
        setText(current.slice(0, s.ci));
        if (s.ci <= 0) {
          s.deleting = false;
          s.si = (s.si + 1) % strings.length;
          delay = typingSpeed * 4;
        } else {
          delay = deletingSpeed;
        }
      }
      timer = window.setTimeout(step, delay);
    };

    timer = window.setTimeout(step, typingSpeed);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [inView, reduced, strings, typingSpeed, deletingSpeed, pause, loop, variableSpeed]);

  return (
    <span ref={ref} className={className} aria-label={strings[0]}>
      <span aria-hidden>{reduced ? strings[0] : text}</span>
      {!reduced && (
        <motion.span
          aria-hidden
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
          className={`inline-block ${cursorClassName ?? ""}`}
        >
          {cursorChar}
        </motion.span>
      )}
    </span>
  );
}
