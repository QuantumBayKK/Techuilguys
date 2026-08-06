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
  num,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { NodeKind, Shape, ShapeKind } from "../database.types";

/* -------------------------------- boards --------------------------------- */

export async function createBoard(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const title = str(form, "title");
  if (!title) return fail("Name the board.");

  const { data, error } = await supabase
    .from("boards")
    .insert({
      title,
      project_id: optional(form, "project_id"),
      client_visible: bool(form, "client_visible"),
      created_by: session.profile.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return fail(explain(error, "Could not create the board."));

  revalidatePath("/workspace/whiteboard");
  redirect(`/workspace/whiteboard/${data.id}`);
}

export async function updateBoard(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { error } = await supabase
    .from("boards")
    .update({
      title: str(form, "title"),
      client_visible: bool(form, "client_visible"),
    })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not update the board."));

  revalidatePath(`/workspace/whiteboard/${id}`);
  revalidatePath("/workspace/whiteboard");
  return done("Updated.");
}

export async function deleteBoard(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete the board."));

  revalidatePath("/workspace/whiteboard");
  redirect("/workspace/whiteboard");
}

/* -------------------------------- shapes ---------------------------------- */
/*
 * Shape writes are plain inserts/updates with no revalidatePath. The canvas is
 * driven by Realtime CDC on `board_shapes` (REPLICA IDENTITY FULL, so updates
 * carry the whole row) — a router refresh mid-drag would fight the pointer.
 */

export async function addShape(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const kind = (str(form, "kind") || "note") as ShapeKind;
  const pointsRaw = optional(form, "points");

  const { error } = await supabase.from("board_shapes").insert({
    board_id: str(form, "board_id"),
    kind,
    x: num(form, "x"),
    y: num(form, "y"),
    w: num(form, "w", 180),
    h: num(form, "h", 120),
    text: str(form, "text"),
    tone: Math.min(5, Math.max(0, num(form, "tone"))),
    z: num(form, "z"),
    points: pointsRaw ? (JSON.parse(pointsRaw) as [number, number][]) : null,
    created_by: session.profile.id,
  });

  if (error) return fail(explain(error, "Could not add that."));
  return done();
}

export async function updateShape(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireSession();
  const supabase = await supabaseServer();

  // Only send what the caller actually changed — a drag posts x/y, an edit
  // posts text. Blindly writing every column would clobber a concurrent edit.
  const patch: Partial<Shape> = {};
  for (const key of ["x", "y", "w", "h", "z", "tone"] as const) {
    if (form.get(key) !== null) patch[key] = num(form, key);
  }
  if (form.get("text") !== null) patch.text = str(form, "text");

  if (Object.keys(patch).length === 0) return done();

  const { error } = await supabase
    .from("board_shapes")
    .update(patch)
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not save that change."));
  return done();
}

export async function deleteShape(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireSession();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("board_shapes")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete that."));
  return done();
}

export async function clearBoard(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("board_shapes")
    .delete()
    .eq("board_id", str(form, "board_id"));

  if (error) return fail(explain(error, "Could not clear the board."));
  return done("Cleared.");
}

/* --------------------------- knowledge graph ------------------------------ */

export async function linkNodes(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const source_id = str(form, "source_id");
  const target_id = str(form, "target_id");
  if (!source_id || !target_id) return fail("Pick both ends of the link.");
  if (source_id === target_id) return fail("A thing can't link to itself.");

  const { error } = await supabase.from("links").insert({
    project_id: optional(form, "project_id"),
    source_kind: str(form, "source_kind") as NodeKind,
    source_id,
    target_kind: str(form, "target_kind") as NodeKind,
    target_id,
    relation: str(form, "relation") || "relates to",
    created_by: session.profile.id,
  });

  if (error) {
    return fail(
      error.code === "23505"
        ? "Those two are already linked that way."
        : explain(error, "Could not link them."),
    );
  }

  revalidatePath("/workspace/graph");
  return done("Linked.");
}

export async function unlinkNodes(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not remove the link."));

  revalidatePath("/workspace/graph");
  return done("Unlinked.");
}
