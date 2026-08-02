import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, homeFor } from "@/lib/workspace/session";
import SetupNotice from "@/components/workspace/SetupNotice";

/** The door. Sends each role where it belongs and renders nothing itself. */
export default async function WorkspaceEntry() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const session = await getSession();
  if (!session) redirect("/workspace/login");
  redirect(homeFor(session.profile.role));
}
