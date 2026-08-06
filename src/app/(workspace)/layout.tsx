import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace — Techuila Guys",
  description: "Project workspace for TechuilaGuys clients and team.",
  robots: { index: false, follow: false },
};

/**
 * Every workspace route is per-user by definition. Without this, a build run
 * before the Supabase env vars land prerenders these pages as a static
 * "redirect to login" and serves that to signed-in users afterwards.
 */
export const dynamic = "force-dynamic";

/**
 * Workspace root. Deliberately shares nothing with the marketing site's chrome:
 * no Lenis, no custom cursor, no film grain. All tokens live under `.ws`.
 *
 * The theme pre-paint script used to live here, but a <script> in a component
 * is never executed on a client render and React warns about it — and it also
 * missed anyone who reached the workspace by client-side navigation from the
 * marketing nav. It is now a `beforeInteractive` script in the root layout.
 */
export default function WorkspaceRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="ws ws-scroll">{children}</div>;
}
