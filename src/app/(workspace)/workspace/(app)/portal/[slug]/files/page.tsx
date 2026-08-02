import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getProject } from "@/lib/workspace/queries";
import FileManager from "@/components/workspace/FileManager";

export default async function PortalFilesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);
  const supabase = await supabaseServer();

  // Explicit client_visible filter so a staff member previewing this page sees
  // exactly the client's list, not their own fuller one.
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", project.id)
    .eq("client_visible", true)
    .order("created_at", { ascending: false });

  return (
    <FileManager projectId={project.id} files={files ?? []} isStaff={false} />
  );
}
