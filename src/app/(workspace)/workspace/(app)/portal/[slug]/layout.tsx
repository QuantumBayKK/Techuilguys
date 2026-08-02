import Link from "next/link";
import { requireSession } from "@/lib/workspace/session";
import { getProject } from "@/lib/workspace/queries";
import { HealthBadge, StatusBadge } from "@/components/workspace/ui/Primitives";
import ProjectTabs from "@/components/workspace/ProjectTabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  return { title: `${project.name} — Techuila Guys` };
}

const TABS: [string, string][] = [
  ["", "Overview"],
  ["/timeline", "Timeline"],
  ["/updates", "Updates"],
  ["/files", "Deliverables"],
  ["/requests", "Requests"],
];

export default async function PortalProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const session = await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <div>
      {/* Staff land here through the "Client view" link. Say so plainly so
          nobody mistakes it for the internal board. */}
      {session.isStaff ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ws-internal-line)] bg-[var(--ws-internal)] px-3.5 py-2 text-xs">
          <span className="font-semibold text-[var(--ws-amber)]">
            Client view — this page hides everything marked internal.
          </span>
          <Link
            href={`/workspace/projects/${slug}`}
            className="ml-auto font-semibold text-[var(--ws-accent)] hover:underline"
          >
            Back to the internal project →
          </Link>
        </div>
      ) : null}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[30px]">
          {project.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={project.status} />
          <HealthBadge health={project.health} note={project.health_note} />
        </div>
      </div>

      <ProjectTabs base={`/workspace/portal/${slug}`} tabs={TABS} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
