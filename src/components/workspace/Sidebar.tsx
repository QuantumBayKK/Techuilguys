"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  PenTool,
  Share2,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import type { Profile, ProjectStatus } from "@/lib/workspace/database.types";
import { Avatar } from "./ui/Primitives";
import SignOutButton from "./SignOutButton";

export type NavProject = { slug: string; name: string; status: ProjectStatus };

export default function Sidebar({
  profile,
  org,
  projects,
  openRequests,
}: {
  profile: Profile;
  org: { name: string; logo_url: string | null } | null;
  projects: NavProject[];
  openRequests: number;
}) {
  const pathname = usePathname();
  const isStaff = profile.role === "admin" || profile.role === "employee";
  const base = isStaff ? "/workspace/projects" : "/workspace/portal";

  return (
    <nav className="flex min-h-[100svh] flex-col px-3 py-4">
      <Link
        href="/workspace"
        className="font-display mb-5 flex items-center gap-2 px-2 text-[11px] uppercase tracking-[0.2em]"
      >
        Techuila <span className="text-[var(--ws-accent)]">Guys</span>
        <span className="text-[var(--ws-faint)]">♠♣</span>
      </Link>

      {isStaff ? (
        <Group>
          <Item href="/workspace/dashboard" icon={LayoutDashboard} active={pathname === "/workspace/dashboard"}>
            Dashboard
          </Item>
          <Item
            href="/workspace/projects"
            icon={FolderKanban}
            active={pathname === "/workspace/projects"}
          >
            Projects
          </Item>
          <Item
            href="/workspace/requests"
            icon={Inbox}
            active={pathname.startsWith("/workspace/requests")}
            badge={openRequests || undefined}
          >
            Requests
          </Item>
          <Item href="/workspace/time" icon={Clock} active={pathname.startsWith("/workspace/time")}>
            Time
          </Item>
        </Group>
      ) : null}

      {/* Everything below is scoped by RLS rather than by role: a client sees
          the same links, and each page shows them only what was shared. */}
      <Group label="Collaborate">
        <Item
          href="/workspace/calendar"
          icon={CalendarDays}
          active={pathname.startsWith("/workspace/calendar")}
        >
          Calendar
        </Item>
        <Item
          href="/workspace/meetings"
          icon={Video}
          active={pathname.startsWith("/workspace/meetings")}
        >
          Meetings
        </Item>
        <Item
          href="/workspace/chat"
          icon={MessageSquare}
          active={pathname.startsWith("/workspace/chat")}
        >
          Chat
        </Item>
        <Item
          href="/workspace/whiteboard"
          icon={PenTool}
          active={pathname.startsWith("/workspace/whiteboard")}
        >
          Whiteboard
        </Item>
      </Group>

      <Group label="Knowledge">
        <Item
          href="/workspace/docs"
          icon={FileText}
          active={pathname.startsWith("/workspace/docs")}
        >
          Documents
        </Item>
        <Item
          href="/workspace/wiki"
          icon={BookOpen}
          active={pathname.startsWith("/workspace/wiki")}
        >
          Wiki
        </Item>
        <Item
          href="/workspace/graph"
          icon={Share2}
          active={pathname.startsWith("/workspace/graph")}
        >
          Graph
        </Item>
      </Group>

      <div className="mt-5 min-h-0 flex-1">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
          {isStaff ? "Projects" : "Your projects"}
        </p>

        {projects.length === 0 ? (
          <p className="px-2 py-2 text-xs leading-relaxed text-[var(--ws-faint)]">
            {isStaff
              ? "No projects yet."
              : "Nothing assigned yet — we'll link your project here."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map((p) => {
              const href = `${base}/${p.slug}`;
              const active = pathname.startsWith(href);
              return (
                <li key={p.slug}>
                  <Link
                    href={href}
                    className={clsx(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-[var(--ws-accent-soft)] font-semibold text-[var(--ws-accent)]"
                        : "text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]",
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          p.status === "launched"
                            ? "var(--ws-green)"
                            : p.status === "paused"
                              ? "var(--ws-faint)"
                              : "var(--ws-accent)",
                      }}
                    />
                    <span className="truncate">{p.name}</span>
                  </Link>

                  {active ? <SubNav base={href} isStaff={isStaff} pathname={pathname} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {profile.role === "admin" ? (
        <Group label="Admin">
          <Item href="/workspace/admin/people" icon={Users} active={pathname.startsWith("/workspace/admin/people")}>
            People
          </Item>
          <Item
            href="/workspace/admin/organizations"
            icon={Building2}
            active={pathname.startsWith("/workspace/admin/organizations")}
          >
            Organizations
          </Item>
          <Item href="/workspace/admin/audit" icon={ShieldCheck} active={pathname.startsWith("/workspace/admin/audit")}>
            Audit log
          </Item>
        </Group>
      ) : null}

      <div className="mt-4 border-t border-[var(--ws-line)] pt-3">
        {org ? (
          <div className="mb-2.5 flex items-center gap-2 px-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- client logos
                are arbitrary remote URLs; not worth a remotePatterns allowlist. */}
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt=""
                className="h-5 w-5 rounded object-contain"
              />
            ) : (
              <Building2 size={14} className="text-[var(--ws-faint)]" />
            )}
            <span className="truncate text-[11px] text-[var(--ws-muted)]">
              {org.name}
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 px-2">
          <Avatar
            name={profile.full_name}
            email={profile.email}
            src={profile.avatar_url}
            size={30}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {profile.full_name ?? profile.email.split("@")[0]}
            </p>
            <p className="text-[11px] capitalize leading-tight text-[var(--ws-faint)]">
              {profile.role}
            </p>
          </div>
        </div>

        <div className="mt-2.5 px-2">
          <SignOutButton className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ws-faint)] hover:text-[var(--ws-accent)]" />
        </div>
      </div>
    </nav>
  );
}

function SubNav({
  base,
  isStaff,
  pathname,
}: {
  base: string;
  isStaff: boolean;
  pathname: string;
}) {
  const items = isStaff
    ? [
        ["", "Overview"],
        ["/board", "Board"],
        ["/milestones", "Milestones"],
        ["/updates", "Updates"],
        ["/files", "Files"],
        ["/notes", "Internal notes"],
        ["/docs", "Docs"],
      ]
    : [
        ["", "Overview"],
        ["/timeline", "Timeline"],
        ["/updates", "Updates"],
        ["/files", "Deliverables"],
        ["/requests", "Requests"],
      ];

  return (
    <ul className="mb-1.5 ml-[13px] mt-0.5 border-l border-[var(--ws-line)] pl-2.5">
      {items.map(([suffix, label]) => {
        const href = `${base}${suffix}`;
        const active = suffix === "" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={label}>
            <Link
              href={href}
              className={clsx(
                "block rounded-md px-2 py-1 text-xs transition-colors",
                active
                  ? "font-semibold text-[var(--ws-text)]"
                  : "text-[var(--ws-faint)] hover:text-[var(--ws-text)]",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Group({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      {label ? (
        <p className="mb-1.5 mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
          {label}
        </p>
      ) : null}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function Item({
  href,
  icon: Icon,
  active,
  badge,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
          active
            ? "bg-[var(--ws-accent-soft)] font-semibold text-[var(--ws-accent)]"
            : "text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]",
        )}
      >
        <Icon size={15} />
        <span className="flex-1">{children}</span>
        {badge ? (
          <span className="mono rounded-full bg-[var(--ws-accent)] px-1.5 text-[10px] font-bold text-[var(--ws-accent-ink)]">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
