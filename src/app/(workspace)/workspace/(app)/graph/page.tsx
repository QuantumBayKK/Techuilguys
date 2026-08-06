import Link from "next/link";
import { Share2 } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { PageHeader, EmptyState } from "@/components/workspace/ui/Primitives";
import type { Graph } from "@/lib/workspace/database.types";
import GraphView from "./GraphView";

export const metadata = { title: "Knowledge graph · Workspace" };

/**
 * `knowledge_graph()` is SECURITY INVOKER and drops any edge whose endpoints
 * did not both survive RLS — so a client's graph contains only their own
 * organization's work, with no dangling lines hinting at what they can't see.
 */
export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  await requireSession();
  const supabase = await supabaseServer();

  const [{ data, error }, { data: projects }] = await Promise.all([
    supabase.rpc("knowledge_graph", { p_project: p ?? null }),
    supabase.from("projects").select("id, name, slug").order("name"),
  ]);

  const graph = (data as Graph | null) ?? { nodes: [], edges: [] };
  const scoped = projects?.find((x) => x.id === p);

  return (
    <>
      <PageHeader
        eyebrow="Knowledge graph"
        title={scoped ? scoped.name : "Everything, connected"}
        description="Projects, tasks, documents, meetings and boards, plus every [[wiki link]] and manual connection between them."
      />

      {(projects ?? []).length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Chip href="/workspace/graph" active={!p}>
            Whole workspace
          </Chip>
          {(projects ?? []).map((proj) => (
            <Chip key={proj.id} href={`/workspace/graph?p=${proj.id}`} active={p === proj.id}>
              {proj.name}
            </Chip>
          ))}
        </div>
      ) : null}

      {error ? (
        <EmptyState title="The graph could not be built">
          Run <code>supabase/migrations/0002_collaboration.sql</code> — the
          <code> knowledge_graph()</code> function is missing.
        </EmptyState>
      ) : graph.nodes.length === 0 ? (
        <EmptyState art={<Share2 size={34} strokeWidth={1.25} />} title="Nothing to draw yet">
          The graph builds itself from what you create. Add a project, write a
          document, link one page to another with double brackets.
        </EmptyState>
      ) : (
        <>
          <GraphView graph={graph} />
          <p className="mt-4 text-[12px] text-[var(--ws-faint)]">
            {graph.nodes.length} nodes · {graph.edges.length} connections
          </p>
        </>
      )}
    </>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? "border-[var(--ws-text)] bg-[var(--ws-accent-soft)] font-semibold text-[var(--ws-text)]"
          : "border-[var(--ws-line)] text-[var(--ws-muted)] hover:bg-[var(--ws-hover)]"
      }`}
    >
      {children}
    </Link>
  );
}
