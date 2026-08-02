import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getProject } from "@/lib/workspace/queries";
import { formatDate, relativeTime } from "@/lib/workspace/format";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
} from "@/components/workspace/ui/Primitives";
import MilestoneEditor from "./MilestoneEditor";
import type { Milestone, Profile } from "@/lib/workspace/database.types";

type Row = Milestone & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

const TONE = {
  pending: "neutral",
  in_progress: "accent",
  done: "amber",
  approved: "green",
} as const;

const WORD = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Awaiting sign-off",
  approved: "Approved",
};

export default async function MilestonesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const [{ data: milestones }, { data: tasks }] = await Promise.all([
    supabase
      .from("milestones")
      .select("*, profiles:approved_by(full_name, email)")
      .eq("project_id", project.id)
      .order("order_index")
      .returns<Row[]>(),
    supabase
      .from("tasks")
      .select("id, title, status, milestone_id")
      .eq("project_id", project.id),
  ]);

  const list = milestones ?? [];
  const tasksByMilestone = new Map<string, { title: string; status: string }[]>();
  for (const task of tasks ?? []) {
    if (!task.milestone_id) continue;
    const bucket = tasksByMilestone.get(task.milestone_id) ?? [];
    bucket.push({ title: task.title, status: task.status });
    tasksByMilestone.set(task.milestone_id, bucket);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {list.length === 0 ? (
          <EmptyState title="No milestones yet">
            Milestones drive the client&apos;s progress ring and their approval
            flow — the percentage on their portal is computed from these, not
            typed in by hand.
          </EmptyState>
        ) : (
          list.map((milestone, index) => {
            const children = tasksByMilestone.get(milestone.id) ?? [];
            const doneCount = children.filter((t) => t.status === "done").length;

            return (
              <Card key={milestone.id}>
                <div className="flex items-start gap-3.5 p-5">
                  <span className="mono mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--ws-line-strong)] text-[11px] text-[var(--ws-muted)]">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-bold tracking-tight">
                        {milestone.title}
                      </h2>
                      <Badge tone={TONE[milestone.status]}>{WORD[milestone.status]}</Badge>
                    </div>

                    {milestone.description ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ws-muted)]">
                        {milestone.description}
                      </p>
                    ) : null}

                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--ws-faint)]">
                      <span>Due {formatDate(milestone.due_date)}</span>
                      {children.length ? (
                        <span className="mono">
                          {doneCount}/{children.length} tasks done
                        </span>
                      ) : null}
                      {milestone.approved_at ? (
                        <span className="text-[var(--ws-green)]">
                          Signed off by{" "}
                          {milestone.profiles?.full_name ??
                            milestone.profiles?.email ??
                            "the client"}{" "}
                          {relativeTime(milestone.approved_at)}
                        </span>
                      ) : null}
                    </p>

                    <div className="mt-3.5">
                      <MilestoneEditor milestone={milestone} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <div>
        <Card>
          <CardHeader title="Add a milestone" hint="Order follows creation" />
          <div className="p-4">
            <MilestoneEditor projectId={project.id} />
          </div>
        </Card>

        <p className="mt-3 px-1 text-[11px] leading-relaxed text-[var(--ws-faint)]">
          Mark a milestone <span className="text-[var(--ws-amber)]">done</span> and
          the client gets an Approve button on their timeline. Their sign-off is
          what flips it to approved — you can&apos;t do it for them.
        </p>
      </div>
    </div>
  );
}
