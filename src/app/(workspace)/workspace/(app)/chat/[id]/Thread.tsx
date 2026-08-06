"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CornerUpLeft, Send, SmilePlus, Trash2, X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useBroadcast, useLiveRows, usePresence } from "@/lib/workspace/realtime";
import { relativeTime } from "@/lib/workspace/format";
import { Avatar, Button } from "@/components/workspace/ui/Primitives";
import {
  deleteMessage,
  sendMessage,
  toggleReaction,
} from "@/lib/workspace/actions/chat";
import type {
  Channel,
  Message,
  MessageReaction,
  Profile,
} from "@/lib/workspace/database.types";

type Person = Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "handle">;

const QUICK = ["👍", "🎉", "👀", "🔥"];

/** Two messages group when the same person posts again within five minutes. */
const GROUP_WINDOW = 5 * 60 * 1000;

export default function Thread({
  channel,
  initialMessages,
  initialReactions,
  people,
  me,
}: {
  channel: Channel;
  initialMessages: Message[];
  initialReactions: MessageReaction[];
  people: Person[];
  me: Person;
}) {
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const { rows: messages } = useLiveRows<Message>(
    "messages",
    `channel_id=eq.${channel.id}`,
    initialMessages,
    {
      channel: `chat:${channel.id}`,
      sort: (a, b) => a.created_at.localeCompare(b.created_at),
    },
  );

  // No `filter`: `message_reactions` has no channel_id to filter on, and RLS
  // already restricts the stream to messages this person may read.
  const { rows: reactions } = useLiveRows<MessageReaction>(
    "message_reactions",
    undefined,
    initialReactions,
    {
      channel: `chat-reactions:${channel.id}`,
      identify: (r) => `${r.message_id}:${r.profile_id}:${r.emoji}`,
    },
  );

  const { others, setActivity } = usePresence(`chat:${channel.id}`, me);

  const [typers, setTypers] = useState<Record<string, number>>({});
  const broadcastTyping = useBroadcast<{ name: string }>(
    `chat:${channel.id}`,
    "typing",
    useCallback((payload: { name: string }, from: string) => {
      if (!from) return;
      setTypers((prev) => ({ ...prev, [from]: Date.now() }));
    }, []),
  );

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const lastTyped = useRef(0);

  // Typing markers expire on a timer rather than on a "stopped" event — a
  // closed tab never sends one, and a stuck "Kailosh is typing…" is worse than
  // a two-second delay.
  useEffect(() => {
    const timer = setInterval(() => {
      setTypers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        let changed = false;
        for (const [id, at] of Object.entries(prev)) {
          if (now - at < 3000) next[id] = at;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Reading a channel moves the read cursor, which clears the badge for the
  // next render and for every other device this person has open.
  useEffect(() => {
    void supabaseBrowser().rpc("mark_channel_read", { p_channel: channel.id });
  }, [channel.id, messages.length]);

  const reactionsFor = useMemo(() => {
    const map = new Map<string, Map<string, string[]>>();
    for (const r of reactions) {
      const forMessage = map.get(r.message_id) ?? new Map<string, string[]>();
      forMessage.set(r.emoji, [...(forMessage.get(r.emoji) ?? []), r.profile_id]);
      map.set(r.message_id, forMessage);
    }
    return map;
  }, [reactions]);

  const typingNames = Object.keys(typers)
    .filter((id) => id !== me.id)
    .map((id) => byId.get(id)?.full_name ?? "Someone");

  async function submit() {
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    // Clear optimistically: the message comes back over the socket in a moment,
    // and a composer that stays full after Enter feels broken.
    setBody("");
    const form = new FormData();
    form.set("channel_id", channel.id);
    form.set("body", text);
    if (replyTo) form.set("reply_to", replyTo.id);
    setReplyTo(null);

    const result = await sendMessage({}, form);
    if (result.error) setBody(text);
    setSending(false);
    setActivity(null);
    input.current?.focus();
  }

  function onType(value: string) {
    setBody(value);
    const now = Date.now();
    if (now - lastTyped.current > 1500) {
      lastTyped.current = now;
      broadcastTyping({ name: me.full_name ?? me.email }, me.id);
    }
  }

  return (
    <div className="flex h-[calc(100svh-190px)] min-h-[420px] flex-col rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-[var(--ws-line)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[13px] font-semibold">
            #{channel.name}
            {!channel.client_visible ? (
              <span className="ml-2 text-[11px] font-normal text-[var(--ws-faint)]">
                internal
              </span>
            ) : null}
          </h2>
          {channel.topic ? (
            <p className="truncate text-[11px] text-[var(--ws-faint)]">{channel.topic}</p>
          ) : null}
        </div>

        {others.length > 0 ? (
          <span className="ws-face-stack">
            {others.slice(0, 4).map((p) => (
              <span key={p.id} className="ws-here" title={p.name}>
                <Avatar name={p.name} email={p.email} src={p.avatar} size={22} />
              </span>
            ))}
          </span>
        ) : null}
      </header>

      {/* messages */}
      <div className="ws-scroll flex-1 overflow-y-auto px-4">
        <div className="ws-chat-scroll py-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-[var(--ws-faint)]">
              No messages yet. Say the first thing.
            </p>
          ) : (
            messages.map((m, i) => {
              const prev = messages[i - 1];
              const grouped =
                prev &&
                prev.author_id === m.author_id &&
                !m.reply_to &&
                new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() <
                  GROUP_WINDOW;

              return (
                <MessageRow
                  key={m.id}
                  message={m}
                  author={m.author_id ? byId.get(m.author_id) : undefined}
                  parent={m.reply_to ? messages.find((x) => x.id === m.reply_to) : undefined}
                  parentAuthor={
                    m.reply_to
                      ? byId.get(
                          messages.find((x) => x.id === m.reply_to)?.author_id ?? "",
                        )
                      : undefined
                  }
                  grouped={Boolean(grouped)}
                  reactions={reactionsFor.get(m.id)}
                  me={me}
                  onReply={() => {
                    setReplyTo(m);
                    input.current?.focus();
                  }}
                />
              );
            })
          )}
          <div ref={bottom} />
        </div>
      </div>

      {/* typing */}
      <div className="h-5 px-4">
        {typingNames.length > 0 ? (
          <p className="truncate text-[11px] text-[var(--ws-faint)]">
            {typingNames.slice(0, 2).join(" and ")}
            {typingNames.length > 2 ? ` and ${typingNames.length - 2} more` : ""}{" "}
            {typingNames.length === 1 ? "is" : "are"} typing…
          </p>
        ) : null}
      </div>

      {/* composer */}
      <div className="border-t border-[var(--ws-line)] p-3">
        {replyTo ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--ws-hover)] px-3 py-1.5">
            <CornerUpLeft size={12} className="shrink-0 text-[var(--ws-faint)]" />
            <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--ws-muted)]">
              Replying to{" "}
              {replyTo.author_id ? (byId.get(replyTo.author_id)?.full_name ?? "someone") : "someone"}
              : {replyTo.body}
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="shrink-0 text-[var(--ws-faint)] hover:text-[var(--ws-text)]"
            >
              <X size={13} />
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <textarea
            ref={input}
            value={body}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder={`Message #${channel.name} — @handle to mention someone`}
            className="max-h-32 min-h-[38px] flex-1 resize-none rounded-lg border border-[var(--ws-line-strong)] bg-[var(--ws-bg)] px-3 py-2 text-[13px] leading-relaxed text-[var(--ws-text)] placeholder:text-[var(--ws-faint)] focus:border-[var(--ws-accent)] focus:outline-none"
          />
          <Button
            variant="primary"
            onClick={() => void submit()}
            disabled={!body.trim() || sending}
            aria-label="Send"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageRow({
  message,
  author,
  parent,
  parentAuthor,
  grouped,
  reactions,
  me,
  onReply,
}: {
  message: Message;
  author?: Person;
  parent?: Message;
  parentAuthor?: Person;
  grouped: boolean;
  reactions?: Map<string, string[]>;
  me: Person;
  onReply: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const mine = message.author_id === me.id;
  const name = author?.full_name ?? author?.email.split("@")[0] ?? "Removed user";

  return (
    <div className={`group relative flex gap-2.5 px-1 ${grouped ? "mt-0.5" : "mt-4"}`}>
      <div className="w-[28px] shrink-0">
        {grouped ? null : (
          <Avatar name={author?.full_name} email={author?.email} src={author?.avatar_url} size={28} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {parent ? (
          <p className="mb-0.5 flex items-center gap-1.5 truncate text-[11px] text-[var(--ws-faint)]">
            <CornerUpLeft size={10} />
            {parentAuthor?.full_name ?? "someone"}: {parent.body}
          </p>
        ) : null}

        {grouped ? null : (
          <p className="mb-0.5 flex items-baseline gap-2">
            <span className="text-[13px] font-semibold">{name}</span>
            <span className="text-[10.5px] text-[var(--ws-faint)]">
              {relativeTime(message.created_at)}
            </span>
          </p>
        )}

        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          <Mentions body={message.body} meHandle={me.handle} />
          {message.edited_at ? (
            <span className="ml-1.5 text-[10.5px] text-[var(--ws-faint)]">(edited)</span>
          ) : null}
        </p>

        {reactions && reactions.size > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {[...reactions.entries()].map(([emoji, who]) => (
              <ReactionPill
                key={emoji}
                messageId={message.id}
                emoji={emoji}
                count={who.length}
                active={who.includes(me.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* hover actions — plain buttons calling the action directly. A <form>
          per emoji would nest forms inside the composer's and submit twice. */}
      <div className="absolute right-1 top-0 hidden items-center gap-0.5 rounded-lg border border-[var(--ws-line)] bg-[var(--ws-raised)] px-1 py-0.5 group-hover:flex">
        {showPicker ? (
          QUICK.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setShowPicker(false);
                void react(message.id, emoji);
              }}
              className="rounded px-1 py-0.5 text-[13px] hover:bg-[var(--ws-hover)]"
            >
              {emoji}
            </button>
          ))
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            aria-label="Add reaction"
            className="rounded p-1 text-[var(--ws-faint)] hover:text-[var(--ws-text)]"
          >
            <SmilePlus size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={onReply}
          aria-label="Reply"
          className="rounded p-1 text-[var(--ws-faint)] hover:text-[var(--ws-text)]"
        >
          <CornerUpLeft size={13} />
        </button>

        {mine ? (
          <button
            type="button"
            aria-label="Delete message"
            onClick={() => {
              const form = new FormData();
              form.set("id", message.id);
              void deleteMessage({}, form);
            }}
            className="rounded p-1 text-[var(--ws-faint)] hover:text-[var(--ws-red)]"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Toggling is server-side: the action adds or removes based on what exists. */
function react(messageId: string, emoji: string) {
  const form = new FormData();
  form.set("message_id", messageId);
  form.set("emoji", emoji);
  return toggleReaction({}, form);
}

function ReactionPill({
  messageId,
  emoji,
  count,
  active,
}: {
  messageId: string;
  emoji: string;
  count: number;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => void react(messageId, emoji)}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors ${
        active
          ? "border-[var(--ws-line-strong)] bg-[var(--ws-accent-soft)] font-semibold"
          : "border-[var(--ws-line)] text-[var(--ws-muted)] hover:bg-[var(--ws-hover)]"
      }`}
    >
      <span>{emoji}</span>
      <span className="mono">{count}</span>
    </button>
  );
}

/** Highlight `@handle`, and highlight your own harder. */
function Mentions({ body, meHandle }: { body: string; meHandle: string }) {
  const parts = body.split(/(@[a-z0-9_]{1,30})/gi);

  return (
    <>
      {parts.map((part, i) => {
        if (!part.startsWith("@")) return part;
        const isMe = part.slice(1).toLowerCase() === meHandle.toLowerCase();
        return (
          <span
            key={i}
            className={
              isMe
                ? "rounded bg-[var(--ws-internal)] px-1 font-semibold text-[var(--ws-text)] ring-1 ring-[var(--ws-internal-line)]"
                : "font-semibold text-[var(--ws-text)]"
            }
          >
            {part}
          </span>
        );
      })}
    </>
  );
}
