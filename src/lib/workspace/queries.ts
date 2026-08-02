import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { Profile, Project } from "./database.types";

/**
 * Load a project by slug. RLS does the authorization: a client asking for
 * another org's slug gets zero rows, which surfaces as a 404 — the same
 * response as a slug that doesn't exist, so the URL leaks nothing either way.
 */
export async function getProject(slug: string): Promise<Project> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  return data;
}

export type TeamMember = Pick<
  Profile,
  "id" | "full_name" | "email" | "avatar_url"
> & { role_on_project: string | null };

export async function getProjectTeam(projectId: string): Promise<TeamMember[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("project_members")
    .select("role_on_project, profiles(id, full_name, email, avatar_url)")
    .eq("project_id", projectId)
    .returns<
      {
        role_on_project: string | null;
        profiles: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
      }[]
    >();

  return (data ?? [])
    .filter((row) => row.profiles)
    .map((row) => ({ ...row.profiles!, role_on_project: row.role_on_project }));
}

/** Everyone who can be assigned work — staff only. */
export async function getStaffProfiles() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, weekly_capacity_hours")
    .in("role", ["admin", "employee"])
    .order("full_name");
  return data ?? [];
}

export async function getOrganizations() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .order("name");
  return data ?? [];
}

/**
 * The client landing's activity feed: updates, milestone movement and new
 * deliverables, merged newest-first. Each source is RLS-filtered on its own, so
 * the merged feed inherits the same guarantees.
 */
export type ActivityItem = {
  id: string;
  kind: "update" | "milestone" | "file" | "task";
  title: string;
  detail: string | null;
  at: string;
};

export async function getActivity(
  projectId: string,
  limit = 10,
): Promise<ActivityItem[]> {
  const supabase = await supabaseServer();

  const [updates, milestones, files, tasks] = await Promise.all([
    supabase
      .from("updates")
      .select("id, title, update_type, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("milestones")
      .select("id, title, status, approved_at, created_at")
      .eq("project_id", projectId)
      .in("status", ["done", "approved"])
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("files")
      .select("id, name, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("tasks")
      .select("id, title, status, created_at")
      .eq("project_id", projectId)
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...(updates.data ?? []).map((u) => ({
      id: u.id,
      kind: "update" as const,
      title: u.title,
      detail: `${u.update_type} update posted`,
      at: u.created_at,
    })),
    ...(milestones.data ?? []).map((m) => ({
      id: m.id,
      kind: "milestone" as const,
      title: m.title,
      detail: m.status === "approved" ? "Approved" : "Marked done",
      at: m.approved_at ?? m.created_at,
    })),
    ...(files.data ?? []).map((f) => ({
      id: f.id,
      kind: "file" as const,
      title: f.name,
      detail: "Deliverable added",
      at: f.created_at,
    })),
    ...(tasks.data ?? []).map((t) => ({
      id: t.id,
      kind: "task" as const,
      title: t.title,
      detail: "Task completed",
      at: t.created_at,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
