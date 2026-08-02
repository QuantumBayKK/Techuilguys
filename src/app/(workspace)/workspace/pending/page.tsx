import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/workspace/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SetupNotice from "@/components/workspace/SetupNotice";
import SignOutButton from "@/components/workspace/SignOutButton";
import { Avatar } from "@/components/workspace/ui/Primitives";

export const metadata = { title: "Awaiting approval — Techuila Guys Workspace" };

/**
 * The holding pen. A Google account alone gets you exactly this screen and
 * nothing else — RLS gives a `pending` role no rows on any table, so there is
 * no data behind this page to leak even if the redirect were bypassed.
 */
export default async function PendingPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const session = await getSession();
  if (!session) redirect("/workspace/login");
  if (session.profile.role !== "pending") redirect(homeFor(session.profile.role));

  const { profile } = session;

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-5 py-16">
      <div className="ws-in w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ws-line-strong)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="var(--ws-accent)"
              strokeWidth="1.6"
              opacity="0.5"
            />
            <path
              d="M12 7v5l3.2 1.9"
              stroke="var(--ws-accent)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="font-display mt-6 text-2xl font-bold tracking-tight">
          You&apos;re in the queue
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ws-muted)]">
          Your account is created but not yet linked to a project. One of us will
          approve it and connect you to your organization — usually the same day.
          You&apos;ll get an email the moment it&apos;s live.
        </p>

        <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-[var(--ws-line)] bg-[var(--ws-surface)] py-2 pl-2 pr-4">
          <Avatar
            name={profile.full_name}
            email={profile.email}
            src={profile.avatar_url}
            size={30}
          />
          <span className="mono text-xs text-[var(--ws-muted)]">
            {profile.email}
          </span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs">
          <SignOutButton />
          <span className="text-[var(--ws-faint)]">·</span>
          <a
            href="mailto:info.quantumbay@gmail.com?subject=Workspace%20access"
            className="font-semibold text-[var(--ws-muted)] hover:text-[var(--ws-accent)]"
          >
            Nudge us
          </a>
        </div>
      </div>
    </main>
  );
}
