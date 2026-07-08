"use client";

import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

/**
 * Port of Framer's "Text Reveal Scroll" helper (text-reveal-scroll-helper).
 * Words start dimmed and light up one after another as the block travels from
 * `startOffset` to `endOffset` of the viewport — pure linear scroll→opacity
 * mapping, faithful to the original (dim 0.2, start 90%, end 30%).
 *
 * `parts` lets a run of words carry its own className (e.g. the script-font
 * "premium." tail) while still participating in the same reveal sequence.
 */
type Part = { text: string; className?: string };

export default function TextRevealScroll({
  parts,
  dim = 0.2,
  startOffset = 0.9,
  endOffset = 0.3,
  className,
  as: Tag = "p",
}: {
  parts: Part[];
  dim?: number;
  startOffset?: number;
  endOffset?: number;
  className?: string;
  as?: "p" | "h2" | "h3" | "div";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start ${startOffset}`, `start ${endOffset}`],
  });

  const tokens = useMemo(() => {
    const out: Part[] = [];
    for (const part of parts)
      for (const w of part.text.split(/\s+/).filter(Boolean))
        out.push({ text: w, className: part.className });
    return out;
  }, [parts]);

  const label = useMemo(() => parts.map((p) => p.text).join(" "), [parts]);

  return (
    <Tag ref={ref as React.Ref<HTMLParagraphElement>} aria-label={label} className={className}>
      {tokens.map((t, i) => (
        <Word
          key={`${t.text}-${i}`}
          progress={scrollYProgress}
          range={[i / tokens.length, (i + 1) / tokens.length]}
          dim={dim}
          className={t.className}
        >
          {t.text}
        </Word>
      ))}
    </Tag>
  );
}

function Word({
  progress,
  range,
  dim,
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  dim: number;
  className?: string;
  children: string;
}) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <span aria-hidden className="inline">
      <motion.span style={{ opacity }} className={`inline ${className ?? ""}`}>
        {children}
      </motion.span>{" "}
    </span>
  );
}
