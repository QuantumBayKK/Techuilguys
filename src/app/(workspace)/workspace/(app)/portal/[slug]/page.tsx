import Link from "next/link";
import { FileText, Flag, ListChecks, Megaphone } from "lucide-react";
import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getActivity, getProject, getProjectTeam } from "@/lib/workspace/queries";
import { countdownLabel, formatDate, relativeTime } from "@/lib/workspace/format";
import {
  Avatar,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
} from "@/components/workspace/ui/Primitives";
import ProgressRing from "@/components/workspace/ui/ProgressRing";

const ICONS = {
  update: Megaphone,
  milestone: Flag,
  file: FileText,
  task: ListChecks,
} as const;

/** The client's landing page. One number, one next step, one live feed. */
export default async function PortalOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const [{ data: milestones }, team, activity, { data: tasks }] = await Promise.all([
    supabase
      .from("milestones")
      .select("id, title, status, due_date")
      .eq("project_id", project.id)
      .order("order_index"),
    getProjectTeam(project.id),
    getActivity(project.id, 10),
    // Staff previewing this page must see the *client's* board, not theirs.
    supabase
      .from("tasks")
      .select("status")
      .eq("project_id", project.id)
      .eq("client_visible", true),
  ]);

  const list = milestones ?? [];
  const next = list.find((m) => m.status !== "done" && m.status !== "approved");
  const awaiting = list.filter((m) => m.status === "done");
  const visibleTasks = tasks ?? [];
  const doneTasks = visibleTasks.filter((t) => t.status === "done").length;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card className="flex flex-wrap items-center gap-8 p-6 sm:p-7">
          <ProgressRing value={project.progress_pct} />

          <div className="min-w-[220px] flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-accent)]">
              Next up
            </p>
            <p className="font-display mt-1.5 text-2xl font-bold leading-tight tracking-tight">
              {next?.title ?? "Everything's shipped"}
            </p>
            <p className="mt-2 text-[13px] text-[var(--ws-muted)]">
              {next ? (
                <>
                  <span
                    className={
                      countdownLabel(next.due_date).includes("overdue")
                        ? "font-semibold text-[var(--ws-red)]"
                        : "font-semibold text-[var(--ws-text)]"
                    }
                  >
                    {countdownLabel(next.due_date)}
                  </span>
                  {next.due_date ? ` · ${formatDate(next.due_date)}` : ""}
                </>
              ) : (
                "No milestone is outstanding. Nice."
              )}
            </p>

            <dl className="mono mt-5 flex flex-wrap gap-x-7 gap-y-2 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--ws-muted)]">
                  Milestones
                </dt>
                <dd className="mt-0.5 font-semibold">
                  {list.filter((m) => m.status === "approved").length}/{list.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--ws-muted)]">
                  Tasks done
                </dt>
                <dd className="mt-0.5 font-semibold">
                  {doneTasks}/{visibleTasks.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--ws-muted)]">
                  Target
                </dt>
                <dd className="mt-0.5 font-semibold">{formatDate(project.target_date)}</dd>
              </div>
            </dl>
          </div>
        </Card>

        {awaiting.length > 0 ? (
          <Card className="ws-pulse border-[var(--ws-accent)]/40 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-accent)]">
              Waiting on you
            </p>
            <p className="font-display mt-1 text-lg font-bold tracking-tight">
              {awaiting.length} milestone{awaiting.length > 1 ? "s" : ""} ready for
              sign-off
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--ws-muted)]">
              We&apos;ve marked {awaiting.length > 1 ? "them" : "it"} done. Have a
              look, and approve when you&apos;re happy.
            </p>
            <ButtonLink
              href={`/workspace/portal/${slug}/timeline`}
              variant="primary"
              className="mt-4"
            >
              Review the timeline
            </ButtonLink>
          </Card>
        ) : null}

        {project.description ? (
          <Card>
            <CardHeader title="What we're building" />
            <p className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed text-[var(--ws-muted)]">
              {project.description}
            </p>
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title="Activity"
            hint="The last ten things that happened"
            action={
              <Link
                href={`/workspace/portal/${slug}/updates`}
                className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
              >
                All updates
              </Link>
            }
          />
          {activity.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Nothing has happened yet">
                Kickoff is where this fills up — every update, completed
                milestone and new deliverable shows here as it lands.
              </EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--ws-line)]">
              {activity.map((item) => {
                const Icon = ICONS[item.kind];
                return (
                  <li key={`${item.kind}-${item.id}`} className="flex gap-3 px-5 py-3">
                    <Icon size={14} className="mt-0.5 shrink-0 text-[var(--ws-accent)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">{item.title}</p>
                      <p className="text-[11px] text-[var(--ws-faint)]">
                        {item.detail} · {relativeTime(item.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Your team" hint="Who's on this" />
          {team.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-[var(--ws-muted)]">
              Being assigned now.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ws-line)]">
              {team.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar
                    name={member.full_name}
                    email={member.email}
                    src={member.avatar_url}
                    size={32}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">
                      {member.full_name ?? member.email.split("@")[0]}
                    </p>
                    <p className="truncate text-[11px] text-[var(--ws-muted)]">
                      {member.role_on_project ?? "Engineer"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <p className="font-display text-base font-bold tracking-tight">
            Need something?
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ws-muted)]">
            A change, a bug, or just a question — send it through and you&apos;ll
            see it move through our queue.
          </p>
          <ButtonLink
            href={`/workspace/portal/${slug}/requests`}
            variant="outline"
            className="mt-4 w-full"
          >
            Open a request
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
