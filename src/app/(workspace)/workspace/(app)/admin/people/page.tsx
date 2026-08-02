import { requireAdmin } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getOrganizations } from "@/lib/workspace/queries";
import { relativeTime } from "@/lib/workspace/format";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/workspace/ui/Primitives";
import AccessForm from "./AccessForm";
import type { Profile } from "@/lib/workspace/database.types";

export const metadata = { title: "People — Workspace" };

const ROLE_TONE = {
  admin: "accent",
  employee: "live",
  client: "green",
  pending: "amber",
} as const;

/**
 * The gate that makes self-signup safe: a Google account gets you a `pending`
 * row and nothing else until someone here assigns a role.
 */
export default async function PeoplePage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: profiles }, organizations] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    getOrganizations(),
  ]);

  const all = (profiles ?? []) as Profile[];
  const pending = all.filter((p) => p.role === "pending");
  const active = all.filter((p) => p.role !== "pending");
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));

  return (
    <>
      <PageHeader
        title="People"
        description="Assign roles and link client accounts to their organization. Nothing is visible to a new signup until you do."
      />

      <Card className="mb-6">
        <CardHeader
          title="Awaiting approval"
          hint={pending.length ? `${pending.length} in the queue` : "Nobody waiting"}
        />
        {pending.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Queue is empty">
              New Google signups land here. Until you give them a role they see
              a holding screen and no data — row-level security returns them
              zero rows on every table.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--ws-line)]">
            {pending.map((person) => (
              <li key={person.id} className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar
                    name={person.full_name}
                    email={person.email}
                    src={person.avatar_url}
                    size={34}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {person.full_name ?? person.email.split("@")[0]}
                    </p>
                    <p className="mono truncate text-[11px] text-[var(--ws-muted)]">
                      {person.email} · signed up {relativeTime(person.created_at)}
                    </p>
                  </div>
                </div>
                <AccessForm profile={person} organizations={organizations} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Everyone" hint={`${active.length} with access`} />
        <ul className="divide-y divide-[var(--ws-line)]">
          {active.map((person) => (
            <li key={person.id} className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Avatar
                  name={person.full_name}
                  email={person.email}
                  src={person.avatar_url}
                  size={34}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold">
                    {person.full_name ?? person.email.split("@")[0]}
                    <Badge tone={ROLE_TONE[person.role]}>{person.role}</Badge>
                  </p>
                  <p className="mono truncate text-[11px] text-[var(--ws-muted)]">
                    {person.email}
                    {person.organization_id
                      ? ` · ${orgName.get(person.organization_id) ?? "unknown org"}`
                      : ""}
                  </p>
                </div>
              </div>
              <AccessForm profile={person} organizations={organizations} />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
