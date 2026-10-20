"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

const ITEMS = ["Web apps", "SaaS platforms", "Mobile apps", "Product design", "AI features", "Automation", "Payments", "Internal tools", "APIs"];

/**
 * A slow line of what we build. Screen readers get the list once; the moving
 * copy is decorative. It has a pause button, and stops for reduced motion.
 */
export default function Ticker() {
  const [paused, setPaused] = useState(false);
  const row = [...ITEMS, ...ITEMS];

  return (
    <section aria-label="What we build" className="relative z-0 overflow-hidden bg-band pt-14 md:pt-20">
      <ul className="sr-only">
        {ITEMS.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <div aria-hidden className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="ticker" data-paused={paused}>
          {row.map((item, i) => (
            <span key={i} className="flex shrink-0 items-center gap-8 whitespace-nowrap pr-8 font-[family-name:var(--font-heading)] text-2xl font-light text-ink/45 md:text-3xl">
              {item}
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>
      <div className="wrap mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the moving list" : "Pause the moving list"}
          className="grid h-8 w-8 place-items-center rounded-full border border-rule text-muted transition-colors hover:text-ink motion-reduce:hidden"
        >
          {paused ? <Play size={13} aria-hidden /> : <Pause size={13} aria-hidden />}
        </button>
      </div>
    </section>
  );
}
