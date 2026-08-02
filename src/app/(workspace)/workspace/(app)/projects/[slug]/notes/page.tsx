import { requireStaff } from "@/lib/workspace/session";
import { getProject } from "@/lib/workspace/queries";
import { Card } from "@/components/workspace/ui/Primitives";
import CommentThread from "@/components/workspace/CommentThread";

export default async function InternalNotesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 rounded-xl border border-[var(--ws-internal-line)] bg-[var(--ws-internal)] px-4 py-3">
        <p className="text-[13px] font-semibold text-[var(--ws-amber)]">
          Internal only — the client cannot read this page
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ws-muted)]">
          Scope creep, pricing, client behaviour, anything you&apos;d say out
          loud in the room. Enforced in Postgres: the read policy on{" "}
          <span className="mono">comments</span> filters{" "}
          <span className="mono">internal_only = true</span> out for every client
          account, so this can&apos;t leak through a mis-scoped query either.
        </p>
      </div>

      <Card className="p-5">
        <CommentThread
          projectId={project.id}
          parentType="project"
          parentId={project.id}
          internalOnly
        />
      </Card>
    </div>
  );
}
