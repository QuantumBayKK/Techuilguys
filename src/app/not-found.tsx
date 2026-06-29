import Link from "next/link";

export const metadata = { title: "Dead hand — Techuila Guys" };

/** Themed 404: you played a card that isn't in the deck. */
export default function NotFound() {
  return (
    <main className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute select-none text-[40vw] font-bold leading-none text-[var(--color-brass)]/[0.05]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        404
      </span>
      <p className="font-script relative text-2xl text-[var(--color-brass-bright)] sm:text-3xl">
        that card isn&apos;t in the deck
      </p>
      <h1 className="font-display relative mt-1 text-4xl font-bold uppercase tracking-tight sm:text-6xl">
        Dead <span className="text-[var(--color-neon-amber)]">hand</span>
      </h1>
      <p className="relative mt-4 max-w-sm text-sm text-[var(--color-muted)]">
        You folded into a page that doesn&apos;t exist. The dealer&apos;s waiting
        — come back to the table.
      </p>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          data-cursor="Home"
          className="font-display rounded-full border border-[var(--color-line-warm)] px-6 py-3 text-[11px] uppercase tracking-[0.3em] transition-colors hover:bg-[var(--color-neon-amber)]/10"
        >
          ← Back to the table
        </Link>
      </div>
    </main>
  );
}
