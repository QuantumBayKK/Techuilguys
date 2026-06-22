"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pebble-in-a-pond reveal. When the block scrolls into view its content emerges
 * through an expanding circular "water surface" (clip-path) while concentric
 * ripple rings radiate outward — like a pebble dropped at the top of the
 * section, the rings traversing the layers of the pond. One-shot; disabled
 * under reduced-motion (content just shows).
 */
export default function RippleReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ripple-reveal ${shown ? "is-in" : ""} ${className}`}>
      <span className="ripple-rings" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <div className="ripple-content">{children}</div>
    </div>
  );
}
