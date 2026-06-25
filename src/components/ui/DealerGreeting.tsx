"use client";

import { useEffect, useState } from "react";
import { greeting } from "@/lib/dealerPatter";

/**
 * #94 + #100 — a line in the dealer's voice that adapts to the visitor's local
 * time AND whether they've been to the table before (localStorage flag). Renders
 * nothing on the server pass to avoid a hydration mismatch, then fades the line
 * in once we know the clock. Drop it anywhere a warm one-liner fits.
 */
export default function DealerGreeting({ className = "" }: { className?: string }) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    const KEY = "techuila.seen";
    const returning = localStorage.getItem(KEY) === "1";
    setLine(greeting(new Date().getHours(), returning));
    localStorage.setItem(KEY, "1");
  }, []);

  if (!line) return null;
  return (
    <span
      className={className}
      style={{
        opacity: 0,
        animation: "greetFade 0.9s ease forwards",
      }}
    >
      {line}
    </span>
  );
}
