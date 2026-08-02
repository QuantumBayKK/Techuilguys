"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

/** Horizontal tab rail; scrolls rather than wrapping on narrow screens. */
export default function ProjectTabs({
  base,
  tabs,
}: {
  base: string;
  tabs: [string, string][];
}) {
  const pathname = usePathname();

  return (
    <nav className="ws-scroll -mx-1 overflow-x-auto border-b border-[var(--ws-line)]">
      <ul className="flex min-w-max gap-1 px-1">
        {tabs.map(([suffix, label]) => {
          const href = `${base}${suffix}`;
          const active = suffix === "" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={label}>
              <Link
                href={href}
                className={clsx(
                  "-mb-px block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                  active
                    ? "border-[var(--ws-accent)] font-semibold text-[var(--ws-text)]"
                    : "border-transparent text-[var(--ws-muted)] hover:text-[var(--ws-text)]",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
