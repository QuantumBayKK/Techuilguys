"use client";

/**
 * Fixed atmospheric backdrop that replaces the old WebGL scene — a warm
 * hanging-lamp pool, a felt-green floor glow and a slow-drifting haze, all from
 * cheap CSS radial gradients (no blur filters, no canvas). Costs ~nothing on
 * low-end GPUs and never re-paints on scroll.
 */
export default function Ambience() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* deep base */}
      <div className="absolute inset-0" style={{ background: "var(--color-noir)" }} />
      {/* hanging-lamp pool from top-center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% -5%, rgba(255,200,140,0.16), transparent 60%)",
        }}
      />
      {/* felt floor glow from the bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 50% at 50% 108%, rgba(31,109,81,0.20), transparent 60%)",
        }}
      />
      {/* neon-amber rim, lower-left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 40% at 12% 88%, rgba(255,157,47,0.10), transparent 60%)",
        }}
      />
      {/* slow-drifting haze */}
      <div className="ambient-haze absolute -inset-[20%]" />

      {/* floating embers / dust — cheap CSS, paused under reduced-motion */}
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={
            {
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              "--dur": `${e.dur}s`,
              "--delay": `${e.delay}s`,
              "--drift": `${e.drift}px`,
              "--peak": e.peak,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* Deterministic ember field (no Math.random → no hydration mismatch). */
const EMBERS = [
  { left: 8, size: 3, dur: 17, delay: 0, drift: 26, peak: 0.5 },
  { left: 19, size: 2, dur: 22, delay: 6, drift: -18, peak: 0.4 },
  { left: 27, size: 4, dur: 15, delay: 3, drift: 30, peak: 0.55 },
  { left: 38, size: 2, dur: 24, delay: 9, drift: 12, peak: 0.35 },
  { left: 46, size: 3, dur: 19, delay: 1, drift: -24, peak: 0.5 },
  { left: 54, size: 2, dur: 21, delay: 12, drift: 18, peak: 0.4 },
  { left: 63, size: 4, dur: 16, delay: 4, drift: -14, peak: 0.6 },
  { left: 71, size: 3, dur: 23, delay: 8, drift: 22, peak: 0.45 },
  { left: 80, size: 2, dur: 18, delay: 2, drift: -28, peak: 0.4 },
  { left: 88, size: 3, dur: 20, delay: 11, drift: 16, peak: 0.5 },
  { left: 94, size: 2, dur: 25, delay: 5, drift: -12, peak: 0.35 },
  { left: 14, size: 3, dur: 14, delay: 13, drift: 20, peak: 0.55 },
];
