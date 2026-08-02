"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Notification } from "@/lib/workspace/database.types";
import { relativeTime } from "@/lib/workspace/format";

/** In-app inbox. Unread count is live — a new row pushes straight into state. */
export default function NotificationBell({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser()
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems(data ?? []);
  }, []);

  useEffect(() => {
    void load();

    const channel = supabaseBrowser()
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev].slice(0, 20)),
      )
      .subscribe();

    return () => {
      void supabaseBrowser().removeChannel(channel);
    };
  }, [profileId, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!popover.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabaseBrowser()
      .from("notifications")
      .update({ read: true })
      .eq("profile_id", profileId)
      .eq("read", false);
  }

  async function openItem(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await supabaseBrowser().from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={popover} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative rounded-lg p-2 text-[var(--ws-muted)] transition-colors hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]"
      >
        <Bell size={16} />
        {unread > 0 ? (
          <span className="mono absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-[var(--ws-accent)] px-1 text-[10px] font-bold leading-4 text-[var(--ws-accent-ink)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="ws-in absolute right-0 top-full mt-2 w-[320px] overflow-hidden rounded-xl border border-[var(--ws-line-strong)] bg-[var(--ws-surface)] shadow-[var(--ws-shadow)]">
          <div className="flex items-center justify-between border-b border-[var(--ws-line)] px-3.5 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-muted)]">
              Notifications
            </span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-[var(--ws-accent)] hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <ul className="ws-scroll max-h-[62vh] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3.5 py-8 text-center text-xs text-[var(--ws-faint)]">
                Nothing yet. Approvals, requests and new updates land here.
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b border-[var(--ws-line)] last:border-0">
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="flex w-full gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-[var(--ws-hover)]"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: n.read ? "transparent" : "var(--ws-accent)",
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">
                        {n.title}
                      </span>
                      {n.body ? (
                        <span className="mt-0.5 block line-clamp-2 text-xs text-[var(--ws-muted)]">
                          {n.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] text-[var(--ws-faint)]">
                        {relativeTime(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <Link
            href="/workspace/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--ws-line)] px-3.5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ws-muted)] hover:text-[var(--ws-accent)]"
          >
            See all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
