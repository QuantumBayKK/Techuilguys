import Link from "next/link";
import { PenTool } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { relativeTime } from "@/lib/workspace/format";
import { PageHeader, EmptyState, Badge } from "@/components/workspace/ui/Primitives";
import type { Board } from "@/lib/workspace/database.types";
import NewBoardButton from "./NewBoardButton";

export const metadata = { title: "Whiteboard · Workspace" };

export default async function WhiteboardIndex() {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const [{ data: boards }, { data: projects }] = await Promise.all([
    supabase
      .from("boards")
      .select("*")
      .order("updated_at", { ascending: false })
      .returns<Board[]>(),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Whiteboard"
        title="Whiteboards"
        description="Sketch a flow, map a screen, argue about architecture. Everyone on a board sees every stroke as it lands."
        action={
          session.isStaff ? <NewBoardButton projects={projects ?? []} /> : null
        }
      />

      {(boards ?? []).length === 0 ? (
        <EmptyState
          art={<PenTool size={34} strokeWidth={1.25} />}
          title="No boards yet"
        >
          {session.isStaff
            ? "Make one for the next thing you'd otherwise draw on paper."
            : "Nothing has been shared with you here yet."}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(boards ?? []).map((b) => (
            <li key={b.id}>
              <Link
                href={`/workspace/whiteboard/${b.id}`}
                className="ws-board-field block h-full rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)] p-4 transition-colors hover:border-[var(--ws-line-strong)]"
              >
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <span className="truncate">{b.title}</span>
                  {b.client_visible ? <Badge tone="neutral">Client</Badge> : null}
                </p>
                <p className="mt-6 text-[11px] text-[var(--ws-faint)]">
                  Updated {relativeTime(b.updated_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
