"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button, Divider, Input, Label } from "@/components/workspace/ui/Primitives";

/**
 * Two doors: Google OAuth (the documented path) and an email magic link as the
 * fallback for clients whose company doesn't use Google. Both land on the same
 * callback and the same `pending` gate.
 */
export default function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/workspace/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`;

  async function withGoogle() {
    setBusy("google");
    setError(null);
    const { error: err } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) {
      setError(err.message);
      setBusy(null);
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    const { error: err } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(null);
    if (err) setError(err.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="py-3 text-center">
        <p className="font-display text-base font-bold tracking-tight">
          Check your inbox
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--ws-muted)]">
          We sent a sign-in link to{" "}
          <span className="mono text-[var(--ws-text)]">{email}</span>. It expires
          in an hour.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-xs font-semibold text-[var(--ws-accent)] hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="primary"
        onClick={withGoogle}
        disabled={busy !== null}
        className="w-full py-2.5"
      >
        <GoogleMark />
        {busy === "google" ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="my-4">
        <Divider label="or" />
      </div>

      <form onSubmit={withEmail}>
        <Label>Work email</Label>
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={busy !== null || email.trim().length === 0}
          className="mt-2.5 w-full py-2.5"
        >
          {busy === "email" ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-center text-xs text-[var(--ws-red)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15.6z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C7.9 41.1 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.5 28.5c-.5-1.3-.7-2.7-.7-4.5s.3-3.2.7-4.5l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 10z"
      />
      <path
        fill="#EA4335"
        d="M24 10.6c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.4 29.9 2 24 2 15.4 2 7.9 6.9 4.4 14l7.1 5.5c1.8-5.3 6.7-8.9 12.5-8.9z"
      />
    </svg>
  );
}
