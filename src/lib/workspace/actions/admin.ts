"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "../session";
import { sendMail, siteUrl } from "../mail";
import {
  done,
  explain,
  fail,
  num,
  optional,
  str,
  type ActionState,
} from "../action-utils";
import type { Role } from "../database.types";

const ROLES: Role[] = ["admin", "employee", "client", "pending"];

/**
 * The approval gate. Assigning a role is what turns a random Google account
 * into someone with data access, so it is admin-only at every layer: this
 * check, the `profile_admin_write` policy, and the `guard_profile_privileges`
 * trigger that reverts role edits from non-admins.
 */
export async function setUserAccess(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const role = str(form, "role") as Role;
  if (!ROLES.includes(role)) return fail("Unknown role.");

  const organization_id = optional(form, "organization_id");
  if (role === "client" && !organization_id) {
    return fail("A client must be linked to an organization.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      // Internal staff belong to no client org.
      organization_id: role === "client" ? organization_id : null,
      weekly_capacity_hours: form.has("weekly_capacity_hours")
        ? num(form, "weekly_capacity_hours", 30)
        : undefined,
    })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not update access."));

  if (role !== "pending") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", id)
      .maybeSingle();

    if (profile) {
      await sendMail({
        to: [profile.email],
        subject: "Your TechuilaGuys workspace is ready",
        heading: "You're in",
        body: `Hi${profile.full_name ? ` ${profile.full_name}` : ""} — your workspace access is live. Sign in to track your build.`,
        cta: { label: "Open the workspace", href: siteUrl("/workspace") },
      });
    }
  }

  revalidatePath("/workspace", "layout");
  return done("Access updated.");
}

export async function createOrganization(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const name = str(form, "name");
  if (!name) return fail("Name the organization.");

  const { error } = await supabase
    .from("organizations")
    .insert({ name, logo_url: optional(form, "logo_url") });

  if (error) return fail(explain(error, "Could not create the organization."));

  revalidatePath("/workspace", "layout");
  return done("Organization created.");
}

export async function updateOrganization(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("organizations")
    .update({ name: str(form, "name"), logo_url: optional(form, "logo_url") })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not save the organization."));

  revalidatePath("/workspace", "layout");
  return done("Saved.");
}

export async function deleteOrganization(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", id);

  if (count) {
    return fail(
      `That organization still has ${count} project${count > 1 ? "s" : ""}. Delete or move them first.`,
    );
  }

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) return fail(explain(error, "Could not delete the organization."));

  revalidatePath("/workspace", "layout");
  return done("Deleted.");
}
