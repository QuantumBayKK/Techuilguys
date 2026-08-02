import { requireAdmin } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getOrganizations } from "@/lib/workspace/queries";
import { formatDate } from "@/lib/workspace/format";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/workspace/ui/Primitives";
import OrgForm from "./OrgForm";

export const metadata = { title: "Organizations — Workspace" };

export default async function OrganizationsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [organizations, { data: projects }, { data: people }] = await Promise.all([
    getOrganizations(),
    supabase.from("projects").select("id, organization_id"),
    supabase.from("profiles").select("id, organization_id").eq("role", "client"),
  ]);

  const projectCount = new Map<string, number>();
  for (const p of projects ?? []) {
    projectCount.set(p.organization_id, (projectCount.get(p.organization_id) ?? 0) + 1);
  }
  const clientCount = new Map<string, number>();
  for (const p of people ?? []) {
    if (!p.organization_id) continue;
    clientCount.set(p.organization_id, (clientCount.get(p.organization_id) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Each client company. This link is what the row-level security policies use to decide who sees which project."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          {organizations.length === 0 ? (
            <EmptyState title="No organizations yet">
              Create one per client company, then link their people to it. A
              client account with no organization can see nothing at all.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {organizations.map((org) => (
                <Card key={org.id} className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote client logo */}
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt=""
                        className="h-9 w-9 rounded-lg border border-[var(--ws-line)] object-contain"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ws-line)] text-sm font-semibold text-[var(--ws-faint)]">
                        {org.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{org.name}</p>
                      <p className="text-[11px] text-[var(--ws-muted)]">
                        {projectCount.get(org.id) ?? 0} project
                        {(projectCount.get(org.id) ?? 0) === 1 ? "" : "s"} ·{" "}
                        {clientCount.get(org.id) ?? 0} client account
                        {(clientCount.get(org.id) ?? 0) === 1 ? "" : "s"} · added{" "}
                        {formatDate(org.created_at)}
                      </p>
                    </div>
                  </div>
                  <OrgForm organization={org} />
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Add an organization" />
          <div className="p-4">
            <OrgForm />
          </div>
        </Card>
      </div>
    </>
  );
}
