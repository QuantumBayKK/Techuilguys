import Link from "next/link";
import { clsx } from "clsx";
import { FileText } from "lucide-react";
import type { Doc, DocKind } from "@/lib/workspace/database.types";

export type TreeDoc = Pick<
  Doc,
  "id" | "title" | "slug" | "icon" | "parent_id" | "order_index" | "client_visible" | "kind"
>;

/**
 * The page tree. Notion's shape without Notion's chrome: nesting is a left
 * rule and indentation, nothing more. Renders server-side — a tree of at most a
 * few hundred titles does not need to be interactive to be navigable.
 */
export default function DocTree({
  docs,
  activeSlug,
  base,
}: {
  docs: TreeDoc[];
  activeSlug?: string;
  base: string;
}) {
  const children = new Map<string | null, TreeDoc[]>();
  for (const doc of docs) {
    const key = doc.parent_id;
    children.set(key, [...(children.get(key) ?? []), doc]);
  }
  for (const list of children.values()) {
    list.sort((a, b) => a.order_index - b.order_index || a.title.localeCompare(b.title));
  }

  return <Branch parent={null} children_={children} activeSlug={activeSlug} base={base} depth={0} />;
}

function Branch({
  parent,
  children_,
  activeSlug,
  base,
  depth,
}: {
  parent: string | null;
  children_: Map<string | null, TreeDoc[]>;
  activeSlug?: string;
  base: string;
  depth: number;
}) {
  const list = children_.get(parent) ?? [];
  if (list.length === 0) return null;

  // Guard against a cycle in `parent_id`, which a bad restore could produce.
  if (depth > 6) return null;

  return (
    <ul
      className={clsx(
        depth > 0 && "ml-[9px] border-l border-[var(--ws-line)] pl-2",
      )}
    >
      {list.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`${base}/${doc.slug}`}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] transition-colors",
              doc.slug === activeSlug
                ? "bg-[var(--ws-accent-soft)] font-semibold text-[var(--ws-text)]"
                : "text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]",
            )}
          >
            {doc.icon ? (
              <span className="w-4 shrink-0 text-center text-[13px] leading-none">
                {doc.icon}
              </span>
            ) : (
              <FileText size={13} className="shrink-0 text-[var(--ws-faint)]" />
            )}
            <span className="truncate">{doc.title}</span>
            {doc.client_visible ? (
              <span
                aria-label="Shared with the client"
                title="Shared with the client"
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ws-green)]"
              />
            ) : null}
          </Link>
          <Branch
            parent={doc.id}
            children_={children_}
            activeSlug={activeSlug}
            base={base}
            depth={depth + 1}
          />
        </li>
      ))}
    </ul>
  );
}

export const docBase = (kind: DocKind) =>
  kind === "wiki" ? "/workspace/wiki" : "/workspace/docs";
