import { notFound } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { relativeTime } from "@/lib/workspace/format";
import { Badge } from "@/components/workspace/ui/Primitives";
import { QuickForm } from "@/components/workspace/ui/Form";
import { clearBoard, deleteBoard, updateBoard } from "@/lib/workspace/actions/boards";
import type { Board, Shape } from "@/lib/workspace/database.types";
import Canvas from "./Canvas";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await supabaseServer();

  const { data } = await supabase.from("boards").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const board = data as Board;

  const { data: shapes } = await supabase
    .from("board_shapes")
    .select("*")
    .eq("board_id", id)
    .order("z")
    .returns<Shape[]>();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/workspace/whiteboard"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)] hover:text-[var(--ws-text)]"
          >
            ← Whiteboards
          </Link>
          <h1 className="font-display mt-1 flex items-center gap-2.5 text-xl font-bold tracking-tight">
            {board.title}
            {board.client_visible ? <Badge tone="neutral">Client</Badge> : null}
          </h1>
          <p className="text-[11px] text-[var(--ws-faint)]">
            Updated {relativeTime(board.updated_at)}
          </p>
        </div>

        {session.isStaff ? (
          <div className="flex flex-wrap gap-2">
            <QuickForm
              action={updateBoard}
              fields={{
                id: board.id,
                title: board.title,
                client_visible: !board.client_visible,
              }}
              variant={board.client_visible ? "subtle" : "outline"}
            >
              {board.client_visible ? "Shared with client" : "Internal only"}
            </QuickForm>
            <QuickForm
              action={clearBoard}
              fields={{ board_id: board.id }}
              variant="ghost"
              confirm="Remove everything on this board? This cannot be undone."
            >
              Clear
            </QuickForm>
            <QuickForm
              action={deleteBoard}
              fields={{ id: board.id }}
              variant="ghost"
              confirm="Delete this whiteboard entirely?"
            >
              <Trash2 size={13} />
            </QuickForm>
          </div>
        ) : null}
      </div>

      <Canvas
        board={board}
        initialShapes={shapes ?? []}
        me={session.profile}
        /* A shared board is collaborative — the RLS policy lets anyone who can
           open it draw on it, so the UI must not pretend otherwise. */
        canEdit
      />
    </>
  );
}
