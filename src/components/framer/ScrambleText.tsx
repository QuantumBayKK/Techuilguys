"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/lib/useInView";

/**
 * Framer-style text scramble (the classic free "decrypt" component): when the
 * element scrolls into view the label churns through glyphs and locks in
 * character by character, left to right. Scramble pool is poker-flavored.
 * Reduced-motion renders the plain text.
 */
const GLYPHS = "♠♣♥♦AKQJ1098765432★·";

export default function ScrambleText({
  text,
  className,
  speed = 28,
  lockPerTick = 0.6,
}: {
  text: string;
  className?: string;
  speed?: number;
  lockPerTick?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const [out, setOut] = useState(text);
  const done = useRef(false);

  useEffect(() => {
    if (!inView || done.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done.current = true;
      setOut(text);
      return;
    }
    done.current = true;
    let locked = 0;
    const id = window.setInterval(() => {
      locked += lockPerTick;
      const n = Math.floor(locked);
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (/\s/.test(ch) || i < n) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("")
      );
      if (n >= text.length) {
        window.clearInterval(id);
        setOut(text);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [inView, text, speed, lockPerTick]);

  return (
    <span ref={ref} aria-label={text} className={className}>
      <span aria-hidden>{out}</span>
    </span>
  );
}
