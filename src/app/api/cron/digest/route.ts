import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mailEnabled, sendMail, siteUrl } from "@/lib/workspace/mail";

export const dynamic = "force-dynamic";

/**
 * The 9am digest. Everything that isn't a milestone approval or a new client
 * request gets batched here, which is what keeps us under Resend's 100/day on
 * the free tier — one email per person with unread notifications, not one per
 * event.
 *
 * Runs on the service-role client because it reads across every user's
 * notifications, which is exactly what RLS forbids for a normal session.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    !secret ||
    request.headers.get("authorization") === `Bearer ${secret}` ||
    request.nextUrl.searchParams.get("secret") === secret;

  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ skipped: "supabase not configured" });
  }
  if (!mailEnabled) {
    return NextResponse.json({ skipped: "RESEND_API_KEY not set" });
  }

  const supabase = supabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ skipped: "SUPABASE_SERVICE_ROLE_KEY not set" });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("profile_id, title, body, type, created_at")
    .eq("read", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[digest]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The two immediate types already emailed on the way in — don't double-send.
  const batched = (notifications ?? []).filter(
    (n) => n.type !== "milestone.approved" && n.type !== "request.new",
  );

  if (batched.length === 0) {
    return NextResponse.json({ sent: 0, reason: "nothing to digest" });
  }

  const byPerson = new Map<string, typeof batched>();
  for (const item of batched) {
    const bucket = byPerson.get(item.profile_id) ?? [];
    bucket.push(item);
    byPerson.set(item.profile_id, bucket);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [...byPerson.keys()]);

  let sent = 0;
  for (const profile of profiles ?? []) {
    const items = byPerson.get(profile.id) ?? [];
    if (items.length === 0) continue;

    await sendMail({
      to: [profile.email],
      subject: `${items.length} update${items.length > 1 ? "s" : ""} in your workspace`,
      heading: `Since yesterday${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`,
      body: items
        .map((item) => `• ${item.title}${item.body ? `\n  ${item.body}` : ""}`)
        .join("\n\n"),
      cta: { label: "Open the workspace", href: siteUrl("/workspace") },
    });
    sent += 1;
  }

  return NextResponse.json({ sent, notifications: batched.length });
}
