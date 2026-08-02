import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getProject, getStaffProfiles } from "@/lib/workspace/queries";
import Board from "./Board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const [{ data: tasks }, { data: milestones }, staff] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index"),
    supabase
      .from("milestones")
      .select("id, title")
      .eq("project_id", project.id)
      .order("order_index"),
    getStaffProfiles(),
  ]);

  return (
    <Board
      projectId={project.id}
      githubRepo={project.github_repo}
      initialTasks={tasks ?? []}
      milestones={milestones ?? []}
      staff={staff}
    />
  );
}
