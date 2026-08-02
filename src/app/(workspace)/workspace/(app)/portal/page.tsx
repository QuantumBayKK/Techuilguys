import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { countdownLabel } from "@/lib/workspace/format";
import {
  Card,
  EmptyState,
  HealthBadge,
  PageHeader,
  StatusBadge,
} from "@/components/workspace/ui/Primitives";
import ProgressRing from "@/components/workspace/ui/ProgressRing";

export const metadata = { title: "Your projects — Techuila Guys" };

/**
 * Client landing. One project is the common case, so we send them straight in
 * rather than making them click through a list of one.
 */
export default async function PortalIndex() {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const list = projects ?? [];
  if (list.length === 1) redirect(`/workspace/portal/${list[0].slug}`);

  return (
    <>
      <PageHeader
        eyebrow="Your workspace"
        title={
          session.profile.full_name
            ? `Welcome back, ${session.profile.full_name.split(" ")[0]}`
            : "Your projects"
        }
        description="Live progress on everything we're building for you."
      />

      {list.length === 0 ? (
        <EmptyState title="Nothing here yet">
          Your account is active but no project is linked to it. That&apos;s on
          us — drop us a line and we&apos;ll connect it.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((project) => (
            <Card key={project.id} className="transition-colors hover:border-[var(--ws-line-strong)]">
              <Link
                href={`/workspace/portal/${project.slug}`}
                className="flex items-center gap-5 p-5"
              >
                <ProgressRing value={project.progress_pct} size={92} stroke={7} label="done" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-lg font-bold tracking-tight">
                    {project.name}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={project.status} />
                    <HealthBadge health={project.health} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--ws-muted)]">
                    {project.target_date
                      ? countdownLabel(project.target_date)
                      : "No target date set"}
                  </p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
