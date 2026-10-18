"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SITE } from "@/content/site";

const BUDGETS = ["Under $10k", "$10k to $25k", "$25k to $50k", "$50k to $100k", "Over $100k", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within 1 to 3 months", "In 3 to 6 months", "Just exploring"];

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string } | { kind: "fallback" };

const input =
  "mt-2 block w-full rounded-[10px] border border-rule bg-white px-4 py-3 text-[1rem] text-ink placeholder:text-muted/70 transition-colors focus:border-ink focus:outline-none";

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

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
        className="rounded-2xl border border-rule bg-white p-8 md:p-10"
      >
        <h2 className="t-2">Message sent.</h2>
        <p className="mt-3 text-muted">
          Thanks — both founders have it. {SITE.responseTime} If it&apos;s urgent, book a call and we&apos;ll talk sooner.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-ink">
            Book a call
          </a>
          <button type="button" onClick={() => setState({ kind: "idle" })} className="btn btn-line">
            Send another message
          </button>
        </div>
      </motion.div>
    );
  }

  const sending = state.kind === "sending";

  return (
    <form onSubmit={onSubmit} className="relative rounded-2xl border border-rule bg-white p-6 md:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-[0.95rem] font-medium">
          Your name
          <input name="name" required autoComplete="name" className={input} />
        </label>
        <label className="block text-[0.95rem] font-medium">
          Work email
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block text-[0.95rem] font-medium sm:col-span-2">
          Company <span className="font-normal text-muted">(optional)</span>
          <input name="company" autoComplete="organization" className={input} />
        </label>
        <label className="block text-[0.95rem] font-medium">
          Budget <span className="font-normal text-muted">(optional)</span>
          <select name="budget" defaultValue="" className={input}>
            <option value="">Choose a range</option>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="block text-[0.95rem] font-medium">
          Timeline <span className="font-normal text-muted">(optional)</span>
          <select name="timeline" defaultValue="" className={input}>
            <option value="">Choose a timeline</option>
            {TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-[0.95rem] font-medium sm:col-span-2">
          What are you building?
          <textarea
            name="message"
            required
            rows={6}
            placeholder="The problem, who it's for, and anything that already exists."
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
            <div className="mt-6 rounded-[10px] border border-brass-deep/40 bg-brass/10 px-4 py-3 text-[0.95rem]">
              {state.kind === "error" ? (
                state.message
              ) : (
                <>
                  The form can&apos;t send right now, so your message hasn&apos;t gone anywhere yet. Email us directly at{" "}
                  {SITE.emails.map((e, i) => (
                    <span key={e.address}>
                      {i > 0 && " or "}
                      <a href={`mailto:${e.address}`} className="link-u link font-medium break-all">
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

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{SITE.responseTime}</p>
        <button type="submit" disabled={sending} className="btn btn-ink disabled:opacity-60">
          {sending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
