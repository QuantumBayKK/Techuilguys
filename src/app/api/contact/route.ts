import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { SITE } from "@/content/site-copy";

/**
 * Project enquiries from /contact → both founders' inboxes, with Reply-To set to
 * the sender so a reply goes straight back to them.
 *
 * Needs RESEND_API_KEY (and a verified RESEND_FROM domain for production
 * delivery). Without it the route answers 503 and the form tells the visitor to
 * email us directly — it never pretends to have sent.
 */

const LIMITS = { name: 120, email: 200, company: 160, projectType: 80, budget: 60, timeline: 60, message: 5000 };

// Best-effort throttle per serverless instance: 5 enquiries / 10 min / IP.
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "The form data couldn't be read. Refresh the page and try again." }, { status: 400 });
  }

  // Honeypot: real people never fill the hidden field. Pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const field = (k: keyof typeof LIMITS) =>
    typeof body[k] === "string" ? (body[k] as string).trim().slice(0, LIMITS[k]) : "";
  const data = {
    name: field("name"),
    email: field("email"),
    company: field("company"),
    projectType: field("projectType"),
    budget: field("budget"),
    timeline: field("timeline"),
    message: field("message"),
  };

  if (!data.name || !data.message) {
    return NextResponse.json({ error: "Add your name and a short description of the project." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return NextResponse.json({ error: "Enter a valid email address so we can reply." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) {
    return NextResponse.json({ error: "Too many messages from this connection. Email us directly instead." }, { status: 429 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }

  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company || "—"],
    ["Project type", data.projectType || "—"],
    ["Budget", data.budget || "—"],
    ["Timeline", data.timeline || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#55625c">${k}</td><td style="padding:6px 0">${escape(v)}</td></tr>`,
    )
    .join("");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Techuila Guys <onboarding@resend.dev>",
      to: SITE.emails.map((e) => e.address),
      replyTo: data.email,
      subject: `New enquiry: ${data.name}${data.company ? ` (${data.company})` : ""}`,
      html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0d1a15;max-width:560px">
<h2 style="margin:0 0 16px">New project enquiry</h2>
<table style="border-collapse:collapse;font-size:14px">${rows}</table>
<p style="white-space:pre-wrap;margin-top:20px;font-size:15px;line-height:1.6">${escape(data.message)}</p>
<p style="color:#55625c;font-size:12px;margin-top:24px">Sent from the contact form on ${SITE.url}. Reply to this email to answer ${escape(data.name)} directly.</p>
</div>`,
    });
    if (error) throw error;
  } catch (err) {
    console.error("[contact] send failed", err);
    return NextResponse.json({ error: "unconfigured" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
