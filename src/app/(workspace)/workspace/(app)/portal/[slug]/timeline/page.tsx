import { Check } from "lucide-react";
import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getProject } from "@/lib/workspace/queries";
import { countdownLabel, formatDate, relativeTime } from "@/lib/workspace/format";
import { Badge, Card, EmptyState } from "@/components/workspace/ui/Primitives";
import ApproveButton from "./ApproveButton";
import type { MilestoneStatus } from "@/lib/workspace/database.types";

type Row = {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  approved_at: string | null;
};

/**
 * The vertical timeline. Completed steps are filled, the current one pulses,
 * and anything marked done grows an Approve button — the single interaction
 * that turns the client from spectator into participant.
 */
export default async function TimelinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const [{ data: milestones }, { data: tasks }] = await Promise.all([
    supabase
      .from("milestones")
      .select("id, title, description, status, due_date, approved_at")
      .eq("project_id", project.id)
      .order("order_index")
      .returns<Row[]>(),
    supabase
      .from("tasks")
      .select("id, title, status, milestone_id")
      .eq("project_id", project.id)
      .eq("client_visible", true)
      .order("order_index"),
  ]);

  const list = milestones ?? [];
  const currentIndex = list.findIndex(
    (m) => m.status !== "done" && m.status !== "approved",
  );

  if (list.length === 0) {
    return (
      <EmptyState title="The plan is being drawn up">
        Once we agree the milestones they appear here as a timeline — each one
        expandable, each one yours to sign off.
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="relative">
        {list.map((milestone, index) => {
          const complete = milestone.status === "approved" || milestone.status === "done";
          const current = index === currentIndex;
          const children = (tasks ?? []).filter((t) => t.milestone_id === milestone.id);
          const doneCount = children.filter((t) => t.status === "done").length;

          return (
            <li key={milestone.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* the rail */}
              {index < list.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-8 h-full w-px"
                  style={{
                    background: complete ? "var(--ws-accent)" : "var(--ws-line)",
                  }}
                />
              ) : null}

              <span
                aria-hidden
                className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  current ? "ws-pulse" : ""
                }`}
                style={{
                  borderColor:
                    milestone.status === "approved"
                      ? "var(--ws-green)"
                      : complete || current
                        ? "var(--ws-accent)"
                        : "var(--ws-line-strong)",
                  background:
                    milestone.status === "approved"
                      ? "var(--ws-green)"
                      : milestone.status === "done"
                        ? "var(--ws-accent)"
                        : "var(--ws-bg)",
                  color: complete ? "var(--ws-accent-ink)" : "var(--ws-muted)",
                }}
              >
                {complete ? (
                  <Check size={15} strokeWidth={3} />
                ) : (
                  <span className="mono text-[11px]">{index + 1}</span>
                )}
              </span>

              <Card
                className={`min-w-0 flex-1 p-5 ${
                  current ? "border-[var(--ws-accent)]/40" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-bold tracking-tight">
                    {milestone.title}
                  </h2>
                  {milestone.status === "approved" ? (
                    <Badge tone="green">Approved</Badge>
                  ) : milestone.status === "done" ? (
                    <Badge tone="accent">Ready for your sign-off</Badge>
                  ) : current ? (
                    <Badge tone="accent">In progress</Badge>
                  ) : (
                    <Badge>Upcoming</Badge>
                  )}
                </div>

                {milestone.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ws-muted)]">
                    {milestone.description}
                  </p>
                ) : null}

                <p className="mt-2 text-[11px] text-[var(--ws-faint)]">
                  {milestone.approved_at
                    ? `You approved this ${relativeTime(milestone.approved_at)}`
                    : milestone.due_date
                      ? `${countdownLabel(milestone.due_date)} · ${formatDate(milestone.due_date)}`
                      : "No date set"}
                </p>

                {children.length > 0 ? (
                  <details className="group mt-3">
                    <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ws-muted)] hover:text-[var(--ws-accent)]">
                      {doneCount}/{children.length} tasks
                      <span className="ml-1 inline-block transition-transform group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <ul className="mt-2.5 space-y-1.5">
                      {children.map((task) => (
                        <li key={task.id} className="flex items-center gap-2 text-[13px]">
                          <span
                            aria-hidden
                            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border"
                            style={{
                              borderColor:
                                task.status === "done"
                                  ? "var(--ws-green)"
                                  : "var(--ws-line-strong)",
                              background:
                                task.status === "done" ? "var(--ws-green)" : "transparent",
                            }}
                          />
                          <span
                            className={
                              task.status === "done"
                                ? "text-[var(--ws-muted)] line-through"
                                : undefined
                            }
                          >
                            {task.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {milestone.status === "done" ? (
                  <div className="mt-4 rounded-lg border border-[var(--ws-accent)]/30 bg-[var(--ws-accent-soft)] p-3.5">
                    <p className="text-[13px] font-semibold">
                      Happy with this milestone?
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ws-muted)]">
                      Approving records your sign-off and tells the team to move
                      on to the next stage.
                    </p>
                    <div className="mt-3">
                      <ApproveButton
                        id={milestone.id}
                        disabled={session.isStaff && !session.isAdmin}
                        disabledReason={
                          session.isStaff && !session.isAdmin
                            ? "Only the client can approve this."
                            : undefined
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
