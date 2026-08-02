"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff } from "../session";
import { getRepoSnapshot, taskRefsIn } from "../github";
import {
  bool,
  done,
  explain,
  fail,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { Priority, TaskStatus } from "../database.types";

export async function createTask(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const project_id = str(form, "project_id");
  const title = str(form, "title");
  if (!title) return fail("A task needs a title.");

  const status = (str(form, "status") || "backlog") as TaskStatus;

  // New cards land at the top of their column, where the eye already is.
  const { data: top } = await supabase
    .from("tasks")
    .select("order_index")
    .eq("project_id", project_id)
    .eq("status", status)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tasks").insert({
    project_id,
    title,
    status,
    description: optional(form, "description"),
    milestone_id: optional(form, "milestone_id"),
    assignee_id: optional(form, "assignee_id"),
    priority: (str(form, "priority") || "med") as Priority,
    client_visible: form.has("client_visible") ? bool(form, "client_visible") : true,
    due_date: optional(form, "due_date"),
    order_index: (top?.order_index ?? 0) - 1,
  });

  if (error) return fail(explain(error, "Could not create the task."));

  revalidatePath("/workspace", "layout");
  return done("Task added.");
}

export async function updateTask(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("tasks")
    .update({
      title: str(form, "title"),
      description: optional(form, "description"),
      status: str(form, "status") as TaskStatus,
      priority: str(form, "priority") as Priority,
      assignee_id: optional(form, "assignee_id"),
      milestone_id: optional(form, "milestone_id"),
      client_visible: bool(form, "client_visible"),
      due_date: optional(form, "due_date"),
    })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not save the task."));

  revalidatePath("/workspace", "layout");
  return done("Saved.");
}

export async function deleteTask(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("tasks").delete().eq("id", str(form, "id"));
  if (error) return fail(explain(error, "Could not delete the task."));

  revalidatePath("/workspace", "layout");
  return done("Deleted.");
}

/**
 * Persist a drag-drop. The board has already moved the card optimistically, so
 * this returns a plain boolean and the caller rolls back on false rather than
 * fighting the animation with a re-render.
 */
export async function moveTask(
  taskId: string,
  status: TaskStatus,
  orderedIds: string[],
): Promise<boolean> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error: moveError } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);
  if (moveError) {
    console.error("[workspace] move failed", moveError);
    return false;
  }

  const { error } = await supabase.rpc("reorder_tasks", {
    p_ids: orderedIds,
    p_status: status,
  });
  if (error) {
    console.error("[workspace] reorder failed", error);
    return false;
  }

  return true;
}

/**
 * Pull the last 10 commit messages and move any task named as `#TASK-<ref>` to
 * Review. Manual rather than a webhook: no public endpoint to secure, and it
 * costs one cached GitHub call.
 */
export async function syncGithubRefs(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();

  const repo = str(form, "repo");
  if (!repo) return fail("No repo linked to this project.");

  const snapshot = await getRepoSnapshot(repo);
  if (snapshot.error) return fail(snapshot.error);

  const refs = taskRefsIn(snapshot.commits.map((c) => c.message));
  if (refs.length === 0) {
    return done("No #TASK- references in the last 10 commits.");
  }

  const supabase = await supabaseServer();
  const { data: moved, error } = await supabase
    .from("tasks")
    .update({ status: "review" })
    .eq("project_id", str(form, "project_id"))
    .in("ref", refs)
    .not("status", "in", "(review,done)")
    .select("ref");

  if (error) return fail(explain(error, "Could not sync from GitHub."));

  revalidatePath("/workspace", "layout");
  return done(
    moved?.length
      ? `Moved ${moved.length} task${moved.length > 1 ? "s" : ""} to Review.`
      : "Referenced tasks were already in Review or Done.",
  );
}
