"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { HERO } from "@/content/site-copy";

/**
 * The hero's one-line brief. It doesn't send anything by itself: it carries the
 * text to /contact, where it pre-fills the brief so the visitor can finish and
 * send it there.
 */
export default function HeroPrompt() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const brief = value.trim();
        router.push(brief ? `/contact?brief=${encodeURIComponent(brief)}#brief` : "/contact#brief");
      }}
      className="w-full max-w-2xl"
    >
      <div className="prompt flex items-center gap-3 rounded-full bg-white/[0.04] py-2 pl-5 pr-2 backdrop-blur">
        <Sparkles size={16} aria-hidden className="shrink-0 text-accent" />
        <label htmlFor="hero-brief" className="sr-only">
          {HERO.promptPlaceholder}
        </label>
        <input
          id="hero-brief"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={HERO.promptPlaceholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-[1rem] text-white placeholder:text-white/50 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Continue to the brief"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent hover:text-night"
        >
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-white/70">{HERO.promptHelp}</p>
    </form>
  );
}
