"use client";

import { useEffect } from "react";
import { timeBand } from "@/lib/dealerPatter";

/**
 * #49 — Time-of-day table lighting. Reads the VISITOR's local hour and stamps
 * `data-timeband` on <html>; the CSS in globals.css does the rest (warm wash by
 * day, smoky + dimmed after midnight). Also paints a single fixed overlay so the
 * whole room shifts mood. Re-checks on an interval in case a tab is left open
 * across a band boundary. Self-contained, render-once, zero layout impact.
 */
export default function TimeOfDay() {
  useEffect(() => {
    const apply = () => {
      const band = timeBand(new Date().getHours());
      document.documentElement.setAttribute("data-timeband", band);
    };
    apply();
    const id = window.setInterval(apply, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return <div aria-hidden className="room-light" />;
}
