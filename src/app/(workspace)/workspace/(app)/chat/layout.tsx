import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import type { Channel } from "@/lib/workspace/database.types";
import NewChannelButton from "./NewChannelButton";
import ChannelRail from "./ChannelRail";

export const metadata = { title: "Chat · Workspace" };

/**
 * Channel rail plus thread. The rail is server-rendered — channels change a few
 * times a month — and only the unread badges are live, which the rail refreshes
 * over the same socket the thread already holds open.
 */
export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const [{ data: channels }, { data: projects }, { data: unread }] = await Promise.all([
    supabase
      .from("channels")
      .select("*")
      .order("kind")
      .order("name")
      .returns<Channel[]>(),
    session.isStaff
      ? supabase.from("projects").select("id, name").order("name")
      : Promise.resolve({ data: [] }),
    supabase.rpc("unread_counts"),
  ]);

  const unreadById: Record<string, number> = {};
  for (const row of unread ?? []) {
    if (row.unread > 0) unreadById[row.channel_id] = Number(row.unread);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[218px_1fr]">
      <nav aria-label="Channels" className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ws-faint)]">
            Channels
          </h1>
          {session.isStaff ? <NewChannelButton projects={projects ?? []} /> : null}
        </div>

        <ChannelRail
          channels={(channels ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            kind: c.kind,
            client_visible: c.client_visible,
          }))}
          initialUnread={unreadById}
          meId={session.profile.id}
        />

        {(channels ?? []).length === 0 ? (
          <p className="px-1 text-[12px] leading-relaxed text-[var(--ws-faint)]">
            No channels you can see yet.
          </p>
        ) : null}
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
