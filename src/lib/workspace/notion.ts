import "server-only";

/**
 * Minimal Notion block renderer. Specs and meeting notes stay in Notion where
 * they're already written; the client reads them inside our branded workspace.
 *
 * Deliberately not the official SDK — we need four block types and a title, and
 * the REST call is ten lines. Share the page with your integration or this
 * returns a permissions error.
 */
const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

export type NotionBlock = {
  id: string;
  type: string;
  text: string;
  checked?: boolean;
  language?: string;
  url?: string;
};

export type NotionDoc = {
  title: string | null;
  blocks: NotionBlock[];
  url: string | null;
  error: string | null;
};

export const notionEnabled = Boolean(process.env.NOTION_TOKEN);

type RichText = { plain_text: string };
type RawBlock = {
  id: string;
  type: string;
  [key: string]: unknown;
};

async function notion<T>(path: string): Promise<T | null> {
  if (!process.env.NOTION_TOKEN) return null;
  try {
    const response = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": VERSION,
      },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getNotionDoc(pageId: string): Promise<NotionDoc> {
  const id = pageId.replace(/-/g, "").trim();

  if (!notionEnabled) {
    return {
      title: null,
      blocks: [],
      url: null,
      error: "Set NOTION_TOKEN to render Notion docs here.",
    };
  }
  if (!/^[0-9a-f]{32}$/i.test(id)) {
    return {
      title: null,
      blocks: [],
      url: null,
      error: "That doesn't look like a Notion page ID (32 hex characters).",
    };
  }

  const [page, children] = await Promise.all([
    notion<{ url: string; properties: Record<string, { title?: RichText[] }> }>(
      `/pages/${id}`,
    ),
    notion<{ results: RawBlock[] }>(`/blocks/${id}/children?page_size=100`),
  ]);

  if (!page || !children) {
    return {
      title: null,
      blocks: [],
      url: null,
      error:
        "Notion returned nothing. Share the page with your integration, then retry.",
    };
  }

  const titleProp = Object.values(page.properties ?? {}).find((p) => p.title);
  const title = titleProp?.title?.map((t) => t.plain_text).join("") ?? null;

  return {
    title,
    url: page.url ?? null,
    error: null,
    blocks: children.results.map(toBlock).filter((b): b is NotionBlock => b !== null),
  };
}

const TEXTUAL = new Set([
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
  "quote",
  "callout",
  "code",
]);

function toBlock(raw: RawBlock): NotionBlock | null {
  if (raw.type === "divider") return { id: raw.id, type: "divider", text: "" };
  if (!TEXTUAL.has(raw.type)) return null;

  const payload = raw[raw.type] as
    | { rich_text?: RichText[]; checked?: boolean; language?: string }
    | undefined;

  const text = (payload?.rich_text ?? []).map((t) => t.plain_text).join("");
  if (!text && raw.type !== "divider") return null;

  return {
    id: raw.id,
    type: raw.type,
    text,
    checked: payload?.checked,
    language: payload?.language,
  };
}
