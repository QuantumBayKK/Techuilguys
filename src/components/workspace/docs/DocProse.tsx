import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocKind } from "@/lib/workspace/database.types";

export type WikiTarget = { title: string; slug: string; kind: DocKind };

/**
 * Long-form document body. Same escaping posture as the comment renderer — no
 * rehype-raw, so a page can never inject markup — with one addition:
 * `[[Page Title]]` becomes a real link.
 *
 * The resolution table is passed in from the server, which already knows every
 * page the reader is allowed to see. A `[[link]]` to a page they cannot read,
 * or to one that does not exist, renders as dimmed text rather than a dead
 * link — and rather than leaking that the page exists.
 */
export default function DocProse({
  body,
  targets = [],
}: {
  body: string;
  targets?: WikiTarget[];
}) {
  const table = new Map(targets.map((t) => [t.title.toLowerCase(), t]));

  return (
    <div className="ws-md ws-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          // Wiki links live inside text nodes, so they are resolved after
          // markdown parsing rather than as a remark plugin — that keeps the
          // syntax inert inside code fences, which is the behaviour you want.
          p: ({ children }) => <p>{renderWikiLinks(children, table)}</p>,
          li: ({ children }) => <li>{renderWikiLinks(children, table)}</li>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

const WIKI = /\[\[([^\][]{1,200})\]\]/g;

function renderWikiLinks(
  children: React.ReactNode,
  table: Map<string, WikiTarget>,
): React.ReactNode {
  return mapText(children, (text, keyBase) => {
    if (!text.includes("[[")) return text;

    const parts: React.ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    WIKI.lastIndex = 0;

    while ((match = WIKI.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index));
      const name = match[1].trim();
      const target = table.get(name.toLowerCase());

      parts.push(
        target ? (
          <Link
            key={`${keyBase}-${match.index}`}
            href={`/workspace/${target.kind === "wiki" ? "wiki" : "docs"}/${target.slug}`}
            className="rounded-sm bg-[var(--ws-accent-soft)] px-1 font-medium text-[var(--ws-text)] no-underline hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span
            key={`${keyBase}-${match.index}`}
            title="No page with that title yet"
            className="text-[var(--ws-faint)] underline decoration-dotted underline-offset-2"
          >
            {name}
          </span>
        ),
      );
      last = match.index + match[0].length;
    }

    if (last < text.length) parts.push(text.slice(last));
    return parts;
  });
}

/** Walk a React children tree and transform only the raw string leaves. */
function mapText(
  node: React.ReactNode,
  fn: (text: string, key: string) => React.ReactNode,
  key = "w",
): React.ReactNode {
  if (typeof node === "string") return fn(node, key);
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <span key={`${key}-${i}`} style={{ display: "contents" }}>
        {mapText(child, fn, `${key}-${i}`)}
      </span>
    ));
  }
  return node;
}
