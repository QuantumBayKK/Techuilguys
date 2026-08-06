import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { formatDate, relativeTime } from "@/lib/workspace/format";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  Field,
  Input,
  Select,
} from "@/components/workspace/ui/Primitives";
import { ActionForm, QuickForm, SubmitButton } from "@/components/workspace/ui/Form";
import Markdown from "@/components/workspace/ui/Markdown";
import Presence from "@/components/workspace/Presence";
import {
  actionItemToTask,
  addActionItem,
  deleteActionItem,
  deleteMeeting,
  inviteAttendee,
  removeAttendee,
  respondToMeeting,
  setMeetingStatus,
  toggleActionItem,
} from "@/lib/workspace/actions/meetings";
import type {
  ActionItem,
  Meeting,
  MeetingStatus,
  Profile,
  Rsvp,
} from "@/lib/workspace/database.types";
import MeetingNotes from "./MeetingNotes";

const TONE: Record<MeetingStatus, "neutral" | "live" | "green" | "red"> = {
  scheduled: "neutral",
  live: "live",
  ended: "green",
  cancelled: "red",
};

const RSVP_TONE: Record<Rsvp, "neutral" | "green" | "red" | "amber"> = {
  pending: "neutral",
  yes: "green",
  no: "red",
  maybe: "amber",
};

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await supabaseServer();

  const { data } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const meeting = data as Meeting;

  const [{ data: attendeeRows }, { data: itemRows }, { data: project }, { data: staff }] =
    await Promise.all([
      supabase
        .from("meeting_attendees")
        .select("profile_id, response, profiles(id, full_name, email, avatar_url)")
        .eq("meeting_id", id)
        .returns<
          {
            profile_id: string;
            response: Rsvp;
            profiles: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
          }[]
        >(),
      supabase
        .from("meeting_action_items")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at"),
      meeting.project_id
        ? supabase
            .from("projects")
            .select("name, slug")
            .eq("id", meeting.project_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      session.isStaff
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .neq("role", "pending")
            .order("full_name")
        : Promise.resolve({ data: [] }),
    ]);

  const attendees = (attendeeRows ?? []).filter((a) => a.profiles);
  const items = (itemRows ?? []) as ActionItem[];
  const mine = attendees.find((a) => a.profile_id === session.profile.id);
  const invitedIds = new Set(attendees.map((a) => a.profile_id));

  const start = new Date(meeting.starts_at);
  const ownerById = new Map(
    attendees.map((a) => [a.profile_id, a.profiles!.full_name ?? a.profiles!.email]),
  );

  return (
    <>
      <Link
        href="/workspace/meetings"
        className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)] hover:text-[var(--ws-text)]"
      >
        ← Meetings
      </Link>

      <header className="mb-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={TONE[meeting.status]}>{meeting.status}</Badge>
          {meeting.client_visible ? <Badge tone="neutral">Client visible</Badge> : null}
          {project ? (
            <span className="text-[11px] text-[var(--ws-faint)]">{project.name}</span>
          ) : null}
          <span className="ml-auto">
            <Presence room={`meeting:${meeting.id}`} me={session.profile} />
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
          {meeting.title}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--ws-muted)]">
          {formatDate(meeting.starts_at)} ·{" "}
          {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          {meeting.ends_at
            ? `–${new Date(meeting.ends_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}{" "}
          · {relativeTime(meeting.starts_at)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {meeting.join_url ? (
            <ButtonLink
              href={meeting.join_url}
              target="_blank"
              rel="noreferrer noopener"
              variant="primary"
              size="sm"
            >
              Join <ExternalLink size={13} />
            </ButtonLink>
          ) : null}

          {session.isStaff
            ? (["live", "ended", "cancelled"] as MeetingStatus[])
                .filter((s) => s !== meeting.status)
                .map((s) => (
                  <QuickForm
                    key={s}
                    action={setMeetingStatus}
                    fields={{ id: meeting.id, status: s }}
                  >
                    Mark {s}
                  </QuickForm>
                ))
            : null}
        </div>
      </header>

      {/* A client's only write path here: answering their own invitation. */}
      {mine ? (
        <Card className="mb-6 p-4">
          <p className="mb-2.5 text-[13px] text-[var(--ws-muted)]">
            You&rsquo;re invited — going?
          </p>
          <div className="flex flex-wrap gap-2">
            {(["yes", "maybe", "no"] as Rsvp[]).map((r) => (
              <QuickForm
                key={r}
                action={respondToMeeting}
                fields={{ meeting_id: meeting.id, response: r }}
                variant={mine.response === r ? "primary" : "outline"}
              >
                {r === "yes" ? "Going" : r === "maybe" ? "Maybe" : "Can't make it"}
              </QuickForm>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
        <div className="min-w-0 space-y-6">
          {meeting.agenda_md.trim() ? (
            <Card>
              <CardHeader title="Agenda" />
              <div className="px-5 py-4">
                <Markdown>{meeting.agenda_md}</Markdown>
              </div>
            </Card>
          ) : null}

          {session.isStaff ? (
            <MeetingNotes meeting={meeting} me={session.profile} />
          ) : meeting.notes_md.trim() ? (
            <Card>
              <CardHeader title="Notes" />
              <div className="px-5 py-4">
                <Markdown>{meeting.notes_md}</Markdown>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Action items"
              hint="Promote one and it becomes a task on the project board."
            />

            {items.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-[var(--ws-muted)]">
                Nothing captured yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ws-line)]">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3"
                  >
                    {session.isStaff ? (
                      <QuickForm
                        action={toggleActionItem}
                        fields={{
                          id: item.id,
                          meeting_id: meeting.id,
                          done: !item.done,
                        }}
                        variant="ghost"
                        className="shrink-0"
                      >
                        <span
                          aria-hidden
                          className="inline-flex h-4 w-4 items-center justify-center rounded border border-[var(--ws-line-strong)] text-[10px]"
                          style={{
                            background: item.done ? "var(--ws-text)" : "transparent",
                            color: "var(--ws-bg)",
                          }}
                        >
                          {item.done ? "✓" : ""}
                        </span>
                      </QuickForm>
                    ) : null}

                    <span
                      className={`min-w-0 flex-1 text-[13px] ${
                        item.done ? "text-[var(--ws-faint)] line-through" : ""
                      }`}
                    >
                      {item.body}
                      {item.owner_id ? (
                        <span className="ml-2 text-[11px] text-[var(--ws-faint)]">
                          {ownerById.get(item.owner_id) ?? "assigned"}
                        </span>
                      ) : null}
                    </span>

                    {session.isStaff ? (
                      <span className="flex shrink-0 items-center gap-1.5">
                        {item.task_id ? (
                          <Badge tone="green">On the board</Badge>
                        ) : (
                          <QuickForm
                            action={actionItemToTask}
                            fields={{ id: item.id, meeting_id: meeting.id }}
                          >
                            Make a task
                          </QuickForm>
                        )}
                        <QuickForm
                          action={deleteActionItem}
                          fields={{ id: item.id, meeting_id: meeting.id }}
                          variant="ghost"
                        >
                          <Trash2 size={13} />
                        </QuickForm>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {session.isStaff ? (
              <div className="border-t border-[var(--ws-line)] px-5 py-3.5">
                <ActionForm action={addActionItem} resetOnSuccess>
                  <input type="hidden" name="meeting_id" value={meeting.id} />
                  <div className="flex flex-wrap gap-2">
                    <Input
                      name="body"
                      required
                      placeholder="Send the revised scope to Aditi"
                      className="min-w-[200px] flex-1"
                    />
                    <Select name="owner_id" defaultValue="" className="w-auto">
                      <option value="">Unassigned</option>
                      {attendees.map((a) => (
                        <option key={a.profile_id} value={a.profile_id}>
                          {a.profiles!.full_name ?? a.profiles!.email}
                        </option>
                      ))}
                    </Select>
                    <SubmitButton size="md" pendingLabel="Adding…">
                      Add
                    </SubmitButton>
                  </div>
                </ActionForm>
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title={`Attendees (${attendees.length})`} />
            <ul className="divide-y divide-[var(--ws-line)]">
              {attendees.map((a) => (
                <li key={a.profile_id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <Avatar
                    name={a.profiles!.full_name}
                    email={a.profiles!.email}
                    src={a.profiles!.avatar_url}
                    size={26}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {a.profiles!.full_name ?? a.profiles!.email.split("@")[0]}
                  </span>
                  <Badge tone={RSVP_TONE[a.response]}>{a.response}</Badge>
                  {session.isStaff ? (
                    <QuickForm
                      action={removeAttendee}
                      fields={{ meeting_id: meeting.id, profile_id: a.profile_id }}
                      variant="ghost"
                    >
                      <Trash2 size={12} />
                    </QuickForm>
                  ) : null}
                </li>
              ))}
              {attendees.length === 0 ? (
                <li className="px-4 py-3 text-[13px] text-[var(--ws-muted)]">
                  Nobody invited yet.
                </li>
              ) : null}
            </ul>

            {session.isStaff ? (
              <div className="border-t border-[var(--ws-line)] px-4 py-3">
                <ActionForm action={inviteAttendee}>
                  <input type="hidden" name="meeting_id" value={meeting.id} />
                  <Field label="Invite">
                    <Select name="profile_id" defaultValue="">
                      <option value="">Pick someone…</option>
                      {(staff ?? [])
                        .filter((s) => !invitedIds.has(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name ?? s.email}
                          </option>
                        ))}
                    </Select>
                  </Field>
                  <div className="mt-2.5">
                    <SubmitButton size="sm" variant="outline" pendingLabel="Inviting…">
                      Send invitation
                    </SubmitButton>
                  </div>
                </ActionForm>
              </div>
            ) : null}
          </Card>

          {session.isStaff ? (
            <QuickForm
              action={deleteMeeting}
              fields={{ id: meeting.id }}
              variant="ghost"
              confirm="Delete this meeting, its notes and its action items?"
            >
              <Trash2 size={13} /> Delete meeting
            </QuickForm>
          ) : null}
        </aside>
      </div>
    </>
  );
}
