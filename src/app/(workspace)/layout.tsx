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
 * The inline script runs before paint so light mode never flashes dark.
 */
export default function WorkspaceRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem("ws-theme");document.documentElement.dataset.wsTheme=t==="light"?"light":"dark"}catch(e){}`,
        }}
      />
      <div className="ws ws-scroll">{children}</div>
    </>
  );
}
