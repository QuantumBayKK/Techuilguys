"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * A red ring that trails the pointer and swells over anything clickable,
 * showing a short label from `data-cursor` when present. Purely decorative: the
 * native cursor stays visible, so text selection, links and forms work as usual.
 * Desktop pointers only; off for reduced motion.
 */
export default function CursorRing() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: 0.3 });
        shown = true;
      }
      x(e.clientX);
      y(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor], input, textarea, select");
      const text = target?.dataset.cursor ?? "";
      if (label.current) label.current.textContent = text;
      gsap.to(el, {
        scale: target ? (text ? 2.6 : 1.7) : 1,
        backgroundColor: text ? "rgba(214,31,44,0.92)" : "rgba(214,31,44,0)",
        duration: 0.3,
        ease: "power3.out",
      });
    };
    const leaveWindow = () => gsap.to(el, { opacity: 0, duration: 0.2 });

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leaveWindow);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leaveWindow);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] -ml-4 -mt-4 grid h-8 w-8 place-items-center rounded-full border border-accent-deep/80 opacity-0"
    >
      <span
        ref={label}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.4] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.15em] text-white"
      />
    </div>
  );
}
