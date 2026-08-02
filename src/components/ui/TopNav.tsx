"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Global top nav — static on every page, every scroll position. A small
 * wordmark on the left, and top-right a pair: a ghost "Client login" that drops
 * into the workspace, and the fluid "HIRE US" button that books a call. The one
 * job of this site: get the click.
 */
const CAL = "https://cal.com/pranauvshrinaath";

export default function TopNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[95] flex items-center justify-between px-4 py-3 sm:px-7 sm:py-4">
      <Link
        href="/"
        data-cursor="Home"
        className="font-display pointer-events-auto text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink)] transition-colors hover:text-[var(--color-neon-amber)] sm:text-xs"
      >
        Techuila <span className="text-[var(--color-neon-amber)]">Guys</span>
        <span className="ml-1.5 text-[var(--color-brass)]">♠♣</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* The workspace door. Same silhouette as HIRE US, ghosted so it reads
            as secondary — clients know to look here, prospects don't trip on it. */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, type: "spring", stiffness: 120, damping: 14 }}
        >
          <Link
            href="/workspace"
            data-cursor="Client workspace"
            data-magnetic
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line-warm)] bg-[var(--color-noir)]/60 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink)] backdrop-blur-md transition-colors hover:border-[var(--color-neon-amber)] hover:text-[var(--color-neon-amber)] sm:px-5 sm:text-xs"
          >
            <span className="hidden sm:inline">Client login</span>
            <span className="sm:hidden">Login</span>
          </Link>
        </motion.div>

        <motion.a
          href={CAL}
          target="_blank"
          rel="noreferrer"
          data-cursor="Book a call"
          data-magnetic
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 14 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="hire-btn pointer-events-auto relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-[var(--color-neon-amber)] bg-[var(--color-neon-amber)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-noir)] shadow-[0_8px_24px_-8px_rgba(255,157,47,0.7)] sm:px-5 sm:text-xs"
        >
          <span className="relative z-10">Hire us</span>
          <span className="relative z-10">↗</span>
        </motion.a>
      </div>
    </header>
  );
}
