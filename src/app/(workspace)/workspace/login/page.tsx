import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, homeFor } from "@/lib/workspace/session";
import SetupNotice from "@/components/workspace/SetupNotice";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — Techuila Guys Workspace" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const session = await getSession();
  if (session) redirect(homeFor(session.profile.role));

  const { error, next } = await searchParams;

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-16">
      {/* one warm pool of light on the felt — the only ornament in here */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 12%, rgba(255,157,47,0.11), transparent 70%)",
        }}
      />

      <div className="ws-in relative w-full max-w-sm">
        <Link
          href="/"
          className="font-display block text-center text-[11px] uppercase tracking-[0.28em] text-[var(--ws-muted)] transition-colors hover:text-[var(--ws-accent)]"
        >
          Techuila <span className="text-[var(--ws-accent)]">Guys</span>
          <span className="ml-1.5 text-[var(--ws-faint)]">♠♣</span>
        </Link>

        <h1 className="font-display mt-7 text-center text-[28px] font-bold leading-tight tracking-tight">
          Client workspace
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-[var(--ws-muted)]">
          Track your build in real time — milestones, deliverables, and what the
          team shipped this week.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)] p-5 shadow-[var(--ws-shadow)]">
          <LoginForm next={next} />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[var(--ws-red)]/40 bg-[var(--ws-red)]/10 px-3 py-2 text-center text-xs text-[var(--ws-red)]"
          >
            {decodeURIComponent(error)}
          </p>
        ) : null}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[var(--ws-faint)]">
          New accounts land in a holding queue until an admin grants access.
        </p>
      </div>
    </main>
  );
}
