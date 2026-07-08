"use client";

import { useEffect, useRef } from "react";
import { useCapability } from "@/lib/useCapability";

/**
 * Custom cursor: a dot + trailing ring. Reads `data-cursor="Label"` on the
 * nearest interactive ancestor to swap a context label (Deal / View / Drag /
 * Flip / Back / Email) and grows the ring. `data-magnetic` elements pull the
 * cursor toward their center. Hidden on touch / coarse pointers.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const cap = useCapability();

  useEffect(() => {
    if (!cap.ready || cap.touch) return;
    document.body.classList.add("has-custom-cursor");

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: target.x, y: target.y };
    let hovering = false;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      const el = (e.target as HTMLElement)?.closest?.(
        "[data-cursor],a,button,[data-magnetic]"
      ) as HTMLElement | null;

      hovering = !!el;
      const text = el?.getAttribute("data-cursor") ?? "";
      if (label.current) label.current.textContent = text;
      ring.current?.classList.toggle("cursor-ring--active", !!el);
      ring.current?.classList.toggle("cursor-ring--label", !!text);

      // magnetic pull toward element center — gentle and capped. The old
      // 0.35 * full-distance pull threw the cursor across large targets
      // (the lounge CTA above the cat) and read as a glitch; now the pull
      // fades in near the center and never exceeds a few px.
      if (el?.hasAttribute("data-magnetic")) {
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - e.clientX;
        const dy = r.top + r.height / 2 - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const MAX = 10; // px, hard cap on the nudge
        const pull = Math.min(dist * 0.12, MAX) / dist;
        target.x += dx * pull;
        target.y += dy * pull;
      }
    };

    let raf = 0;
    const loop = () => {
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;
      if (dot.current)
        dot.current.style.transform = `translate3d(${target.x}px,${target.y}px,0) translate(-50%,-50%)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0) translate(-50%,-50%) scale(${
          hovering ? 1.6 : 1
        })`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [cap.ready, cap.touch]);

  if (cap.touch) return null;

  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-[var(--color-neon-amber)] mix-blend-difference"
      />
      <div
        ref={ring}
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[100] flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-brass)]/60 transition-[width,height,background] duration-200"
      >
        <span
          ref={label}
          className="font-display whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-[var(--color-neon-amber)] opacity-0"
        />
      </div>
      <style>{`
        .cursor-ring--active { background: rgba(255,157,47,0.08); }
        .cursor-ring--label { width: 4.5rem; height: 4.5rem; }
        .cursor-ring--label span { opacity: 1 !important; }
      `}</style>
    </>
  );
}
