/**
 * The client landing's hero number. Draws once on mount via CSS (no JS spring,
 * no re-animation on re-render) and snaps straight to value under
 * prefers-reduced-motion.
 */
export default function ProgressRing({
  value,
  size = 168,
  stroke = 10,
  label = "complete",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${pct}% ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ws-line)"
          strokeWidth={stroke}
        />
        <circle
          className="ws-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ws-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={
            {
              "--ring-circumference": `${circumference}`,
              "--ring-offset": `${offset}`,
              strokeDashoffset: offset,
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="mono font-semibold leading-none tracking-tight"
          style={{ fontSize: size * 0.26 }}
        >
          {pct}
          <span className="text-[0.5em] text-[var(--ws-muted)]">%</span>
        </span>
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ws-muted)]">
          {label}
        </span>
      </div>
    </div>
  );
}
