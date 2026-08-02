"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff } from "../session";
import { done, explain, fail, optional, str, type ActionState } from "../action-utils";

/**
 * Time entries. Clients never see any of this — `time_logs` has no client-side
 * read policy at all, so it can't leak through a mis-scoped query either.
 */
export async function logTime(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const minutes = Math.round(Number(form.get("minutes")));
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return fail("Log at least a minute.");
  }
  if (minutes > 24 * 60) return fail("That's more than a day — split it up.");

  const project_id = str(form, "project_id");
  if (!project_id) return fail("Pick a project.");

  const { error } = await supabase.from("time_logs").insert({
    project_id,
    task_id: optional(form, "task_id"),
    profile_id: session.profile.id,
    minutes,
    logged_date: str(form, "logged_date") || new Date().toISOString().slice(0, 10),
    note: optional(form, "note"),
  });

  if (error) return fail(explain(error, "Could not log the time."));

  revalidatePath("/workspace/time");
  revalidatePath("/workspace/dashboard");
  return done(`Logged ${minutes} minutes.`);
}

export async function deleteTimeLog(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete the entry."));

  revalidatePath("/workspace/time");
  return done("Deleted.");
}
