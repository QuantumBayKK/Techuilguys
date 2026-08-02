import Link from "next/link";
import { requireStaff } from "@/lib/workspace/session";
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
  return { title: `${project.name} — Workspace` };
}

const TABS = [
  ["", "Overview"],
  ["/board", "Board"],
  ["/milestones", "Milestones"],
  ["/updates", "Updates"],
  ["/files", "Files"],
  ["/notes", "Internal notes"],
  ["/docs", "Docs"],
] as const;

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/workspace/projects"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-muted)] hover:text-[var(--ws-accent)]"
        >
          ← Projects
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
            {project.name}
          </h1>
          <StatusBadge status={project.status} />
          <HealthBadge health={project.health} note={project.health_note} />
          <Link
            href={`/workspace/portal/${project.slug}`}
            className="ml-auto text-xs font-semibold text-[var(--ws-muted)] hover:text-[var(--ws-accent)]"
            title="See exactly what the client sees"
          >
            Client view ↗
          </Link>
        </div>
      </div>

      <ProjectTabs base={`/workspace/projects/${slug}`} tabs={TABS.map(([h, l]) => [h, l])} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
