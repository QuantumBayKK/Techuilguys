import Link from "next/link";
import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { countdownLabel, formatDate } from "@/lib/workspace/format";
import {
  ButtonLink,
  Card,
  EmptyState,
  HealthBadge,
  PageHeader,
  StatusBadge,
} from "@/components/workspace/ui/Primitives";
import type { Project } from "@/lib/workspace/database.types";

export const metadata = { title: "Projects — Workspace" };

export default async function ProjectsPage() {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const [{ data: projects }, { data: orgs }, { data: milestones }] =
    await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("organizations").select("id, name, logo_url"),
      supabase
        .from("milestones")
        .select("project_id, title, due_date, status")
        .in("status", ["pending", "in_progress"])
        .order("order_index"),
    ]);

  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  // Next milestone per project — the first not-yet-finished one in order.
  const nextMilestone = new Map<string, { title: string; due_date: string | null }>();
  for (const m of milestones ?? []) {
    if (!nextMilestone.has(m.project_id)) {
      nextMilestone.set(m.project_id, { title: m.title, due_date: m.due_date });
    }
  }

  const list = (projects ?? []) as Project[];

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every build we're running, and who it belongs to."
        action={
          session.isAdmin ? (
            <ButtonLink href="/workspace/projects/new" variant="primary">
              New project
            </ButtonLink>
          ) : null
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No projects yet"
          action={
            session.isAdmin ? (
              <ButtonLink href="/workspace/projects/new" variant="primary">
                Create the first project
              </ButtonLink>
            ) : (
              <span className="text-xs text-[var(--ws-faint)]">
                An admin needs to create one.
              </span>
            )
          }
        >
          A project is the unit everything hangs off — board, milestones,
          deliverables and the client&apos;s portal all come from it.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((project) => {
            const org = orgById.get(project.organization_id);
            const next = nextMilestone.get(project.id);

            return (
              <Card
                key={project.id}
                className="transition-colors hover:border-[var(--ws-line-strong)]"
              >
                <Link href={`/workspace/projects/${project.slug}`} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] uppercase tracking-[0.14em] text-[var(--ws-muted)]">
                        {org?.name ?? "Unassigned"}
                      </p>
                      <h2 className="font-display mt-1 truncate text-lg font-bold tracking-tight">
                        {project.name}
                      </h2>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="mt-3">
                    <HealthBadge health={project.health} note={project.health_note} />
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--ws-muted)]">
                        Progress
                      </span>
                      <span className="mono text-xs font-semibold">
                        {project.progress_pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ws-hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--ws-accent)]"
                        style={{ width: `${project.progress_pct}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 space-y-1.5 border-t border-[var(--ws-line)] pt-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--ws-muted)]">Next up</dt>
                      <dd className="truncate text-right font-medium">
                        {next?.title ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--ws-muted)]">Target</dt>
                      <dd className="mono text-right">
                        {project.target_date ? (
                          <span
                            title={formatDate(project.target_date)}
                            className={
                              countdownLabel(project.target_date).includes("overdue")
                                ? "text-[var(--ws-red)]"
                                : undefined
                            }
                          >
                            {countdownLabel(project.target_date)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
