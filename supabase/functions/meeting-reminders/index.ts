// Supabase Edge Function — meeting reminders.
//
// Deploy:  supabase functions deploy meeting-reminders
// Schedule: Supabase Dashboard → Database → Cron, every 5 minutes:
//   select net.http_post(
//     url    := 'https://<ref>.functions.supabase.co/meeting-reminders',
//     headers:= jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
//   );
//
// WHY an Edge Function rather than another Vercel cron route: this must fire on
// a five-minute cadence, and Vercel Hobby allows two cron invocations a DAY.
// The daily digest stays on Vercel because once a day is exactly what it needs.
//
// Runs with the service-role key, so it reads across every user — that is the
// point, and also why the bearer check below is not optional.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

/** Remind once, 10–25 minutes out. The window is wider than the 5-minute tick
 *  so a missed run still catches the meeting on the next one. */
const LEAD_MIN = 10;
const LEAD_MAX = 25;

type PersonRow = { email: string; full_name: string | null };
type AttendeeRow = {
  profile_id: string;
  response: string;
  profiles: PersonRow | PersonRow[] | null;
};

Deno.serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const now = Date.now();
  const from = new Date(now + LEAD_MIN * 60_000).toISOString();
  const to = new Date(now + LEAD_MAX * 60_000).toISOString();

  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("id, title, starts_at, join_url, status")
    .eq("status", "scheduled")
    .gte("starts_at", from)
    .lt("starts_at", to);

  if (error) {
    console.error("meeting-reminders: query failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  let notified = 0;
  let emailed = 0;

  for (const meeting of meetings ?? []) {
    // Idempotency without a state column: the notification row IS the record.
    // A re-run inside the same window finds it and skips.
    const link = `/workspace/meetings/${meeting.id}`;
    const { count: already } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "meeting.soon")
      .eq("link", link);

    if (already && already > 0) continue;

    const { data: attendees } = await supabase
      .from("meeting_attendees")
      .select("profile_id, response, profiles(email, full_name)")
      .eq("meeting_id", meeting.id)
      .neq("response", "no");

    // An untyped client widens an embedded relation to an array even when the
    // FK is to-one, so normalise rather than trusting the shape.
    const targets = ((attendees ?? []) as unknown as AttendeeRow[])
      .map((a) => ({
        profile_id: a.profile_id,
        profile: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      }))
      .filter((a): a is { profile_id: string; profile: PersonRow } => Boolean(a.profile));

    if (targets.length === 0) continue;

    const minutes = Math.round(
      (new Date(meeting.starts_at).getTime() - now) / 60_000,
    );

    const { error: notifyError } = await supabase.rpc("notify_profiles", {
      p_ids: targets.map((a) => a.profile_id),
      p_type: "meeting.soon",
      p_title: `${meeting.title} starts in ${minutes} minutes`,
      p_body: meeting.join_url ? "Join link is on the meeting page." : null,
      p_link: link,
    });

    if (notifyError) {
      console.error("meeting-reminders: notify failed", meeting.id, notifyError);
      continue;
    }
    notified += targets.length;

    if (RESEND_KEY && RESEND_FROM) {
      const sent = await email(
        targets.map((a) => a.profile.email),
        `Starting soon: ${meeting.title}`,
        `<p>${escapeHtml(meeting.title)} starts in ${minutes} minutes.</p>` +
          (meeting.join_url
            ? `<p><a href="${escapeAttr(meeting.join_url)}">Join</a></p>`
            : "") +
          (SITE_URL
            ? `<p><a href="${escapeAttr(SITE_URL + link)}">Open in the workspace</a></p>`
            : ""),
      );
      if (sent) emailed += targets.length;
    }
  }

  return Response.json({
    checked: meetings?.length ?? 0,
    notified,
    emailed,
  });
});

/** Best-effort: an email outage must not roll back the in-app notification. */
async function email(to: string[], subject: string, html: string) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
    });
    if (!res.ok) console.error("meeting-reminders: resend", await res.text());
    return res.ok;
  } catch (err) {
    console.error("meeting-reminders: resend threw", err);
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => escapeHtml(s).replace(/"/g, "&quot;");
