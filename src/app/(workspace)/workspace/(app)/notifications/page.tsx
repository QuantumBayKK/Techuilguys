import Link from "next/link";
import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/workspace/format";
import { Card, EmptyState, PageHeader } from "@/components/workspace/ui/Primitives";
import MarkAllReadButton from "./MarkAllReadButton";

export const metadata = { title: "Notifications — Workspace" };

export default async function NotificationsPage() {
  await requireSession();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "All caught up."}
        action={unread ? <MarkAllReadButton /> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState title="Nothing yet">
          Milestone approvals, new client requests and fresh updates land here —
          and in your inbox, either immediately or in the 9am digest.
        </EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--ws-line)]">
            {items.map((item) => {
              const body = (
                <div className="flex gap-3 px-5 py-3.5">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: item.read ? "transparent" : "var(--ws-accent)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{item.title}</p>
                    {item.body ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ws-muted)]">
                        {item.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--ws-faint)]">
                      {relativeTime(item.created_at)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={item.id}>
                  {item.link ? (
                    <Link href={item.link} className="block hover:bg-[var(--ws-hover)]">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
