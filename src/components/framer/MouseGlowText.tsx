"use client";

import { useEffect, useRef } from "react";

/**
 * Port of Framer's "MouseTextEffect": the text carries a stack of blurred
 * shadow copies that fan out away from the cursor (direction -1..1 relative to
 * the element centre, eased back to rest at 0.18/frame on leave), plus a warm
 * multi-layer glow on the face text. The original renders ~100 copies at
 * 160px; we keep the look with `copies` (default 12) for perf, offsets driven
 * by two CSS custom properties so the per-frame cost is two style writes.
 * Desktop-only: pointer-coarse and reduced-motion get the plain children.
 */
export default function MouseGlowText({
  children,
  copies = 12,
  spread = 2.2,
  glow = "rgba(255,157,47,0.55)",
  copyColor = "rgba(255,157,47,0.09)",
  className,
}: {
  children: React.ReactNode;
  copies?: number;
  spread?: number;
  glow?: string;
  copyColor?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    let raf = 0;
    let tx = 0, ty = 0;   // target direction -1..1
    let dx = 0, dy = 0;   // eased direction
    let visible = false;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const onMove = (e: PointerEvent) => {
      if (!visible) return;
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };

    const frame = () => {
      dx += (tx - dx) * 0.18;
      dy += (ty - dy) * 0.18;
      el.style.setProperty("--mgx", `${(-dx * spread).toFixed(3)}px`);
      el.style.setProperty("--mgy", `${(-dy * spread).toFixed(3)}px`);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
    };
  }, [spread]);

  return (
    <span
      ref={ref}
      className={`relative inline-block ${className ?? ""}`}
      style={{ "--mgx": "0px", "--mgy": "0px" } as React.CSSProperties}
    >
      {/* the shadow fan — furthest copies most blurred and faintest */}
      {Array.from({ length: copies }).map((_, i) => {
        const k = i + 1;
        return (
          <span
            key={i}
            aria-hidden
            className="pointer-events-none absolute inset-0 select-none"
            style={{
              color: copyColor,
              transform: `translate(calc(var(--mgx) * ${k}), calc(var(--mgy) * ${k}))`,
              filter: `blur(${k * 0.6}px)`,
              opacity: 1 - i / copies,
            }}
          >
            {children}
          </span>
        );
      })}
      {/* the face text with the warm glow */}
      <span
        className="relative"
        style={{
          textShadow: `0 0 8px ${glow}, 0 0 22px ${glow}, 0 0 46px ${glow}`,
        }}
      >
        {children}
      </span>
    </span>
  );
}
