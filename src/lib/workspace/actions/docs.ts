"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff } from "../session";
import { slugify } from "../format";
import {
  bool,
  done,
  explain,
  fail,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { DocKind } from "../database.types";

const base = (kind: DocKind) => (kind === "wiki" ? "/workspace/wiki" : "/workspace/docs");

/**
 * Slugs are scoped: unique per project, and unique across the workspace wiki.
 * Two projects may each own a page called "architecture" — the partial unique
 * indexes in 0002 allow exactly that — so uniqueness is probed in the same
 * scope the index enforces.
 */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  title: string,
  projectId: string | null,
  excludeId?: string,
) {
  const root = slugify(title) || "untitled";

  let query = supabase.from("documents").select("slug").like("slug", `${root}%`);
  query = projectId ? query.eq("project_id", projectId) : query.is("project_id", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  const taken = new Set((data ?? []).map((d) => d.slug));
  if (!taken.has(root)) return root;

  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export async function createDoc(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const title = str(form, "title");
  if (!title) return fail("Give the page a title.");

  const kind = (str(form, "kind") || "doc") as DocKind;
  const project_id = optional(form, "project_id");
  const parent_id = optional(form, "parent_id");
  const slug = await uniqueSlug(supabase, title, project_id);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title,
      slug,
      kind,
      project_id,
      parent_id,
      icon: optional(form, "icon"),
      body_md: "",
      created_by: session.profile.id,
      updated_by: session.profile.id,
    })
    .select("slug, kind")
    .maybeSingle();

  if (error || !data) return fail(explain(error, "Could not create the page."));

  revalidatePath(base(kind));
  redirect(`${base(data.kind)}/${data.slug}`);
}

export async function saveDoc(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const title = str(form, "title");
  if (!id) return fail("Missing page.");
  if (!title) return fail("A page needs a title.");

  const { data: current } = await supabase
    .from("documents")
    .select("slug, kind, project_id, title")
    .eq("id", id)
    .maybeSingle();

  if (!current) return fail("That page no longer exists.");

  // Renaming re-slugs, which changes the URL. Keeping the old slug on rename
  // would leave a page called "Runbook" living at /architecture forever.
  const slug =
    current.title === title
      ? current.slug
      : await uniqueSlug(supabase, title, current.project_id, id);

  const { error } = await supabase
    .from("documents")
    .update({
      title,
      slug,
      body_md: str(form, "body_md"),
      icon: optional(form, "icon"),
    })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not save."));

  revalidatePath(base(current.kind));
  revalidatePath(`${base(current.kind)}/${slug}`);
  if (slug !== current.slug) redirect(`${base(current.kind)}/${slug}`);
  return done("Saved.");
}

export async function setDocVisibility(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const client_visible = bool(form, "client_visible");

  const { data, error } = await supabase
    .from("documents")
    .update({ client_visible })
    .eq("id", id)
    .select("slug, kind")
    .maybeSingle();

  if (error || !data) return fail(explain(error, "Could not change visibility."));

  revalidatePath(`${base(data.kind)}/${data.slug}`);
  return done(client_visible ? "Shared with the client." : "Hidden from the client.");
}

export async function archiveDoc(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { data: doc } = await supabase
    .from("documents")
    .select("kind")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("documents")
    .update({ is_archived: true, client_visible: false })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not archive."));

  const home = base((doc?.kind ?? "doc") as DocKind);
  revalidatePath(home);
  redirect(home);
}

/**
 * Restore a previous body. The restore is itself an edit, so the update
 * trigger snapshots what you are replacing — you can always undo an undo.
 */
export async function restoreVersion(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const versionId = str(form, "version_id");

  const { data: version } = await supabase
    .from("document_versions")
    .select("document_id, body_md")
    .eq("id", versionId)
    .maybeSingle();

  if (!version) return fail("That version is gone.");

  const { data: doc, error } = await supabase
    .from("documents")
    .update({ body_md: version.body_md })
    .eq("id", version.document_id)
    .select("slug, kind")
    .maybeSingle();

  if (error || !doc) return fail(explain(error, "Could not restore."));

  revalidatePath(`${base(doc.kind)}/${doc.slug}`);
  return done("Restored.");
}
