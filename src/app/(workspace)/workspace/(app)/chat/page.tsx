import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { EmptyState } from "@/components/workspace/ui/Primitives";

/**
 * Bare `/workspace/chat` is a router, not a page: drop into the channel with
 * the most recent activity. Only shows a screen of its own when there is
 * nothing at all to drop into.
 */
export default async function ChatIndex() {
  await requireSession();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("channels")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) redirect(`/workspace/chat/${data.id}`);

  return (
    <EmptyState
      art={<MessageSquare size={34} strokeWidth={1.25} />}
      title="No channels yet"
    >
      Create one and it appears in the rail. Project channels can be opened to
      the client; everything else stays internal.
    </EmptyState>
  );
}
