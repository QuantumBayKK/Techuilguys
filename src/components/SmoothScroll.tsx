"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { setScroll } from "@/lib/scrollSignal";
import { initGsap, ScrollTrigger } from "@/lib/gsap";
import { experience } from "@/lib/experience";
import { useCapability } from "@/lib/useCapability";
import { audio } from "@/lib/audio";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const cap = useCapability();

  useEffect(() => {
    initGsap();

    const lenis = new Lenis({
      lerp: 0.1, // single, frame-rate-independent smoothing — weighty but responsive
      smoothWheel: true,
      wheelMultiplier: 1,
      // Let mobile keep its native, GPU-accelerated momentum scroll: hijacking
      // touch with JS smoothing is what makes phones feel laggy. Smooth the
      // wheel on desktop only.
      syncTouch: false,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    let raf = 0;
    let eased = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      const raw = (lenis as unknown as { velocity?: number }).velocity ?? 0;
      eased += (raw - eased) * 0.12;
      const norm = Math.max(-2, Math.min(2, eased * 0.045));
      setScroll({
        raw,
        velocity: norm,
        progress: (lenis as unknown as { progress?: number }).progress ?? 0,
        direction: raw > 0.01 ? 1 : raw < -0.01 ? -1 : 0,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    document.documentElement.classList.add("lenis");

    // Unlock audio + flag "started" on the first real user gesture.
    const wake = () => {
      audio.unlock();
      experience.set({ started: true });
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("touchstart", wake);
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("wheel", wake, { passive: true });
    window.addEventListener("touchstart", wake, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);

  // Reduced motion: kill smoothing, fall back to native scroll.
  useEffect(() => {
    if (cap.ready && cap.reducedMotion) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
    }
  }, [cap.ready, cap.reducedMotion]);

  return <>{children}</>;
}
