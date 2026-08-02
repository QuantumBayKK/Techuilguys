import { supabaseServer } from "@/lib/supabase/server";
import { getSession } from "@/lib/workspace/session";
import { relativeTime } from "@/lib/workspace/format";
import type { ParentType, Profile } from "@/lib/workspace/database.types";
import { Avatar } from "./ui/Primitives";
import Markdown from "./ui/Markdown";
import CommentForm from "./CommentForm";
import DeleteCommentButton from "./DeleteCommentButton";

type Row = {
  id: string;
  body_md: string;
  internal_only: boolean;
  created_at: string;
  author_id: string | null;
  profiles: Pick<Profile, "full_name" | "email" | "avatar_url" | "role"> | null;
};

/**
 * One comment stream, reused for projects, tasks, updates and milestones.
 *
 * `internalOnly` switches it into the amber internal-notes mode. That flag is a
 * presentation choice only — a client physically cannot read internal rows,
 * because `comment_read` filters them in Postgres.
 */
export default async function CommentThread({
  projectId,
  parentType,
  parentId,
  internalOnly = false,
  placeholder,
  emptyLabel,
}: {
  projectId: string;
  parentType: ParentType;
  parentId: string;
  internalOnly?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const session = await getSession();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("comments")
    .select(
      "id, body_md, internal_only, created_at, author_id, profiles(full_name, email, avatar_url, role)",
    )
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .eq("internal_only", internalOnly)
    .order("created_at")
    .returns<Row[]>();

  const comments = data ?? [];

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="py-2 text-xs text-[var(--ws-faint)]">
          {emptyLabel ??
            (internalOnly
              ? "No internal notes yet. This stream is invisible to the client."
              : "No comments yet.")}
        </p>
      ) : (
        <ul className="space-y-3.5">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={
                internalOnly
                  ? "rounded-lg border border-[var(--ws-internal-line)] bg-[var(--ws-internal)] p-3"
                  : undefined
              }
            >
              <div className="flex gap-2.5">
                <Avatar
                  name={comment.profiles?.full_name}
                  email={comment.profiles?.email ?? "?"}
                  src={comment.profiles?.avatar_url}
                  size={26}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-semibold">
                      {comment.profiles?.full_name ??
                        comment.profiles?.email?.split("@")[0] ??
                        "Removed user"}
                    </span>
                    {comment.profiles?.role === "client" ? (
                      <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--ws-accent)]">
                        Client
                      </span>
                    ) : null}
                    <span className="text-[11px] text-[var(--ws-faint)]">
                      {relativeTime(comment.created_at)}
                    </span>
                    {session &&
                    (comment.author_id === session.profile.id || session.isAdmin) ? (
                      <span className="ml-auto">
                        <DeleteCommentButton id={comment.id} />
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-1 text-[var(--ws-muted)]">
                    <Markdown>{comment.body_md}</Markdown>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CommentForm
        projectId={projectId}
        parentType={parentType}
        parentId={parentId}
        internalOnly={internalOnly}
        placeholder={placeholder}
      />
    </div>
  );
}
