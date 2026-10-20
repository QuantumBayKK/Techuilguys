import Link from "next/link";
import BrandMark, { Wordmark } from "./BrandMark";

/** The laptop-and-shot mark beside the wordmark. Always sits on a dark surface. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Techuila Guys, home"
      className={`logo-link group inline-flex items-center gap-2.5 text-white ${className}`}
    >
      <BrandMark idPrefix="nav-bm" title="" className="h-[22px] w-auto shrink-0 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110" />
      <Wordmark className="text-[0.95rem]" />
    </Link>
  );
}
