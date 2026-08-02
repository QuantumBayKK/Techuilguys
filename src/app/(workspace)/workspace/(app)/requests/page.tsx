import Link from "next/link";
import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/workspace/format";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/workspace/ui/Primitives";
import RequestStatusPicker from "./RequestStatusPicker";
import type { RequestStatus, RequestType } from "@/lib/workspace/database.types";

export const metadata = { title: "Requests — Workspace" };

type Row = {
  id: string;
  title: string;
  description: string;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
  project_id: string | null;
  organizations: { name: string } | null;
  profiles: { full_name: string | null; email: string } | null;
  projects: { name: string; slug: string } | null;
};

const STATUS_TONE = {
  new: "accent",
  reviewing: "amber",
  accepted: "green",
  rejected: "neutral",
  done: "green",
} as const;

const LANES: [RequestStatus, string][] = [
  ["new", "New"],
  ["reviewing", "Reviewing"],
  ["accepted", "Accepted"],
  ["done", "Done"],
  ["rejected", "Rejected"],
];

/** Client intake. Everything a client submits lands here first. */
export default async function RequestsPage() {
  await requireStaff();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("requests")
    .select(
      "id, title, description, request_type, status, created_at, project_id, organizations(name), profiles:submitted_by(full_name, email), projects(name, slug)",
    )
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  const requests = data ?? [];

  return (
    <>
      <PageHeader
        title="Requests"
        description="Change requests, bugs, questions and new-project enquiries from clients."
      />

      {requests.length === 0 ? (
        <EmptyState title="Inbox zero">
          When a client submits from their request box it appears here — and
          they can watch the status move without emailing you to ask.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {LANES.map(([status, label]) => {
            const lane = requests.filter((r) => r.status === status);
            if (lane.length === 0) return null;

            return (
              <section key={status}>
                <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-muted)]">
                  {label}
                  <span className="mono text-[var(--ws-faint)]">{lane.length}</span>
                </h2>

                <div className="space-y-3">
                  {lane.map((request) => (
                    <Card key={request.id} className="p-5">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={STATUS_TONE[request.status]}>
                              {request.request_type.replace("_", " ")}
                            </Badge>
                            <h3 className="font-display text-base font-bold tracking-tight">
                              {request.title}
                            </h3>
                          </div>

                          <p className="mt-1 text-[11px] text-[var(--ws-faint)]">
                            {request.organizations?.name} ·{" "}
                            {request.profiles?.full_name ??
                              request.profiles?.email ??
                              "Unknown"}{" "}
                            · {relativeTime(request.created_at)}
                            {request.projects ? (
                              <>
                                {" · "}
                                <Link
                                  href={`/workspace/projects/${request.projects.slug}`}
                                  className="text-[var(--ws-accent)] hover:underline"
                                >
                                  {request.projects.name}
                                </Link>
                              </>
                            ) : null}
                          </p>

                          <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ws-muted)]">
                            {request.description}
                          </p>
                        </div>

                        <RequestStatusPicker id={request.id} status={request.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
