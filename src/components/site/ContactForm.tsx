"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CONTACT, SITE } from "@/content/site-copy";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string }
  | { kind: "fallback" };

const input =
  "mt-2 block w-full rounded-[14px] border border-rule bg-white px-4 py-3 text-[0.98rem] text-ink placeholder:text-muted/70 transition-colors focus:border-ink focus:outline-none";

/**
 * Posts to /api/contact, which validates on the server and emails both
 * founders. "Sent" is only shown after the server confirms delivery. Without a
 * mail key the form says so and shows our addresses — it never fakes success.
 */
export default function ContactForm() {
  const params = useSearchParams();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [brief, setBrief] = useState("");

  // Carry over the one-liner typed into the hero prompt.
  useEffect(() => {
    const b = params.get("brief");
    if (b) setBrief(b.slice(0, 500));
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        setBrief("");
        setState({ kind: "sent" });
      } else if (json.error === "unconfigured") {
        setState({ kind: "fallback" });
      } else {
        setState({ kind: "error", message: json.error ?? "The message didn't send. Try again, or email us directly." });
      }
    } catch {
      setState({ kind: "error", message: "You seem to be offline. Check your connection and send again." });
    }
  }

  if (state.kind === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        className="rounded-[24px] border border-black/5 bg-card p-8 md:p-10"
      >
        <h2 className="t-2">Brief sent.</h2>
        <p className="mt-3 text-muted">Both founders have it, and we'll reply by email. Want to talk sooner? Book a call.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-ink">
            Book a call <ArrowRight size={14} aria-hidden />
          </a>
          <button type="button" onClick={() => setState({ kind: "idle" })} className="btn btn-line">
            Send another brief
          </button>
        </div>
      </motion.div>
    );
  }

  const sending = state.kind === "sending";

  return (
    <form id="brief" onSubmit={onSubmit} className="relative scroll-mt-28 rounded-[24px] border border-black/5 bg-card p-6 md:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Your name
          <input name="name" required autoComplete="name" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Company <span className="font-normal text-muted">(optional)</span>
          <input name="company" autoComplete="organization" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Project type
          <select name="projectType" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose one
            </option>
            {CONTACT.projectTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Budget <span className="font-normal text-muted">(optional)</span>
          <select name="budget" defaultValue="" className={input}>
            <option value="">Choose a range</option>
            {CONTACT.budgets.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Timeline
          <select name="timeline" defaultValue="" className={input}>
            <option value="">Choose a timeline</option>
            {CONTACT.timelines.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          What are you building?
          <textarea
            name="message"
            required
            rows={6}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Who it's for, what it must do, and anything that already exists."
            className={`${input} resize-y`}
          />
        </label>
        {/* Honeypot — hidden from people and assistive tech. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <AnimatePresence>
        {(state.kind === "error" || state.kind === "fallback") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="overflow-hidden"
          >
            <div className="mt-6 rounded-[14px] border border-accent-deep/40 bg-accent/10 px-4 py-3 text-sm">
              {state.kind === "error" ? (
                state.message
              ) : (
                <>
                  The form can&apos;t send right now, so your brief hasn&apos;t gone anywhere yet. Email it to{" "}
                  {SITE.emails.map((e, i) => (
                    <span key={e.address}>
                      {i > 0 && " or "}
                      <a href={`mailto:${e.address}`} className="link-u link break-all font-medium">
                        {e.address}
                      </a>
                    </span>
                  ))}
                  .
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-7 flex justify-end">
        <button type="submit" disabled={sending} className="btn btn-ink btn-lg disabled:opacity-60">
          {sending ? "Sending…" : "Send brief"} {!sending && <ArrowRight size={16} aria-hidden />}
        </button>
      </div>
    </form>
  );
}
