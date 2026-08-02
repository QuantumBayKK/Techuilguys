import { requireStaff } from "@/lib/workspace/session";
import { getProject } from "@/lib/workspace/queries";
import { EmptyState, ButtonLink } from "@/components/workspace/ui/Primitives";
import NotionDoc from "@/components/workspace/NotionDoc";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project.notion_page_id) {
    return (
      <EmptyState
        title="No Notion page linked"
        action={
          <ButtonLink href={`/workspace/projects/${slug}`} variant="primary">
            Link one in settings
          </ButtonLink>
        }
      >
        Specs and meeting notes stay in Notion where you already write them —
        this tab renders them inside the branded workspace so the client never
        leaves.
      </EmptyState>
    );
  }

  return <NotionDoc pageId={project.notion_page_id} />;
}
