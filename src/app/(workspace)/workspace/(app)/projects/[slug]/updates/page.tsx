import { requireStaff } from "@/lib/workspace/session";
import { getProject } from "@/lib/workspace/queries";
import { Card, CardHeader } from "@/components/workspace/ui/Primitives";
import UpdateFeed from "@/components/workspace/UpdateFeed";
import UpdateComposer from "./UpdateComposer";

export default async function ProjectUpdatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div>
        <UpdateFeed projectId={project.id} canDelete />
      </div>

      <div className="lg:order-first">
        <Card className="lg:sticky lg:top-20">
          <CardHeader title="Post an update" hint="Goes to the client immediately" />
          <div className="p-4">
            <UpdateComposer projectId={project.id} />
          </div>
        </Card>
      </div>
    </div>
  );
}
