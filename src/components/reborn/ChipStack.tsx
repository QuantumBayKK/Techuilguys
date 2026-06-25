"use client";

import { seededRange } from "@/lib/seededNoise";

/**
 * #10 — an uneven stack of chips. Real chips are never perfectly squared: the
 * stack leans a couple degrees and the top chip sits slightly off-centre. All
 * offsets are SEEDED so it's stable per render, never jittery.
 */
export default function ChipStack({
  seed = "pot",
  count = 7,
  color = "var(--color-neon-amber)",
  className = "",
}: {
  seed?: string;
  count?: number;
  color?: string;
  className?: string;
}) {
  const lean = seededRange(seed + "-lean", -4, 4);
  const w = 46;
  const ch = 9; // chip height
  const gap = 5;

  return (
    <div
      className={`chip-stack pointer-events-none select-none ${className}`}
      style={{ "--lean": `${lean}deg` } as React.CSSProperties}
      aria-hidden
    >
      <svg width={w + 14} height={count * gap + ch + 10} viewBox={`0 0 ${w + 14} ${count * gap + ch + 10}`}>
        {Array.from({ length: count }).map((_, i) => {
          const fromTop = count - 1 - i; // draw bottom→top
          const dx = seededRange(`${seed}-${fromTop}-x`, -2.2, 2.2) + (fromTop === 0 ? seededRange(`${seed}-top`, -3, 3) : 0);
          const y = 6 + fromTop * gap;
          const edge = fromTop % 2 === 0 ? color : "var(--color-brass)";
          return (
            <g key={i} transform={`translate(${7 + dx} ${y})`}>
              <ellipse cx={w / 2} cy={ch} rx={w / 2} ry={ch} fill="rgba(0,0,0,0.35)" />
              <ellipse cx={w / 2} cy={ch} rx={w / 2} ry={ch} fill={edge} opacity={0.9} />
              <ellipse cx={w / 2} cy={ch - 2.5} rx={w / 2} ry={ch} fill="#0f0c08" />
              <ellipse cx={w / 2} cy={ch - 2.5} rx={w / 2 - 5} ry={ch - 3} fill="none" stroke={edge} strokeWidth={1.4} opacity={0.8} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
