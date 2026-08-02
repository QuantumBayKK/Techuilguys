import { requireSession } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import Shell from "@/components/workspace/Shell";

/**
 * Everything behind the gate renders inside the shell. Login, the callback and
 * the pending screen sit outside this segment on purpose — they must not show
 * navigation to a workspace the visitor may not be allowed into.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const supabase = await supabaseServer();

  // RLS already narrows this to "projects this person may see", so the same
  // query serves an admin (all) and a client (their org's) without a branch.
  const [{ data: projects }, { data: org }, { count: openRequests }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("slug, name, status")
        .order("created_at", { ascending: false }),
      session.profile.organization_id
        ? supabase
            .from("organizations")
            .select("name, logo_url")
            .eq("id", session.profile.organization_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      session.isStaff
        ? supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .in("status", ["new", "reviewing"])
        : Promise.resolve({ count: 0 }),
    ]);

  return (
    <Shell
      profile={session.profile}
      org={org ?? null}
      projects={projects ?? []}
      openRequests={openRequests ?? 0}
    >
      {children}
    </Shell>
  );
}
