import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  getProject,
  getProjectTeam,
  getStaffProfiles,
} from "@/lib/workspace/queries";
import { countdownLabel, formatDate, formatHours } from "@/lib/workspace/format";
import { Card, CardHeader, Stat } from "@/components/workspace/ui/Primitives";
import ProgressRing from "@/components/workspace/ui/ProgressRing";
import GithubWidget from "@/components/workspace/GithubWidget";
import ProjectSettings from "./ProjectSettings";
import ProjectTeam from "./ProjectTeam";

export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const [
    team,
    staff,
    { data: orgs },
    { data: tasks },
    { data: milestones },
    { data: time },
  ] = await Promise.all([
      getProjectTeam(project.id),
      getStaffProfiles(),
      supabase.from("organizations").select("id, name").order("name"),
      supabase.from("tasks").select("status, client_visible").eq("project_id", project.id),
      supabase
        .from("milestones")
        .select("title, due_date, status")
        .eq("project_id", project.id)
        .order("order_index"),
      supabase.from("time_logs").select("minutes").eq("project_id", project.id),
    ]);

  const taskList = tasks ?? [];
  const doneTasks = taskList.filter((t) => t.status === "done").length;
  const hiddenTasks = taskList.filter((t) => !t.client_visible).length;
  const next = (milestones ?? []).find((m) => m.status !== "done" && m.status !== "approved");
  const totalMinutes = (time ?? []).reduce((sum, row) => sum + row.minutes, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card className="flex flex-wrap items-center gap-7 p-6">
          <ProgressRing value={project.progress_pct} />
          <div className="min-w-[200px] flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-muted)]">
              Next milestone
            </p>
            <p className="font-display mt-1 text-xl font-bold tracking-tight">
              {next?.title ?? "Everything shipped"}
            </p>
            <p className="mt-1 text-[13px] text-[var(--ws-muted)]">
              {next
                ? `${countdownLabel(next.due_date)}${next.due_date ? ` · ${formatDate(next.due_date)}` : ""}`
                : "No milestone is outstanding."}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--ws-muted)]">Started</dt>
                <dd className="mono">{formatDate(project.start_date)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--ws-muted)]">Target</dt>
                <dd className="mono">{formatDate(project.target_date)}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Tasks done" value={`${doneTasks}/${taskList.length}`} />
          <Stat
            label="Milestones"
            value={`${(milestones ?? []).filter((m) => m.status === "approved").length}/${(milestones ?? []).length}`}
            sub="Approved"
          />
          <Stat label="Hidden from client" value={hiddenTasks} sub="Internal tasks" />
          <Stat label="Time logged" value={formatHours(totalMinutes)} />
        </div>

        {project.description ? (
          <Card>
            <CardHeader title="Brief" hint="Visible to the client" />
            <p className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed text-[var(--ws-muted)]">
              {project.description}
            </p>
          </Card>
        ) : null}

        {session.isStaff ? (
          <Card>
            <CardHeader
              title="Settings"
              hint={session.isAdmin ? "Admins can also delete" : "Employees can edit status and health"}
            />
            <div className="p-5">
              <ProjectSettings
                project={project}
                organizations={orgs ?? []}
                canDelete={session.isAdmin}
              />
            </div>
          </Card>
        ) : null}
      </div>

      <div className="space-y-5">
        <ProjectTeam
          projectId={project.id}
          team={team}
          staff={staff}
          canEdit={session.isAdmin}
        />
        {project.github_repo ? <GithubWidget repo={project.github_repo} /> : null}
      </div>
    </div>
  );
}
