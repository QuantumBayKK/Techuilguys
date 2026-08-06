"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession, requireStaff } from "../session";
import {
  bool,
  done,
  explain,
  fail,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { MeetingStatus, Rsvp } from "../database.types";

export async function saveMeeting(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const id = optional(form, "id");
  const title = str(form, "title");
  const startRaw = str(form, "starts_at");

  if (!title) return fail("Give the meeting a name.");
  if (!startRaw) return fail("When is it?");

  const starts_at = new Date(startRaw).toISOString();
  const minutes = Number(form.get("duration_minutes")) || 30;
  const ends_at = new Date(
    new Date(starts_at).getTime() + minutes * 60_000,
  ).toISOString();

  const row = {
    title,
    project_id: optional(form, "project_id"),
    agenda_md: str(form, "agenda_md"),
    join_url: optional(form, "join_url"),
    client_visible: bool(form, "client_visible"),
    starts_at,
    ends_at,
  };

  if (id) {
    const { error } = await supabase.from("meetings").update(row).eq("id", id);
    if (error) return fail(explain(error, "Could not save the meeting."));
    revalidatePath(`/workspace/meetings/${id}`);
    revalidatePath("/workspace/meetings");
    return done("Saved.");
  }

  const { data, error } = await supabase
    .from("meetings")
    .insert({ ...row, created_by: session.profile.id })
    .select("id")
    .maybeSingle();

  if (error || !data) return fail(explain(error, "Could not create the meeting."));

  // The organiser is always an attendee; the insert trigger skips notifying
  // whoever is doing the inviting, so this does not ping you about your own
  // meeting.
  await supabase
    .from("meeting_attendees")
    .insert({ meeting_id: data.id, profile_id: session.profile.id, response: "yes" });

  revalidatePath("/workspace/meetings");
  redirect(`/workspace/meetings/${data.id}`);
}

export async function setMeetingStatus(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const status = str(form, "status") as MeetingStatus;

  const { error } = await supabase.from("meetings").update({ status }).eq("id", id);
  if (error) return fail(explain(error, "Could not change the status."));

  revalidatePath(`/workspace/meetings/${id}`);
  revalidatePath("/workspace/meetings");
  return done(`Marked ${status}.`);
}

export async function saveMeetingNotes(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { error } = await supabase
    .from("meetings")
    .update({ notes_md: str(form, "notes_md") })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not save the notes."));

  revalidatePath(`/workspace/meetings/${id}`);
  return done("Notes saved.");
}

export async function deleteMeeting(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete the meeting."));

  revalidatePath("/workspace/meetings");
  redirect("/workspace/meetings");
}

/* ------------------------------- attendees ------------------------------- */

export async function inviteAttendee(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const profile_id = str(form, "profile_id");
  if (!profile_id) return fail("Pick someone to invite.");

  const { error } = await supabase
    .from("meeting_attendees")
    .upsert({ meeting_id, profile_id }, { onConflict: "meeting_id,profile_id" });

  if (error) return fail(explain(error, "Could not send the invitation."));

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done("Invited.");
}

export async function removeAttendee(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const { error } = await supabase
    .from("meeting_attendees")
    .delete()
    .eq("meeting_id", meeting_id)
    .eq("profile_id", str(form, "profile_id"));

  if (error) return fail(explain(error, "Could not remove them."));

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done("Removed.");
}

/** The one write a client has here — answering their own invitation. */
export async function respondToMeeting(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const response = str(form, "response") as Rsvp;

  const { error } = await supabase
    .from("meeting_attendees")
    .update({ response })
    .eq("meeting_id", meeting_id)
    .eq("profile_id", session.profile.id);

  if (error) return fail(explain(error, "Could not record your answer."));

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done(response === "yes" ? "You're in." : "Noted.");
}

/* ----------------------------- action items ------------------------------ */

export async function addActionItem(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const body = str(form, "body");
  if (!body) return fail("What needs doing?");

  const { error } = await supabase.from("meeting_action_items").insert({
    meeting_id,
    body,
    owner_id: optional(form, "owner_id"),
  });

  if (error) return fail(explain(error, "Could not add the item."));

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done("Added.");
}

export async function toggleActionItem(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const { error } = await supabase
    .from("meeting_action_items")
    .update({ done: bool(form, "done") })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not update the item."));

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done();
}

/**
 * Promote an action item to a real task on the project board. Idempotent by
 * construction: the RPC returns the existing task id if one was already made,
 * so double-clicking cannot create two.
 */
export async function actionItemToTask(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const { error } = await supabase.rpc("action_item_to_task", {
    p_item: str(form, "id"),
  });

  if (error) {
    return fail(
      error.message.includes("not attached to a project")
        ? "Attach this meeting to a project first."
        : explain(error, "Could not create the task."),
    );
  }

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done("On the board.");
}

export async function deleteActionItem(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const meeting_id = str(form, "meeting_id");
  const { error } = await supabase
    .from("meeting_action_items")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not remove the item."));

  revalidatePath(`/workspace/meetings/${meeting_id}`);
  return done("Removed.");
}
