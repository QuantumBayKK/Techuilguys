"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { Profile } from "@/lib/workspace/database.types";
import Sidebar, { type NavProject } from "./Sidebar";
import Topbar from "./Topbar";
import CommandPalette from "./CommandPalette";
import { PresenceHeartbeat } from "./Presence";

export default function Shell({
  profile,
  org,
  projects,
  openRequests,
  children,
}: {
  profile: Profile;
  org: { name: string; logo_url: string | null } | null;
  projects: NavProject[];
  openRequests: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Navigating on mobile should close the drawer behind you.
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[236px_1fr]">
      <CommandPalette isStaff={profile.role !== "client"} />
      <PresenceHeartbeat />

      {/* Desktop rail */}
      <div className="hidden border-r border-[var(--ws-line)] bg-[var(--ws-surface)] lg:block">
        <div className="sticky top-0 h-[100svh] overflow-y-auto">
          <Sidebar profile={profile} org={org} projects={projects} openRequests={openRequests} />
        </div>
      </div>

      {/* Mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="ws-in absolute inset-y-0 left-0 w-[268px] overflow-y-auto border-r border-[var(--ws-line)] bg-[var(--ws-surface)]">
            <Sidebar profile={profile} org={org} projects={projects} openRequests={openRequests} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Topbar profile={profile} org={org}>
          <button
            type="button"
            aria-label={drawer ? "Close navigation" : "Open navigation"}
            onClick={() => setDrawer((v) => !v)}
            className="-ml-1 rounded-lg p-2 text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)] lg:hidden"
          >
            {drawer ? <X size={18} /> : <Menu size={18} />}
          </button>
        </Topbar>

        <main
          key={pathname}
          className="ws-in mx-auto w-full max-w-[1180px] flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
