import { requireSession } from "@/lib/workspace/session";
import { getProject } from "@/lib/workspace/queries";
import UpdateFeed from "@/components/workspace/UpdateFeed";

export default async function PortalUpdatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSession();
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <div className="mx-auto max-w-3xl">
      <UpdateFeed projectId={project.id} />
    </div>
  );
}
