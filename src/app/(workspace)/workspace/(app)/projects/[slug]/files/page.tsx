import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getProject } from "@/lib/workspace/queries";
import FileManager from "@/components/workspace/FileManager";

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return <FileManager projectId={project.id} files={files ?? []} isStaff />;
}
