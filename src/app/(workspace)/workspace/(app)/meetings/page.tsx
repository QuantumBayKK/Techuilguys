import Link from "next/link";
import { Video } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { relativeTime } from "@/lib/workspace/format";
import {
  PageHeader,
  EmptyState,
  Badge,
  Divider,
} from "@/components/workspace/ui/Primitives";
import type { Meeting, MeetingStatus } from "@/lib/workspace/database.types";
import MeetingComposer from "./MeetingComposer";

export const metadata = { title: "Meetings · Workspace" };

const TONE: Record<MeetingStatus, "neutral" | "live" | "green" | "red"> = {
  scheduled: "neutral",
  live: "live",
  ended: "green",
  cancelled: "red",
};

export default async function MeetingsPage() {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const [{ data: rows }, { data: projects }] = await Promise.all([
    supabase.from("meetings").select("*").order("starts_at", { ascending: false }),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  const meetings = (rows ?? []) as Meeting[];
  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.starts_at).getTime() >= now && m.status !== "cancelled")
    .reverse();
  const past = meetings.filter(
    (m) => new Date(m.starts_at).getTime() < now || m.status === "cancelled",
  );

  return (
    <>
      <PageHeader
        eyebrow="Meetings"
        title="Meetings"
        description="Agenda before, notes during, action items after — and the action items become real tasks."
        action={
          session.isStaff ? <MeetingComposer projects={projects ?? []} /> : null
        }
      />

      {meetings.length === 0 ? (
        <EmptyState
          art={<Video size={34} strokeWidth={1.25} />}
          title="No meetings yet"
        >
          {session.isStaff
            ? "Schedule one and it appears on the calendar too."
            : "Nothing scheduled with you right now."}
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 ? (
            <section>
              <Divider label="Upcoming" />
              <ul className="mt-3 divide-y divide-[var(--ws-line)] rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]">
                {upcoming.map((m) => (
                  <MeetingRow key={m.id} meeting={m} />
                ))}
              </ul>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section>
              <Divider label="Past" />
              <ul className="mt-3 divide-y divide-[var(--ws-line)] rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]">
                {past.slice(0, 30).map((m) => (
                  <MeetingRow key={m.id} meeting={m} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const when = new Date(meeting.starts_at);

  return (
    <li>
      <Link
        href={`/workspace/meetings/${meeting.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-[var(--ws-hover)]"
      >
        <span className="mono w-[112px] shrink-0 text-[11px] uppercase tracking-[0.1em] text-[var(--ws-faint)]">
          {when.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          {" · "}
          {when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{meeting.title}</span>
          <span className="text-[11px] text-[var(--ws-faint)]">
            {relativeTime(meeting.starts_at)}
          </span>
        </span>

        {meeting.client_visible ? (
          <Badge tone="neutral">Client</Badge>
        ) : null}
        <Badge tone={TONE[meeting.status]}>{meeting.status}</Badge>
      </Link>
    </li>
  );
}
