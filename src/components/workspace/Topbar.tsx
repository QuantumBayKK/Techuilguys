"use client";

import { Search } from "lucide-react";
import type { Profile } from "@/lib/workspace/database.types";
import { openCommandPalette } from "./CommandPalette";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

/**
 * Thin sticky bar. Left: your brand + the client's, side by side — cheap to
 * build, disproportionately impressive on a client's screen.
 */
export default function Topbar({
  profile,
  org,
  children,
}: {
  profile: Profile;
  org: { name: string; logo_url: string | null } | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-[100] flex items-center gap-2 border-b border-[var(--ws-line)] bg-[var(--ws-bg)]/85 px-3 py-2.5 backdrop-blur-md sm:px-5">
      {children}

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="font-display hidden text-[11px] uppercase tracking-[0.2em] text-[var(--ws-muted)] sm:inline">
          Techuila <span className="text-[var(--ws-accent)]">Guys</span>
        </span>
        {org ? (
          <>
            <span aria-hidden className="hidden text-[var(--ws-faint)] sm:inline">
              ×
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote client logo */}
              {org.logo_url ? (
                <img src={org.logo_url} alt="" className="h-5 w-5 rounded object-contain" />
              ) : null}
              <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-text)]">
                {org.name}
              </span>
            </span>
          </>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center gap-2 rounded-lg border border-[var(--ws-line)] px-2.5 py-1.5 text-xs text-[var(--ws-faint)] transition-colors hover:border-[var(--ws-line-strong)] hover:text-[var(--ws-muted)]"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="mono hidden rounded border border-[var(--ws-line)] px-1 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
        <NotificationBell profileId={profile.id} />
        <ThemeToggle />
      </div>
    </header>
  );
}
