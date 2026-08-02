"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession, requireStaff } from "../session";
import { sendMail, siteUrl } from "../mail";
import { done, explain, fail, optional, str, type ActionState } from "../action-utils";
import type { RequestStatus, RequestType } from "../database.types";

/** The client intake box. Feeds straight into the internal queue. */
export async function submitRequest(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const title = str(form, "title");
  const description = str(form, "description");
  if (!title) return fail("Give it a one-line title.");
  if (!description) return fail("Tell us a bit more.");

  const organization_id =
    session.profile.organization_id ?? optional(form, "organization_id");
  if (!organization_id) {
    return fail("Your account isn't linked to an organization yet.");
  }

  const { error } = await supabase.from("requests").insert({
    organization_id,
    project_id: optional(form, "project_id"),
    submitted_by: session.profile.id,
    title,
    description,
    request_type: (str(form, "request_type") || "change") as RequestType,
  });

  if (error) return fail(explain(error, "Could not submit the request."));

  const { data: staff } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["admin", "employee"]);

  await sendMail({
    to: (staff ?? []).map((s) => s.email),
    subject: `New request: ${title}`,
    heading: title,
    body: `${session.profile.full_name ?? session.profile.email} submitted a ${str(form, "request_type") || "change"} request.\n\n${description}`,
    cta: { label: "Open the queue", href: siteUrl("/workspace/requests") },
  });

  revalidatePath("/workspace", "layout");
  return done("Sent — we'll come back to you.");
}

export async function setRequestStatus(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("requests")
    .update({ status: str(form, "status") as RequestStatus })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not update the request."));

  revalidatePath("/workspace", "layout");
  return done("Updated.");
}

export async function markNotificationsRead(): Promise<void> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("profile_id", session.profile.id)
    .eq("read", false);

  revalidatePath("/workspace/notifications");
}
