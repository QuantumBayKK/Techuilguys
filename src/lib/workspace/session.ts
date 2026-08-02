import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "./database.types";

export type Session = {
  profile: Profile;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
};

/** Current profile, or null when signed out / backend not configured. */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    profile,
    isAdmin: profile.role === "admin",
    isStaff: profile.role === "admin" || profile.role === "employee",
    isClient: profile.role === "client",
  };
}

/**
 * Gate for every page inside the workspace: signed in, and past the pending
 * screen. Callers that need a stricter role use the helpers below.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/workspace/login");
  if (session.profile.role === "pending") redirect("/workspace/pending");
  return session;
}

export async function requireStaff(): Promise<Session> {
  const session = await requireSession();
  if (!session.isStaff) redirect("/workspace/portal");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/workspace/dashboard");
  return session;
}

/** Where a given role belongs when they hit `/workspace` bare. */
export function homeFor(role: Profile["role"]) {
  if (role === "admin" || role === "employee") return "/workspace/dashboard";
  if (role === "client") return "/workspace/portal";
  return "/workspace/pending";
}
