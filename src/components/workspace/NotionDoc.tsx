import { getNotionDoc } from "@/lib/workspace/notion";
import { Card, CardHeader, EmptyState } from "./ui/Primitives";

/** Renders a Notion page's blocks in our own type. Read-only by design. */
export default async function NotionDoc({ pageId }: { pageId: string }) {
  const doc = await getNotionDoc(pageId);

  if (doc.error) {
    return (
      <EmptyState title="Couldn't load the Notion page">{doc.error}</EmptyState>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader
        title={doc.title ?? "Notion document"}
        hint="Synced from Notion · read-only"
        action={
          doc.url ? (
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
            >
              Edit in Notion ↗
            </a>
          ) : null
        }
      />
      <div className="ws-md px-6 py-6">
        {doc.blocks.length === 0 ? (
          <p className="text-sm text-[var(--ws-muted)]">This page is empty.</p>
        ) : (
          doc.blocks.map((block) => <Block key={block.id} block={block} />)
        )}
      </div>
    </Card>
  );
}

function Block({
  block,
}: {
  block: { id: string; type: string; text: string; checked?: boolean; language?: string };
}) {
  switch (block.type) {
    case "heading_1":
      return <h1>{block.text}</h1>;
    case "heading_2":
      return <h2>{block.text}</h2>;
    case "heading_3":
      return <h3>{block.text}</h3>;
    case "bulleted_list_item":
      return (
        <p className="flex gap-2">
          <span aria-hidden className="text-[var(--ws-accent)]">
            •
          </span>
          <span>{block.text}</span>
        </p>
      );
    case "numbered_list_item":
      return (
        <p className="flex gap-2">
          <span aria-hidden className="text-[var(--ws-accent)]">
            —
          </span>
          <span>{block.text}</span>
        </p>
      );
    case "to_do":
      return (
        <p className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={block.checked ?? false}
            readOnly
            className="mt-1 h-3.5 w-3.5 accent-[var(--ws-accent)]"
          />
          <span className={block.checked ? "line-through opacity-60" : undefined}>
            {block.text}
          </span>
        </p>
      );
    case "quote":
      return <blockquote>{block.text}</blockquote>;
    case "callout":
      return (
        <div className="rounded-lg border border-[var(--ws-line)] bg-[var(--ws-hover)] px-4 py-3">
          {block.text}
        </div>
      );
    case "code":
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      );
    case "divider":
      return <hr />;
    default:
      return <p>{block.text}</p>;
  }
}
