"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff } from "../session";
import {
  bool,
  done,
  explain,
  fail,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { EventKind } from "../database.types";

/**
 * Calendar entries. Milestones and meetings already appear on the calendar via
 * `calendar_feed`, so this table is only for the things that are nothing but a
 * date: a working session, a client deadline, a freeze week.
 */
export async function saveEvent(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const id = optional(form, "id");
  const title = str(form, "title");
  const all_day = bool(form, "all_day");
  const startRaw = str(form, "starts_at");
  const endRaw = str(form, "ends_at");

  if (!title) return fail("Give the entry a name.");
  if (!startRaw) return fail("Pick a start.");

  // An all-day entry is stored as a real span so one query serves both the
  // month grid and the agenda; the UI just hides the times.
  const starts_at = all_day
    ? new Date(`${startRaw.slice(0, 10)}T00:00:00`).toISOString()
    : new Date(startRaw).toISOString();
  const ends_at = all_day
    ? new Date(`${(endRaw || startRaw).slice(0, 10)}T23:59:59`).toISOString()
    : new Date(endRaw || startRaw).toISOString();

  if (new Date(ends_at) < new Date(starts_at)) {
    return fail("The end is before the start.");
  }

  const row = {
    title,
    description: optional(form, "description"),
    kind: (str(form, "kind") || "session") as EventKind,
    project_id: optional(form, "project_id"),
    location: optional(form, "location"),
    client_visible: bool(form, "client_visible"),
    all_day,
    starts_at,
    ends_at,
  };

  const { error } = id
    ? await supabase.from("events").update(row).eq("id", id)
    : await supabase
        .from("events")
        .insert({ ...row, created_by: session.profile.id });

  if (error) return fail(explain(error, "Could not save the entry."));

  revalidatePath("/workspace/calendar");
  return done(id ? "Updated." : "Added to the calendar.");
}

export async function deleteEvent(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not remove the entry."));

  revalidatePath("/workspace/calendar");
  return done("Removed.");
}
