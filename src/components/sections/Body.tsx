"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { DEALERS } from "@/data/dealers";
import { PROJECTS } from "@/data/projects";
import Marquee from "@/components/ui/Marquee";
import { SUIT_GLYPH } from "@/components/cards/CardFaces";
import ColorizeHands from "./ColorizeHands";
import { gsap, initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * The scrollable site body, revealed after the table. Heavy, weighty scroll
 * (Lenis) with line-mask text reveals. Holds About, the works strip, skills,
 * and the colorize-hands contact.
 */
export default function Body() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGsap();
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          yPercent: 120,
          opacity: 0,
          duration: 1,
          ease: "felt",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative z-20">
      {/* spacer so the table master shot reads before content scrolls up */}
      <section className="flex h-screen flex-col items-center justify-end pb-16 text-center">
        <p className="font-display animate-pulse text-[10px] uppercase tracking-[0.5em] text-[var(--color-muted)]">
          Scroll to explore the lounge ↓
        </p>
      </section>

      <div className="relative bg-gradient-to-b from-transparent via-[var(--color-noir)]/85 to-[var(--color-noir)]">
        <Marquee text="Techuila Guys · Tech you can drink to" />

        {/* About — the two principals */}
        <section className="mx-auto max-w-5xl px-6 py-28">
          <div className="overflow-hidden">
            <h2
              data-reveal
              className="font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-7xl"
            >
              Two dealers.
              <br />
              <span className="text-[var(--color-neon-amber)]">One table.</span>
            </h2>
          </div>
          <p className="mt-6 max-w-xl text-[var(--color-muted)]">
            Techuila Guys is a two-person studio that builds cinematic,
            engineered software. Every project we ship is a card we&apos;re
            proud to deal.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {DEALERS.map((d) => (
              <div
                key={d.id}
                className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={d.portrait}
                    alt={d.name}
                    fill
                    sizes="(max-width:640px) 100vw, 50vw"
                    className="object-cover transition-all duration-700 group-hover:scale-105"
                    style={{ filter: "grayscale(0.4) contrast(1.1)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-noir)] to-transparent" />
                </div>
                <div className="absolute bottom-0 p-5">
                  <p className="font-display text-2xl font-bold uppercase">
                    {d.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-brass)]">
                    {d.rank}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-[var(--color-muted)]">
                    {d.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Selected work strip */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 flex items-end justify-between">
            <h3 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-4xl">
              The full deck
            </h3>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
              {PROJECTS.length} cards
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {PROJECTS.map((p) => (
              <div
                key={p.id}
                data-cursor="View"
                className="group relative aspect-[3/4.4] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] p-4 transition-colors hover:border-[var(--color-line-warm)]"
                style={{ background: "linear-gradient(160deg,#14110c,#0b0907)" }}
              >
                <span className="font-display text-sm text-[var(--color-brass)]">
                  {p.rank} {SUIT_GLYPH[p.suit]}
                </span>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-display text-lg font-bold uppercase leading-tight transition-colors group-hover:text-[var(--color-neon-amber)]">
                    {p.title}
                  </p>
                  <p className="font-script text-sm text-[var(--color-brass-bright)]">
                    {p.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact — the colorizing hands */}
        <section className="mx-auto max-w-5xl px-6 py-28">
          <div className="mb-12 text-center">
            <h3 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
              Let&apos;s <span className="text-[var(--color-neon-amber)]">deal.</span>
            </h3>
            <p className="mt-3 text-[var(--color-muted)]">
              Got a hand worth playing? Reach across the table.
            </p>
          </div>

          <ColorizeHands />

          <div className="mt-12 flex flex-col items-center gap-6 text-center">
            <a
              href="mailto:info.quantumbay@gmail.com"
              data-cursor="Email"
              data-magnetic
              className="font-display rounded-full border border-[var(--color-line-warm)] px-8 py-4 text-lg uppercase tracking-[0.2em] transition-colors hover:bg-[var(--color-neon-amber)]/10"
            >
              info.quantumbay@gmail.com
            </a>
            <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-neon-amber)]">
                ● Available 2026
              </span>
              <span>Kailosh · Kenny</span>
            </div>
          </div>
        </section>

        <footer className="border-t border-[var(--color-line)] px-6 py-8 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--color-faint)]">
          Techuila Guys — V2.0 · Built in the browser
        </footer>
      </div>
    </div>
  );
}
