"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "@/lib/audio";

/**
 * #89 — back-to-top as "rack the chips". A chip button that appears once you've
 * scrolled in; clicking it clatters a rack of chips and scrolls home.
 */
export default function RackTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const rack = () => {
    // a quick clatter of chips
    audio.play("chip");
    [120, 210, 300].forEach((d, i) =>
      window.setTimeout(() => audio.play("clack", { rate: 1.1 + i * 0.15 }), d)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          data-cursor="Rack up"
          data-magnetic
          onClick={rack}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 16 }}
          className="group fixed bottom-5 right-5 z-[80] grid h-12 w-12 place-items-center"
        >
          <svg viewBox="0 0 48 48" className="h-11 w-11 drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
            <defs>
              <radialGradient id="rackChip" cx="40%" cy="34%" r="70%">
                <stop offset="0%" stopColor="#fff8e8" />
                <stop offset="45%" stopColor="#e9e1cf" />
                <stop offset="74%" stopColor="#cdbf9f" />
                <stop offset="100%" stopColor="#a98f63" />
              </radialGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill="url(#rackChip)" stroke="#8a6f2f" strokeWidth="0.75" />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x="22.4" y="1.6" width="3.2" height="6" rx="1.2" fill={i % 2 === 0 ? "#c9a24b" : "#b6a378"} transform={`rotate(${i * 30} 24 24)`} />
            ))}
            <circle cx="24" cy="24" r="15" fill="none" stroke="#c9a24b" strokeWidth="1.3" opacity="0.8" />
            <path d="M18 27 l6 -7 l6 7" fill="none" stroke="#1a1410" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
