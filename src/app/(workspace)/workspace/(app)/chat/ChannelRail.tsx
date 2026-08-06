"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Hash, Lock } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ChannelKind } from "@/lib/workspace/database.types";

type Row = {
  id: string;
  name: string;
  kind: ChannelKind;
  client_visible: boolean;
};

/**
 * Channel list with live unread badges.
 *
 * One subscription on `messages` with no filter — a per-channel filter would
 * mean N subscriptions for N channels, and RLS already guarantees the socket
 * only delivers rows this person may read. The open channel never accrues a
 * badge; it is being read right now.
 */
export default function ChannelRail({
  channels,
  initialUnread,
  meId,
}: {
  channels: Row[];
  initialUnread: Record<string, number>;
  meId: string;
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(initialUnread);

  const activeId = pathname.split("/")[3];

  useEffect(() => setUnread(initialUnread), [initialUnread]);

  // Opening a channel clears its badge immediately, rather than waiting for the
  // next server render to notice the read cursor moved.
  useEffect(() => {
    if (!activeId) return;
    setUnread((prev) => (prev[activeId] ? { ...prev, [activeId]: 0 } : prev));
  }, [activeId]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const client = supabaseBrowser();
    const channel = client
      .channel("chat:unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as { channel_id: string; author_id: string | null };
          if (row.author_id === meId) return;
          if (row.channel_id === activeId) return;
          setUnread((prev) => ({
            ...prev,
            [row.channel_id]: (prev[row.channel_id] ?? 0) + 1,
          }));
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [meId, activeId]);

  const groups: [string, Row[]][] = [
    ["Workspace", channels.filter((c) => c.kind === "workspace")],
    ["Projects", channels.filter((c) => c.kind === "project")],
    ["Direct", channels.filter((c) => c.kind === "direct")],
  ];

  return (
    <div className="space-y-4">
      {groups.map(([label, list]) =>
        list.length === 0 ? null : (
          <div key={label}>
            <p className="mb-1 px-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
              {label}
            </p>
            <ul className="space-y-0.5">
              {list.map((c) => {
                const active = c.id === activeId;
                const count = unread[c.id] ?? 0;

                return (
                  <li key={c.id}>
                    <Link
                      href={`/workspace/chat/${c.id}`}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-[var(--ws-accent-soft)] font-semibold text-[var(--ws-text)]"
                          : count
                            ? "font-semibold text-[var(--ws-text)] hover:bg-[var(--ws-hover)]"
                            : "text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]",
                      )}
                    >
                      {c.client_visible ? (
                        <Hash size={13} className="shrink-0 text-[var(--ws-faint)]" />
                      ) : (
                        <Lock
                          size={11}
                          className="shrink-0 text-[var(--ws-faint)]"
                          aria-label="Internal only"
                        />
                      )}
                      <span className="truncate">{c.name}</span>
                      {count > 0 && !active ? (
                        <span className="mono ml-auto shrink-0 rounded-full bg-[var(--ws-accent)] px-1.5 text-[10px] font-bold text-[var(--ws-accent-ink)]">
                          {count > 99 ? "99+" : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}
