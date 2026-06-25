"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Clean scroll-in reveal. (Formerly the "pebble-in-a-pond" ripple — the
 * concentric rings + circular clip-path were removed; content now just fades
 * and lifts into place.) One-shot; disabled under reduced-motion.
 *
 * Kept the name/exports so existing call sites don't change.
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
    <div ref={ref} className={`reveal-in ${shown ? "is-in" : ""} ${className}`}>
      {children}
    </div>
  );
}
