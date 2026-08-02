"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { FILES_BUCKET } from "@/lib/supabase/config";
import { requireSession, requireStaff } from "../session";
import { sendMail, siteUrl } from "../mail";
import {
  bool,
  done,
  explain,
  fail,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { ParentType, UpdateType } from "../database.types";

/* -------------------------------- updates -------------------------------- */

export async function postUpdate(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const project_id = str(form, "project_id");
  const title = str(form, "title");
  const body_md = str(form, "body_md");
  const update_type = (str(form, "update_type") || "progress") as UpdateType;

  if (!title) return fail("Give the update a headline.");
  if (!body_md) return fail("An empty update isn't worth sending.");

  const { error } = await supabase.from("updates").insert({
    project_id,
    title,
    body_md,
    update_type,
    author_id: session.profile.id,
  });

  if (error) return fail(explain(error, "Could not post the update."));

  // The trigger notifies clients in-app; email them too so it isn't missed.
  const { data: project } = await supabase
    .from("projects")
    .select("name, slug, organization_id")
    .eq("id", project_id)
    .maybeSingle();

  if (project) {
    const { data: clients } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "client")
      .eq("organization_id", project.organization_id);

    await sendMail({
      to: (clients ?? []).map((c) => c.email),
      subject: `${project.name}: ${title}`,
      heading: title,
      body: body_md.slice(0, 400),
      cta: {
        label: "Read the update",
        href: siteUrl(`/workspace/portal/${project.slug}/updates`),
      },
    });
  }

  revalidatePath("/workspace", "layout");
  return done("Update posted.");
}

export async function deleteUpdate(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("updates").delete().eq("id", str(form, "id"));
  if (error) return fail(explain(error, "Could not delete the update."));

  revalidatePath("/workspace", "layout");
  return done("Deleted.");
}

/* -------------------------------- comments ------------------------------- */

export async function postComment(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const body_md = str(form, "body_md");
  if (!body_md) return fail("Write something first.");

  // Only staff may mark a comment internal; the RLS check enforces this too,
  // this just gives a clean error instead of a policy violation.
  const internal_only = session.isStaff && bool(form, "internal_only");

  const { error } = await supabase.from("comments").insert({
    project_id: str(form, "project_id"),
    parent_type: str(form, "parent_type") as ParentType,
    parent_id: str(form, "parent_id"),
    body_md,
    internal_only,
    author_id: session.profile.id,
  });

  if (error) return fail(explain(error, "Could not post the comment."));

  revalidatePath("/workspace", "layout");
  return done();
}

export async function deleteComment(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireSession();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("comments").delete().eq("id", str(form, "id"));
  if (error) return fail(explain(error, "Could not delete the comment."));

  revalidatePath("/workspace", "layout");
  return done();
}

/* --------------------------------- files --------------------------------- */

/**
 * Called after the browser has streamed the object into Storage. Splitting it
 * this way keeps the file bytes off the Server Action body-size limit — only
 * the metadata round-trips here.
 */
export async function registerFile(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("files").insert({
    project_id: str(form, "project_id"),
    name: str(form, "name"),
    storage_path: str(form, "storage_path"),
    size_bytes: Number(form.get("size_bytes")) || 0,
    mime_type: optional(form, "mime_type"),
    // A client never uploads something they then can't see.
    client_visible: session.isStaff ? bool(form, "client_visible") : true,
    uploader_id: session.profile.id,
  });

  if (error) return fail(explain(error, "Could not save the file record."));

  revalidatePath("/workspace", "layout");
  return done("Uploaded.");
}

export async function deleteFile(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireSession();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { data: file } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  // Row first: the audit trigger fires on the delete, and an orphaned object is
  // cheaper to clean up than an orphaned row pointing at nothing.
  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) return fail(explain(error, "Could not delete the file."));

  if (file?.storage_path) {
    await supabase.storage.from(FILES_BUCKET).remove([file.storage_path]);
  }

  revalidatePath("/workspace", "layout");
  return done("Deleted.");
}

export async function toggleFileVisibility(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("files")
    .update({ client_visible: bool(form, "client_visible") })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not change visibility."));

  revalidatePath("/workspace", "layout");
  return done();
}

/** Short-lived signed URL; the bucket itself is private. */
export async function signedFileUrl(path: string): Promise<string | null> {
  await requireSession();
  const supabase = await supabaseServer();

  const { data } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(path, 60 * 10);

  return data?.signedUrl ?? null;
}
