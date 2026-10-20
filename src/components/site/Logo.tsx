import Link from "next/link";

/** Wordmark with a small amber monogram. Always sits on a dark surface. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Techuila Guys, home"
      className={`inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-[1.05rem] font-medium tracking-[-0.02em] text-white ${className}`}
    >
      <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden className="shrink-0">
        <rect width="28" height="28" rx="8" fill="var(--color-accent)" />
        <path d="M7.5 8.5h13v3h-5v9h-3v-9h-5z" fill="var(--color-night)" />
      </svg>
      techuila<span className="text-accent">guys</span>
    </Link>
  );
}
