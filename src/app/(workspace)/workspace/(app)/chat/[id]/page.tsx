import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import type {
  Channel,
  Message,
  MessageReaction,
  Profile,
} from "@/lib/workspace/database.types";
import Thread from "./Thread";

/** Deep history is a scroll-back problem nobody has yet; the last 200 is plenty. */
const WINDOW = 200;

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await supabaseServer();

  const { data: channelRow } = await supabase
    .from("channels")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!channelRow) notFound();
  const channel = channelRow as Channel;

  const { data: recent } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", id)
    .order("created_at", { ascending: false })
    .limit(WINDOW)
    .returns<Message[]>();

  // Fetched newest-first so the LIMIT keeps the most recent, then flipped for
  // rendering — the thread reads oldest at the top.
  const messages = (recent ?? []).slice().reverse();

  const [{ data: reactions }, { data: people }] = await Promise.all([
    messages.length
      ? supabase
          .from("message_reactions")
          .select("*")
          .in("message_id", messages.map((m) => m.id))
          .returns<MessageReaction[]>()
      : Promise.resolve({ data: [] as MessageReaction[] }),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, handle")
      .neq("role", "pending"),
  ]);

  return (
    <Thread
      channel={channel}
      initialMessages={messages}
      initialReactions={reactions ?? []}
      people={
        (people ?? []) as Pick<
          Profile,
          "id" | "full_name" | "email" | "avatar_url" | "handle"
        >[]
      }
      me={session.profile}
    />
  );
}
