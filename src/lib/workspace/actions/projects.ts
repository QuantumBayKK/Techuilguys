"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin, requireSession, requireStaff } from "../session";
import { slugify } from "../format";
import { sendMail, siteUrl } from "../mail";
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
import type { Health, MilestoneStatus, ProjectStatus } from "../database.types";

/* ------------------------------- projects -------------------------------- */

export async function createProject(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const name = str(form, "name");
  if (!name) return fail("Give the project a name.");

  const organization_id = str(form, "organization_id");
  if (!organization_id) return fail("Pick the client organization.");

  const slug = slugify(str(form, "slug") || name);
  if (!slug) return fail("That name doesn't produce a usable URL — add letters.");

  const { error } = await supabase.from("projects").insert({
    name,
    slug,
    organization_id,
    description: optional(form, "description"),
    status: (optional(form, "status") ?? "discovery") as ProjectStatus,
    start_date: optional(form, "start_date"),
    target_date: optional(form, "target_date"),
    github_repo: optional(form, "github_repo"),
    notion_page_id: optional(form, "notion_page_id"),
  });

  if (error) return fail(explain(error, "Could not create the project."));

  revalidatePath("/workspace", "layout");
  redirect(`/workspace/projects/${slug}`);
}

export async function updateProject(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const slug = str(form, "slug");
  if (!id) return fail("Missing project.");

  const { error } = await supabase
    .from("projects")
    .update({
      name: str(form, "name"),
      description: optional(form, "description"),
      status: str(form, "status") as ProjectStatus,
      health: str(form, "health") as Health,
      health_note: optional(form, "health_note"),
      start_date: optional(form, "start_date"),
      target_date: optional(form, "target_date"),
      github_repo: optional(form, "github_repo"),
      notion_page_id: optional(form, "notion_page_id"),
    })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not save the project."));

  revalidatePath("/workspace", "layout");
  return done("Saved.");
}

export async function deleteProject(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  // Typing the name is the confirmation — no modal to mis-click through.
  if (str(form, "confirm") !== str(form, "name")) {
    return fail("Type the project name exactly to confirm deletion.");
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return fail(explain(error, "Could not delete the project."));

  revalidatePath("/workspace", "layout");
  redirect("/workspace/projects");
}

/* -------------------------------- members -------------------------------- */

export async function addProjectMember(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("project_members").insert({
    project_id: str(form, "project_id"),
    profile_id: str(form, "profile_id"),
    role_on_project: optional(form, "role_on_project"),
  });

  if (error) return fail(explain(error, "Could not add them to the project."));

  revalidatePath("/workspace/projects", "layout");
  return done("Added to the project.");
}

export async function removeProjectMember(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", str(form, "project_id"))
    .eq("profile_id", str(form, "profile_id"));

  if (error) return fail(explain(error, "Could not remove them."));

  revalidatePath("/workspace/projects", "layout");
  return done("Removed.");
}

/* ------------------------------- milestones ------------------------------ */

export async function createMilestone(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const project_id = str(form, "project_id");
  const title = str(form, "title");
  if (!title) return fail("Give the milestone a title.");

  const { count } = await supabase
    .from("milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project_id);

  const { error } = await supabase.from("milestones").insert({
    project_id,
    title,
    description: optional(form, "description"),
    due_date: optional(form, "due_date"),
    order_index: count ?? 0,
  });

  if (error) return fail(explain(error, "Could not add the milestone."));

  revalidatePath("/workspace", "layout");
  return done("Milestone added.");
}

export async function updateMilestone(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("milestones")
    .update({
      title: str(form, "title"),
      description: optional(form, "description"),
      status: str(form, "status") as MilestoneStatus,
      due_date: optional(form, "due_date"),
      order_index: num(form, "order_index"),
    })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not save the milestone."));

  revalidatePath("/workspace", "layout");
  return done("Saved.");
}

export async function setMilestoneStatus(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("milestones")
    .update({ status: str(form, "status") as MilestoneStatus })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not change the status."));

  revalidatePath("/workspace", "layout");
  return done();
}

export async function deleteMilestone(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete the milestone."));

  revalidatePath("/workspace", "layout");
  return done("Deleted.");
}

/**
 * The client-facing sign-off. Goes through the `approve_milestone` RPC, which
 * re-checks permission in Postgres — a client has no UPDATE policy on
 * milestones, so this is the only door and it only moves `done` → `approved`.
 */
export async function approveMilestone(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { error } = await supabase.rpc("approve_milestone", { p_milestone: id });
  if (error) {
    return fail(
      error.message.includes("not ready")
        ? "That milestone isn't marked done yet."
        : explain(error, "Could not record the approval."),
    );
  }

  // In-app notification is handled by a trigger; email is the loud channel.
  const { data: milestone } = await supabase
    .from("milestones")
    .select("title, projects(name, slug)")
    .eq("id", id)
    .maybeSingle<{ title: string; projects: { name: string; slug: string } | null }>();

  const { data: staff } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["admin", "employee"]);

  await sendMail({
    to: (staff ?? []).map((s) => s.email),
    subject: `Approved: ${milestone?.title ?? "Milestone"}`,
    heading: `${milestone?.projects?.name ?? "A project"} — milestone approved`,
    body: `${session.profile.full_name ?? session.profile.email} signed off on "${
      milestone?.title ?? "a milestone"
    }".`,
    cta: milestone?.projects
      ? {
          label: "Open the project",
          href: siteUrl(`/workspace/projects/${milestone.projects.slug}/milestones`),
        }
      : undefined,
  });

  revalidatePath("/workspace", "layout");
  return done("Approved — thank you.");
}

/* -------------------------------- settings ------------------------------- */

export async function updateOwnProfile(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: optional(form, "full_name") })
    .eq("id", session.profile.id);

  if (error) return fail(explain(error, "Could not save your profile."));

  revalidatePath("/workspace", "layout");
  return done("Saved.");
}

export async function toggleTaskVisibility(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("tasks")
    .update({ client_visible: bool(form, "client_visible") })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not change visibility."));

  revalidatePath("/workspace", "layout");
  return done();
}
