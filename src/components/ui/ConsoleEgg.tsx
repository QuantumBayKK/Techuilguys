"use client";

import { useEffect } from "react";

/**
 * #76 — the console easter egg. Anyone who opens devtools on a poker site is
 * exactly the kind of curious person worth talking to, so they get a dealt hand
 * in ASCII and a quiet hire-me note. Runs once, guarded so HMR doesn't spam.
 */
declare global {
  interface Window {
    __techuilaEgg?: boolean;
  }
}

export default function ConsoleEgg() {
  useEffect(() => {
    if (window.__techuilaEgg) return;
    window.__techuilaEgg = true;

    const brass = "color:#c9a24b;font-weight:bold";
    const amber = "color:#ff9d2f";
    const muted = "color:#9a8f7d";

    // A royal flush — the nuts. You found it.
    const hand = [
      "┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐",
      "│10 ♠ │ │ J ♠ │ │ Q ♠ │ │ K ♠ │ │ A ♠ │",
      "│     │ │     │ │     │ │     │ │     │",
      "│ ♠ 10│ │ ♠ J │ │ ♠ Q │ │ ♠ K │ │ ♠ A │",
      "└─────┘ └─────┘ └─────┘ └─────┘ └─────┘",
    ].join("\n");

    console.log("%c" + hand, "color:#f0d690;font-family:monospace");
    console.log("%cRoyal flush. The nuts. You went looking — we like that.", brass);
    console.log(
      "%cWe build cinematic, engineered software. Want a hand like this on your project?",
      amber
    );
    console.log("%c→ techuilaguys@gmail.com  ·  book: cal.com/pranauvshrinaath", muted);

    (window as unknown as { techuila?: Record<string, () => string> }).techuila = {
      allIn: () => {
        console.log("%c🂡 Shoved. We'll see you at the table.", amber);
        return "all in.";
      },
    };
  }, []);

  return null;
}
