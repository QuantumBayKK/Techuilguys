"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { setScroll } from "@/lib/scrollSignal";
import { initGsap, ScrollTrigger } from "@/lib/gsap";
import { experience } from "@/lib/experience";
import { useCapability } from "@/lib/useCapability";

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
      duration: 1.25, // heavy, weighty momentum
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    // sync GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    let raf = 0;
    let eased = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      const raw = (lenis as any).velocity ?? 0;
      // ease toward raw; snaps back to 0 on scroll-stop (power2-ish)
      eased += (raw - eased) * 0.12;
      const norm = Math.max(-2, Math.min(2, eased * 0.045));
      setScroll({
        raw,
        velocity: norm,
        progress: (lenis as any).progress ?? 0,
        direction: raw > 0.01 ? 1 : raw < -0.01 ? -1 : 0,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Lock scroll until the experience reaches the body stage.
    const apply = () => {
      const inBody = experience.get().stage === "body";
      if (inBody) lenis.start();
      else lenis.stop();
    };
    apply();
    const unsub = experience.subscribe(apply);

    document.documentElement.classList.add("lenis");

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
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
