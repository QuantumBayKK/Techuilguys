import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getProject } from "@/lib/workspace/queries";
import { relativeTime } from "@/lib/workspace/format";
import { Card, CardHeader, EmptyState } from "@/components/workspace/ui/Primitives";
import RequestForm from "./RequestForm";
import type { RequestStatus, RequestType } from "@/lib/workspace/database.types";

/** The intake box, plus the client's own pipeline so they stop chasing us. */
const PIPELINE: [RequestStatus, string][] = [
  ["new", "Received"],
  ["reviewing", "Reviewing"],
  ["accepted", "Accepted"],
  ["done", "Done"],
];

const TYPE_LABEL: Record<RequestType, string> = {
  new_project: "New project",
  change: "Change",
  bug: "Bug",
  question: "Question",
};

export default async function PortalRequestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, description, request_type, status, created_at")
    .eq("organization_id", project.organization_id)
    .order("created_at", { ascending: false });

  const list = requests ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader title="Send us something" hint="Change, bug, question" />
        <div className="p-4">
          <RequestForm
            projectId={project.id}
            organizationId={project.organization_id}
            canSubmit={session.isClient || session.isAdmin}
          />
        </div>
      </Card>

      <div>
        {list.length === 0 ? (
          <EmptyState title="No requests yet">
            Anything you send lands in our internal queue, and you&apos;ll watch
            it move through the stages right here — no chasing needed.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {list.map((request) => {
              const rejected = request.status === "rejected";
              const stage = PIPELINE.findIndex(([s]) => s === request.status);

              return (
                <Card key={request.id} className="p-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="font-display text-base font-bold tracking-tight">
                      {request.title}
                    </h2>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--ws-muted)]">
                      {TYPE_LABEL[request.request_type]} ·{" "}
                      {relativeTime(request.created_at)}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ws-muted)]">
                    {request.description}
                  </p>

                  {rejected ? (
                    <p className="mt-3.5 text-xs font-semibold text-[var(--ws-muted)]">
                      Not going ahead — we&apos;ll have explained why.
                    </p>
                  ) : (
                    <ol className="mt-4 flex gap-1.5">
                      {PIPELINE.map(([status, label], index) => {
                        const reached = stage >= index;
                        return (
                          <li key={status} className="flex-1">
                            <span
                              aria-hidden
                              className="block h-1 rounded-full"
                              style={{
                                background: reached
                                  ? "var(--ws-accent)"
                                  : "var(--ws-hover)",
                              }}
                            />
                            <span
                              className="mt-1.5 block text-[10px] uppercase tracking-[0.1em]"
                              style={{
                                color: reached
                                  ? "var(--ws-accent)"
                                  : "var(--ws-faint)",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
