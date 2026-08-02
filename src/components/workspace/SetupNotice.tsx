import Link from "next/link";

/**
 * Shown instead of the login screen when Supabase env vars are missing, so a
 * fresh deploy explains itself rather than throwing. Paste the keys into Vercel
 * and this screen disappears on the next request.
 */
export default function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ws-accent)]">
        Workspace
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">
        Backend not connected yet
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ws-muted)]">
        The workspace is deployed but has no Supabase project bound to it. Add
        these environment variables and redeploy — no code changes needed.
      </p>

      <ul className="mono mt-6 space-y-2 rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)] p-4 text-xs">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        <li>SUPABASE_SERVICE_ROLE_KEY</li>
        <li className="text-[var(--ws-faint)]">RESEND_API_KEY (optional)</li>
        <li className="text-[var(--ws-faint)]">GITHUB_TOKEN (optional)</li>
        <li className="text-[var(--ws-faint)]">NOTION_TOKEN (optional)</li>
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-[var(--ws-muted)]">
        Then run <span className="mono">supabase/migrations/0001_workspace.sql</span>{" "}
        in the Supabase SQL editor. Full steps are in{" "}
        <span className="mono">WORKSPACE.md</span>.
      </p>

      <Link
        href="/"
        className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ws-muted)] hover:text-[var(--ws-accent)]"
      >
        ← Back to the site
      </Link>
    </main>
  );
}
