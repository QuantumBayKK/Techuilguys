import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { relativeTime } from "@/lib/workspace/format";
import { PageHeader, EmptyState } from "@/components/workspace/ui/Primitives";
import type { Doc, DocKind, DocVersion, Profile } from "@/lib/workspace/database.types";
import DocTree, { type TreeDoc } from "./DocTree";
import DocView from "./DocView";
import NewDocButton from "./NewDocButton";

/**
 * Documents and the wiki are the same table and the same UI. The only real
 * difference is scope — a doc belongs to a project, a wiki page belongs to the
 * workspace — so both surfaces are rendered from here and the four route files
 * are three lines each.
 */

const COPY: Record<DocKind, { title: string; blurb: string }> = {
  doc: {
    title: "Documents",
    blurb: "Specs, briefs and handover notes, per project. Share one and the client sees it in their portal.",
  },
  wiki: {
    title: "Wiki",
    blurb: "How this studio works. Internal by default, linked with [[double brackets]].",
  },
};

async function load(kind: DocKind) {
  const session = await requireSession();
  const supabase = await supabaseServer();

  // RLS already scopes this: staff get everything, a client gets only shared
  // pages inside their own organization.
  const { data } = await supabase
    .from("documents")
    .select("id, title, slug, icon, parent_id, order_index, client_visible, kind")
    .eq("kind", kind)
    .eq("is_archived", false)
    .order("order_index");

  return { session, supabase, docs: (data ?? []) as TreeDoc[] };
}

/* ------------------------------- index page ------------------------------- */

export async function DocIndex({ kind }: { kind: DocKind }) {
  const { session, supabase, docs } = await load(kind);
  const copy = COPY[kind];
  const base = kind === "wiki" ? "/workspace/wiki" : "/workspace/docs";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  const { data: recent } = await supabase
    .from("documents")
    .select("id, title, slug, updated_at, client_visible")
    .eq("kind", kind)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(8);

  return (
    <>
      <PageHeader
        eyebrow={copy.title}
        title={copy.title}
        description={copy.blurb}
        action={
          session.isStaff ? (
            <NewDocButton kind={kind} projects={projects ?? []} />
          ) : null
        }
      />

      {docs.length === 0 ? (
        <EmptyState title={`No ${kind === "wiki" ? "wiki pages" : "documents"} yet`}>
          {session.isStaff
            ? "Create the first page and it becomes the root of the tree."
            : "Nothing has been shared with you here yet."}
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav aria-label={`${copy.title} tree`}>
            <DocTree docs={docs} base={base} />
          </nav>

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
              Recently edited
            </h2>
            <ul className="divide-y divide-[var(--ws-line)] rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]">
              {(recent ?? []).map((d) => (
                <li key={d.id}>
                  <Link
                    href={`${base}/${d.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--ws-hover)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">
                        {d.title}
                      </span>
                      <span className="text-[11px] text-[var(--ws-faint)]">
                        Updated {relativeTime(d.updated_at)}
                      </span>
                    </span>
                    {d.client_visible ? (
                      <span className="shrink-0 rounded-full border border-[var(--ws-line)] px-2 py-0.5 text-[10px] text-[var(--ws-muted)]">
                        Shared
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------- one page -------------------------------- */

export async function DocDetail({ kind, slug }: { kind: DocKind; slug: string }) {
  const { session, supabase, docs } = await load(kind);
  const base = kind === "wiki" ? "/workspace/wiki" : "/workspace/docs";

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("kind", kind)
    .eq("slug", slug)
    .maybeSingle();

  // RLS turns "not allowed" into zero rows, so a forbidden slug and a
  // nonexistent one give the same 404 — the URL leaks nothing either way.
  if (!doc) notFound();
  const page = doc as Doc;

  // Every page the READER may see, for resolving [[wiki links]]. Both kinds:
  // a project doc linking to a wiki page is the common case.
  const { data: allTargets } = await supabase
    .from("documents")
    .select("title, slug, kind")
    .eq("is_archived", false);

  const { data: versionRows } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", page.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const versions = (versionRows ?? []) as DocVersion[];

  // One lookup for every profile named on this page — the editor byline and
  // each version's author.
  const ids = [
    page.updated_by,
    ...versions.map((v) => v.edited_by),
  ].filter((v): v is string => Boolean(v));

  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", [...new Set(ids)])
    : { data: [] as Pick<Profile, "id" | "full_name" | "email">[] };

  const nameById: Record<string, string> = {};
  for (const p of people ?? []) {
    nameById[p.id] = p.full_name ?? p.email.split("@")[0];
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <nav aria-label={`${COPY[kind].title} tree`} className="order-2 lg:order-1">
        <Link
          href={base}
          className="mb-2 block px-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)] hover:text-[var(--ws-text)]"
        >
          ← {COPY[kind].title}
        </Link>
        <DocTree docs={docs} activeSlug={slug} base={base} />
      </nav>

      <article className="order-1 min-w-0 lg:order-2">
        <DocView
          doc={page}
          targets={allTargets ?? []}
          versions={versions.map((v) => ({
            ...v,
            editor: v.edited_by ? (nameById[v.edited_by] ?? null) : null,
          }))}
          editors={nameById}
          me={session.profile}
          canEdit={session.isStaff}
        />
      </article>
    </div>
  );
}
