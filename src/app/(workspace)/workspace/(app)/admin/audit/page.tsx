import { requireAdmin } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/workspace/format";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/workspace/ui/Primitives";
import type { Profile } from "@/lib/workspace/database.types";

export const metadata = { title: "Audit log — Workspace" };

type Row = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: Pick<Profile, "full_name" | "email" | "avatar_url"> | null;
};

const TONE: Record<string, "accent" | "green" | "amber" | "red" | "neutral"> = {
  "milestone.approved": "green",
  "project.status": "accent",
  "profile.role": "amber",
  "file.deleted": "red",
};

const LABEL: Record<string, string> = {
  "milestone.approved": "Milestone approved",
  "project.status": "Project status changed",
  "profile.role": "Role or org changed",
  "file.deleted": "File deleted",
};

/**
 * Deliberately narrow — four event types, written by triggers, readable only by
 * admins and insertable by nobody. It costs one trigger and settles disputes.
 */
export default async function AuditPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, entity_type, entity_id, metadata, created_at, profiles:actor_id(full_name, email, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Row[]>();

  const entries = data ?? [];

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Milestone approvals, role changes, project status moves and file deletions. Written by database triggers — the app cannot forge or skip an entry."
      />

      {entries.length === 0 ? (
        <EmptyState title="Nothing logged yet">
          Entries appear the first time someone approves a milestone, changes a
          role, moves a project's status or deletes a file.
        </EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--ws-line)]">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                <Avatar
                  name={entry.profiles?.full_name}
                  email={entry.profiles?.email ?? "system"}
                  src={entry.profiles?.avatar_url}
                  size={26}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[entry.action] ?? "neutral"}>
                      {LABEL[entry.action] ?? entry.action}
                    </Badge>
                    <span className="text-[13px]">
                      {entry.profiles?.full_name ??
                        entry.profiles?.email ??
                        "System"}
                    </span>
                    <span className="text-[11px] text-[var(--ws-faint)]">
                      {relativeTime(entry.created_at)}
                    </span>
                  </p>
                  {entry.metadata ? (
                    <p className="mono mt-1 break-words text-[11px] text-[var(--ws-muted)]">
                      {Object.entries(entry.metadata)
                        .map(([key, value]) => `${key}=${String(value)}`)
                        .join("  ")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
