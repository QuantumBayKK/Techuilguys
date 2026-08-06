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
import type { ChannelKind } from "../database.types";

export async function createChannel(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const raw = str(form, "name");
  if (!raw) return fail("Name the channel.");

  // Slack-shaped names, because a channel called "Q3 Planning!!" reads badly
  // next to the "#" the UI puts in front of it.
  const name = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  if (!name) return fail("That name has no usable characters.");

  const project_id = optional(form, "project_id");

  const { data, error } = await supabase
    .from("channels")
    .insert({
      name,
      topic: optional(form, "topic"),
      project_id,
      kind: (project_id ? "project" : "workspace") as ChannelKind,
      client_visible: bool(form, "client_visible"),
      created_by: session.profile.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return fail(explain(error, "Could not create the channel."));

  await supabase
    .from("channel_members")
    .insert({ channel_id: data.id, profile_id: session.profile.id });

  revalidatePath("/workspace/chat");
  redirect(`/workspace/chat/${data.id}`);
}

export async function updateChannel(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const id = str(form, "id");
  const { error } = await supabase
    .from("channels")
    .update({
      topic: optional(form, "topic"),
      client_visible: bool(form, "client_visible"),
    })
    .eq("id", id);

  if (error) return fail(explain(error, "Could not update the channel."));

  revalidatePath(`/workspace/chat/${id}`);
  return done("Updated.");
}

export async function deleteChannel(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireStaff();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete the channel."));

  revalidatePath("/workspace/chat");
  redirect("/workspace/chat");
}

/**
 * Send. Deliberately does NOT revalidate: the message arrives back through
 * Realtime in a few milliseconds, and a router refresh on every keystroke-send
 * would make the thread flicker. Insert, and let CDC do the rendering.
 */
export async function sendMessage(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const body = str(form, "body");
  const attachment_path = optional(form, "attachment_path");

  if (!body && !attachment_path) return fail("Nothing to send.");

  const { error } = await supabase.from("messages").insert({
    channel_id: str(form, "channel_id"),
    author_id: session.profile.id,
    body: body || (str(form, "attachment_name") ?? "Attachment"),
    reply_to: optional(form, "reply_to"),
    attachment_path,
    attachment_name: optional(form, "attachment_name"),
    attachment_size: Number(form.get("attachment_size")) || null,
  });

  if (error) return fail(explain(error, "Message didn't send."));
  return done();
}

export async function editMessage(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireSession();
  const supabase = await supabaseServer();

  const body = str(form, "body");
  if (!body) return fail("An edit can't be empty — delete it instead.");

  const { error } = await supabase
    .from("messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not edit."));
  return done();
}

export async function deleteMessage(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireSession();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", str(form, "id"));

  if (error) return fail(explain(error, "Could not delete."));
  return done();
}

/** Reactions toggle: the same emoji twice removes it. */
export async function toggleReaction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const supabase = await supabaseServer();

  const message_id = str(form, "message_id");
  const emoji = str(form, "emoji");

  const { data: existing } = await supabase
    .from("message_reactions")
    .select("emoji")
    .eq("message_id", message_id)
    .eq("profile_id", session.profile.id)
    .eq("emoji", emoji)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", message_id)
        .eq("profile_id", session.profile.id)
        .eq("emoji", emoji)
    : await supabase
        .from("message_reactions")
        .insert({ message_id, profile_id: session.profile.id, emoji });

  if (error) return fail(explain(error, "Could not react."));
  return done();
}
