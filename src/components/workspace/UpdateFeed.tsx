import { supabaseServer } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/workspace/format";
import type { Profile, UpdateType } from "@/lib/workspace/database.types";
import { Avatar, Badge, Card, EmptyState } from "./ui/Primitives";
import Markdown from "./ui/Markdown";
import CommentThread from "./CommentThread";
import DeleteUpdateButton from "./DeleteUpdateButton";

type Row = {
  id: string;
  title: string;
  body_md: string;
  update_type: UpdateType;
  created_at: string;
  profiles: Pick<Profile, "full_name" | "email" | "avatar_url"> | null;
};

const TONE = {
  progress: "accent",
  launch: "green",
  blocker: "red",
  note: "neutral",
} as const;

/**
 * The changelog the client actually reads. Launch posts get the celebratory
 * treatment — the one place in this product where we allow a flourish.
 */
export default async function UpdateFeed({
  projectId,
  canDelete = false,
}: {
  projectId: string;
  canDelete?: boolean;
}) {
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("updates")
    .select("id, title, body_md, update_type, created_at, profiles:author_id(full_name, email, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  const updates = data ?? [];

  if (updates.length === 0) {
    return (
      <EmptyState title="No updates yet">
        This is where the team posts what shipped, what&apos;s next and anything
        that needs a decision. The first one usually lands after kickoff.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-5">
      {updates.map((update) => {
        const launch = update.update_type === "launch";

        return (
          <Card
            key={update.id}
            className={launch ? "border-[var(--ws-green)]/40" : undefined}
          >
            {launch ? (
              <div
                aria-hidden
                className="h-1 rounded-t-xl"
                style={{
                  background:
                    "linear-gradient(90deg,var(--ws-green),var(--ws-accent),var(--ws-live))",
                }}
              />
            ) : null}

            <article className="p-5">
              <header className="flex flex-wrap items-center gap-2.5">
                <Badge tone={TONE[update.update_type]}>
                  {launch ? "🚀 Launch" : update.update_type}
                </Badge>
                <h2 className="font-display text-lg font-bold tracking-tight">
                  {update.title}
                </h2>
                {canDelete ? (
                  <span className="ml-auto">
                    <DeleteUpdateButton id={update.id} />
                  </span>
                ) : null}
              </header>

              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--ws-faint)]">
                <Avatar
                  name={update.profiles?.full_name}
                  email={update.profiles?.email ?? "?"}
                  src={update.profiles?.avatar_url}
                  size={20}
                />
                <span>
                  {update.profiles?.full_name ??
                    update.profiles?.email?.split("@")[0] ??
                    "The team"}{" "}
                  · {relativeTime(update.created_at)}
                </span>
              </div>

              <div className="mt-3.5 text-[var(--ws-text)]">
                <Markdown>{update.body_md}</Markdown>
              </div>

              <details className="group mt-4 border-t border-[var(--ws-line)] pt-3">
                <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ws-muted)] hover:text-[var(--ws-accent)]">
                  Comments
                  <span className="ml-1 inline-block transition-transform group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <div className="mt-3.5">
                  <CommentThread
                    projectId={projectId}
                    parentType="update"
                    parentId={update.id}
                  />
                </div>
              </details>
            </article>
          </Card>
        );
      })}
    </div>
  );
}
