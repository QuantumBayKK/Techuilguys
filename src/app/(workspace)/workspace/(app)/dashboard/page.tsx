import Link from "next/link";
import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  formatHours,
  isoDate,
  relativeTime,
  startOfWeek,
} from "@/lib/workspace/format";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  HealthBadge,
  PageHeader,
  Stat,
  StatusBadge,
} from "@/components/workspace/ui/Primitives";
export const metadata = { title: "Dashboard — Workspace" };

/**
 * The one screen that answers "what needs me today". Everything on it is a
 * queue or a warning; anything merely informational lives on the project pages.
 */
export default async function DashboardPage() {
  const session = await requireStaff();
  const supabase = await supabaseServer();
  const weekStart = isoDate(startOfWeek());

  const [
    { data: projects },
    { data: pendingUsers },
    { data: approvals },
    { data: openRequests },
    { data: week },
    { data: staff },
    { data: latestUpdates },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .eq("role", "pending")
      .order("created_at"),
    supabase
      .from("milestones")
      .select("id, title, due_date, projects(name, slug)")
      .eq("status", "done")
      .order("due_date", { nullsFirst: false })
      .returns<
        {
          id: string;
          title: string;
          due_date: string | null;
          projects: { name: string; slug: string } | null;
        }[]
      >(),
    supabase
      .from("requests")
      .select("id, title, request_type, status, created_at, organizations(name)")
      .in("status", ["new", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<
        {
          id: string;
          title: string;
          request_type: string;
          status: string;
          created_at: string;
          organizations: { name: string } | null;
        }[]
      >(),
    supabase
      .from("time_logs")
      .select("minutes, profile_id")
      .gte("logged_date", weekStart),
    supabase
      .from("profiles")
      .select("id, full_name, email, weekly_capacity_hours")
      .in("role", ["admin", "employee"])
      .order("full_name"),
    supabase
      .from("updates")
      .select("project_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const list = projects ?? [];
  const active = list.filter((p) => p.status !== "launched" && p.status !== "paused");

  // Days since the client last heard anything. This is the number that catches
  // a project quietly going dark on you.
  const lastUpdateAt = new Map<string, string>();
  for (const u of latestUpdates ?? []) {
    if (!lastUpdateAt.has(u.project_id)) lastUpdateAt.set(u.project_id, u.created_at);
  }

  const neglected = active
    .map((p) => ({ project: p, days: daysSince(lastUpdateAt.get(p.id)) }))
    .filter((row) => row.days === null || row.days >= 7)
    .sort((a, b) => (b.days ?? 999) - (a.days ?? 999));

  const minutesByPerson = new Map<string, number>();
  for (const row of week ?? []) {
    minutesByPerson.set(
      row.profile_id,
      (minutesByPerson.get(row.profile_id) ?? 0) + row.minutes,
    );
  }
  const teamMinutes = [...minutesByPerson.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${greeting()}, ${session.profile.full_name?.split(" ")[0] ?? "there"}`}
        title="Dashboard"
        description="Where the work stands, and what's waiting on you."
        action={
          session.isAdmin ? (
            <ButtonLink href="/workspace/projects/new" variant="primary">
              New project
            </ButtonLink>
          ) : null
        }
      />

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active projects" value={active.length} sub={`${list.length} total`} />
        <Stat
          label="Awaiting approval"
          value={approvals?.length ?? 0}
          sub="Milestones marked done"
          tone={approvals?.length ? "amber" : undefined}
        />
        <Stat
          label="Open requests"
          value={openRequests?.length ?? 0}
          sub="New or in review"
          tone={openRequests?.length ? "accent" : undefined}
        />
        <Stat
          label="Logged this week"
          value={formatHours(teamMinutes)}
          sub="Across the team"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Projects"
              hint="Health at a glance"
              action={
                <Link
                  href="/workspace/projects"
                  className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
                >
                  All projects
                </Link>
              }
            />
            {list.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No projects yet">
                  Create the first one and the board, timeline and client portal
                  all light up from it.
                </EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--ws-line)]">
                {list.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/workspace/projects/${p.slug}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--ws-hover)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {p.name}
                          </span>
                          <StatusBadge status={p.status} />
                        </span>
                        <span className="mt-1 block">
                          <HealthBadge health={p.health} note={p.health_note} />
                        </span>
                      </span>
                      <ProgressBar value={p.progress_pct} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Client health"
              hint="Days since the client last heard from us"
            />
            {neglected.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[var(--ws-muted)]">
                Every active project has been updated in the last week. Good.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ws-line)]">
                {neglected.slice(0, 6).map(({ project, days }) => (
                  <li
                    key={project.id}
                    className="flex items-center gap-4 px-5 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/workspace/projects/${project.slug}/updates`}
                        className="truncate text-[13px] font-semibold hover:text-[var(--ws-accent)]"
                      >
                        {project.name}
                      </Link>
                      <span className="mt-0.5 block text-xs text-[var(--ws-muted)]">
                        {days === null
                          ? "No update has ever been posted"
                          : `${days} days of silence`}
                      </span>
                    </span>
                    <Link
                      href={`/workspace/projects/${project.slug}/updates`}
                      className="shrink-0 text-xs font-semibold text-[var(--ws-accent)] hover:underline"
                    >
                      Post one →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          {session.isAdmin ? (
            <Card>
              <CardHeader title="Pending signups" hint="Waiting on a role" />
              {!pendingUsers?.length ? (
                <p className="px-5 py-6 text-center text-xs text-[var(--ws-muted)]">
                  Nobody in the queue.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--ws-line)]">
                  {pendingUsers.map((u) => (
                    <li key={u.id} className="px-5 py-3">
                      <p className="truncate text-[13px] font-semibold">
                        {u.full_name ?? u.email.split("@")[0]}
                      </p>
                      <p className="mono truncate text-[11px] text-[var(--ws-muted)]">
                        {u.email}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--ws-faint)]">
                        Signed up {relativeTime(u.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-[var(--ws-line)] px-5 py-2.5">
                <Link
                  href="/workspace/admin/people"
                  className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
                >
                  Manage access →
                </Link>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Pending approvals" hint="Client sign-off needed" />
            {!approvals?.length ? (
              <p className="px-5 py-6 text-center text-xs text-[var(--ws-muted)]">
                Nothing waiting on a client.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ws-line)]">
                {approvals.slice(0, 6).map((m) => (
                  <li key={m.id} className="px-5 py-3">
                    <p className="truncate text-[13px] font-semibold">{m.title}</p>
                    <p className="truncate text-[11px] text-[var(--ws-muted)]">
                      {m.projects?.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Utilization" hint="This week vs capacity" />
            <ul className="divide-y divide-[var(--ws-line)]">
              {(staff ?? []).map((person) => {
                const minutes = minutesByPerson.get(person.id) ?? 0;
                const capacity = person.weekly_capacity_hours * 60;
                const pct = capacity ? Math.round((minutes / capacity) * 100) : 0;
                return (
                  <li key={person.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px]">
                        {person.full_name ?? person.email.split("@")[0]}
                      </span>
                      <span className="mono shrink-0 text-xs text-[var(--ws-muted)]">
                        {formatHours(minutes)} / {person.weekly_capacity_hours}h
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--ws-hover)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background:
                            pct > 100
                              ? "var(--ws-red)"
                              : pct > 80
                                ? "var(--ws-amber)"
                                : "var(--ws-accent)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-[var(--ws-line)] px-5 py-2.5">
              <Link
                href="/workspace/time"
                className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
              >
                Timesheets →
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Request queue" />
            {!openRequests?.length ? (
              <p className="px-5 py-6 text-center text-xs text-[var(--ws-muted)]">
                Inbox zero.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ws-line)]">
                {openRequests.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <p className="truncate text-[13px] font-semibold">{r.title}</p>
                    <p className="text-[11px] text-[var(--ws-muted)]">
                      {r.organizations?.name} · {r.request_type} ·{" "}
                      {relativeTime(r.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-[var(--ws-line)] px-5 py-2.5">
              <Link
                href="/workspace/requests"
                className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
              >
                Open the queue →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <span className="hidden w-28 shrink-0 sm:block">
      <span className="mono mb-1 block text-right text-[11px] text-[var(--ws-muted)]">
        {value}%
      </span>
      <span className="block h-1 overflow-hidden rounded-full bg-[var(--ws-hover)]">
        <span
          className="block h-full rounded-full bg-[var(--ws-accent)]"
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

function daysSince(iso: string | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}
