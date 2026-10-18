import Link from "next/link";

/** Wordmark with a small felt-and-brass monogram. `tone` follows the ground it sits on. */
export default function Logo({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  return (
    <Link
      href="/"
      aria-label="Techuila Guys, home"
      className={`inline-flex items-center gap-2.5 font-[family-name:var(--font-heading)] text-[1.05rem] font-bold tracking-[-0.02em] ${
        tone === "ink" ? "text-ink" : "text-paper"
      }`}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
        <rect width="28" height="28" rx="7" fill="var(--color-felt)" />
        <path d="M7.5 8.5h13v3h-5v9h-3v-9h-5z" fill="var(--color-brass)" />
      </svg>
      Techuila Guys
    </Link>
  );
}
