"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tiny IntersectionObserver hook. Embedded demos use it to ONLY animate while
 * they're on screen — offscreen demos add no compositor or paint cost. This is
 * the main reason the page stays smooth on low-end machines.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  opts: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px", threshold: 0.25 }
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), opts);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inView };
}
