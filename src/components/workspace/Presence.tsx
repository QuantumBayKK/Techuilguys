"use client";

import {
  usePresence,
  usePresenceHeartbeat,
  type Peer,
} from "@/lib/workspace/realtime";
import type { Profile } from "@/lib/workspace/database.types";
import { Avatar } from "./ui/Primitives";

/**
 * "Who else is here", identical on every surface that has one — board, doc,
 * wiki page, whiteboard, chat, meeting. A face stack plus a count, and nothing
 * else: presence should be answerable at a glance and then ignored.
 */
export default function Presence({
  room,
  me,
  label = "here",
  max = 5,
}: {
  room: string;
  me: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
  label?: string;
  max?: number;
}) {
  const { others } = usePresence(room, me);
  if (others.length === 0) return null;

  const shown = others.slice(0, max);
  const rest = others.length - shown.length;

  return (
    <div className="flex items-center gap-2">
      <span className="ws-face-stack">
        {shown.map((p) => (
          <PeerFace key={p.id} peer={p} />
        ))}
        {rest > 0 ? (
          <span className="inline-flex h-[24px] w-[24px] items-center justify-center rounded-full border border-[var(--ws-line)] bg-[var(--ws-hover)] text-[10px] font-semibold text-[var(--ws-muted)]">
            +{rest}
          </span>
        ) : null}
      </span>
      <span className="hidden text-[11px] text-[var(--ws-faint)] sm:inline">
        {others.length} {label}
      </span>
    </div>
  );
}

function PeerFace({ peer }: { peer: Peer }) {
  return (
    <span
      className={peer.at ? undefined : "ws-here"}
      title={peer.at ? `${peer.name} — ${peer.at}` : peer.name}
    >
      <Avatar name={peer.name} email={peer.email} src={peer.avatar} size={24} />
    </span>
  );
}

/**
 * Mounted once in the shell. Keeps `profiles.last_seen_at` warm so "active
 * today" still works for someone with no socket open right now.
 */
export function PresenceHeartbeat() {
  usePresenceHeartbeat();
  return null;
}
