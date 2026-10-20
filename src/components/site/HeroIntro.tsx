"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import BrandMark from "./BrandMark";

/**
 * The hero's opening: the laptop lid opens, the screen lights, the brackets
 * slide in, the shot glass drops and fills, the lime lands. Then the headline
 * words rise. Hovering the mark tips the glass.
 *
 * Everything is visible without JavaScript; GSAP only plays it in. Reduced
 * motion skips straight to the final state.
 */
export default function HeroIntro({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const words = q("[data-hero-word]");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(q("#hero-bm-base"), { scaleX: 0.4, opacity: 0, transformOrigin: "50% 50%", duration: 0.5 })
        .from(q("#hero-bm-lid"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "power4.out" }, "-=0.15")
        .from(q("#hero-bm-screen"), { opacity: 0, duration: 0.4 }, "-=0.25")
        .from(q("#hero-bm-dots circle"), { scale: 0, transformOrigin: "50% 50%", stagger: 0.06, duration: 0.3, ease: "back.out(3)" }, "-=0.2")
        .from(q("#hero-bm-lb"), { x: -18, opacity: 0, duration: 0.45 }, "-=0.1")
        .from(q("#hero-bm-rb"), { x: 18, opacity: 0, duration: 0.45 }, "<")
        .from(q("#hero-bm-glass"), { y: -40, opacity: 0, duration: 0.55, ease: "back.out(1.6)" }, "-=0.25")
        .from(q("#hero-bm-liquid"), { attr: { y: 84 }, duration: 0.8, ease: "power2.inOut" }, "-=0.1")
        .from(q("#hero-bm-lime"), { rotate: -70, x: 10, y: -10, opacity: 0, transformOrigin: "0% 100%", duration: 0.5, ease: "back.out(2)" }, "-=0.45")
        .from(q("[data-hero-eyebrow]"), { opacity: 0, y: 10, duration: 0.5 }, "-=0.3")
        .from(words, { yPercent: 110, duration: 0.85, stagger: 0.05, ease: "power4.out" }, "-=0.3")
        .from(q("[data-hero-after]"), { opacity: 0, y: 18, stagger: 0.1, duration: 0.6 }, "-=0.45");

      // Hover: the glass tips and the lime wobbles.
      const mark = q("[data-hero-mark]")[0] as HTMLElement | undefined;
      if (mark) {
        const enter = () => {
          gsap.to(q("#hero-bm-glass"), { rotate: -8, transformOrigin: "50% 100%", duration: 0.4, ease: "power2.out" });
          gsap.fromTo(q("#hero-bm-lime"), { rotate: 0 }, { rotate: 14, transformOrigin: "0% 100%", duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" });
          gsap.to(q("#hero-bm-screen"), { attr: { fill: "#b8414a" }, duration: 0.3 });
        };
        const leave = () => {
          gsap.to(q("#hero-bm-glass"), { rotate: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
          gsap.to(q("#hero-bm-screen"), { attr: { fill: "#a3373c" }, duration: 0.4 });
        };
        mark.addEventListener("pointerenter", enter);
        mark.addEventListener("pointerleave", leave);
        return () => {
          mark.removeEventListener("pointerenter", enter);
          mark.removeEventListener("pointerleave", leave);
        };
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="flex flex-col items-center">
      <div data-hero-mark className="w-[150px] cursor-default md:w-[190px]">
        <BrandMark idPrefix="hero-bm" className="h-auto w-full drop-shadow-[0_20px_40px_rgba(214,31,44,0.35)]" />
      </div>
      {children}
    </div>
  );
}
