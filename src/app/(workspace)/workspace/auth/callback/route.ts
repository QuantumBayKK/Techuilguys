import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { homeFor } from "@/lib/workspace/session";

/**
 * OAuth / magic-link landing. Exchanges the code for a session, then routes by
 * role so nobody has to think about which half of the product they belong in.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const oauthError =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/workspace/login?error=${encodeURIComponent(message)}`, url.origin),
    );

  if (!isSupabaseConfigured) return fail("Workspace backend is not configured.");
  if (oauthError) return fail(oauthError);
  if (!code) return fail("Sign-in link was missing or already used.");

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(error.message);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Could not establish a session. Try again.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // A safe `next` is same-origin and inside the workspace.
  const safeNext =
    next && next.startsWith("/workspace") && !next.startsWith("//") ? next : null;

  const destination =
    profile && profile.role !== "pending"
      ? (safeNext ?? homeFor(profile.role))
      : "/workspace/pending";

  return NextResponse.redirect(new URL(destination, url.origin));
}
