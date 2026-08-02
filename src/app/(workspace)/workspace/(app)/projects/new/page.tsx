import Link from "next/link";
import { requireAdmin } from "@/lib/workspace/session";
import { getOrganizations } from "@/lib/workspace/queries";
import { PageHeader, Card, EmptyState, ButtonLink } from "@/components/workspace/ui/Primitives";
import NewProjectForm from "./NewProjectForm";

export const metadata = { title: "New project — Workspace" };

export default async function NewProjectPage() {
  await requireAdmin();
  const organizations = await getOrganizations();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={
          <Link href="/workspace/projects" className="hover:underline">
            ← Projects
          </Link>
        }
        title="New project"
        description="Milestones, board, deliverables and the client portal all hang off this."
      />

      {organizations.length === 0 ? (
        <EmptyState
          title="Create an organization first"
          action={
            <ButtonLink href="/workspace/admin/organizations" variant="primary">
              Add an organization
            </ButtonLink>
          }
        >
          Every project belongs to a client organization — that link is what the
          row-level security policies use to decide who sees what.
        </EmptyState>
      ) : (
        <Card className="p-5">
          <NewProjectForm organizations={organizations} />
        </Card>
      )}
    </div>
  );
}
