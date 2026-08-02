import "server-only";
import { Resend } from "resend";

/**
 * Resend wrapper. Free tier is 3k/month, 100/day — well clear of ~25 accounts
 * as long as only *immediate* events send instantly (milestone approvals, new
 * client requests) and everything else rides the daily digest.
 *
 * Every send is best-effort: a mail failure must never roll back the database
 * write that triggered it.
 */
const FROM = process.env.RESEND_FROM ?? "TechuilaGuys <onboarding@resend.dev>";

export const mailEnabled = Boolean(process.env.RESEND_API_KEY);

export async function sendMail({
  to,
  subject,
  heading,
  body,
  cta,
}: {
  to: string[];
  subject: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  const recipients = [...new Set(to.filter(Boolean))];
  if (!mailEnabled || recipients.length === 0) return;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: recipients,
      subject,
      html: shell(heading, body, cta),
    });
  } catch (error) {
    console.error("[mail] send failed", error);
  }
}

export function siteUrl(path = "") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

/** Inline-styled because email clients ignore <style> as often as not. */
function shell(heading: string, body: string, cta?: { label: string; href: string }) {
  return `
<div style="background:#0a0907;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#100d0a;border:1px solid rgba(233,225,207,.1);border-radius:14px;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid rgba(233,225,207,.1)">
      <span style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9a8f7d">
        Techuila <span style="color:#ff9d2f">Guys</span> &#9824;&#9827;
      </span>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:19px;line-height:1.3;color:#ece4d6">${escapeHtml(heading)}</h1>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#9a8f7d;white-space:pre-wrap">${escapeHtml(body)}</p>
      ${
        cta
          ? `<a href="${cta.href}" style="display:inline-block;margin-top:22px;padding:11px 20px;border-radius:9px;background:#ff9d2f;color:#0a0907;font-size:13px;font-weight:700;text-decoration:none">${escapeHtml(cta.label)}</a>`
          : ""
      }
    </div>
    <div style="padding:14px 24px;border-top:1px solid rgba(233,225,207,.1);font-size:11px;color:#5f5746">
      You're receiving this because you have a TechuilaGuys workspace account.
    </div>
  </div>
</div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
