"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "./database.types";

/**
 * The workspace's three uses of Realtime, behind three hooks.
 *
 *   useLiveRows  — Postgres CDC. Durable state: a task moves, a shape is
 *                  dragged, a message arrives. Replicated by the database, so
 *                  RLS applies and a late joiner still sees it.
 *   usePresence  — who is on this surface right now. Ephemeral, socket-scoped,
 *                  never touches a table.
 *   useBroadcast — cursors and typing. Fires many times a second and is
 *                  worthless a moment later, so it must NOT be a write.
 *
 * All three share the one browser client, which is a singleton — so a page
 * showing a board, its chat and its presence opens one WebSocket, not three.
 */

/**
 * Keep a list in sync with a table. `initial` is the server-rendered snapshot;
 * every insert/update/delete matching `filter` is folded in as it happens.
 *
 * `initial` must be referentially stable — a server-component prop, or a
 * `useMemo`. An array literal built during render re-triggers the reset effect
 * on every render and spins.
 *
 * Ordering is the caller's business — pass `sort` and it is reapplied after
 * each change, because Postgres CDC arrives in commit order, not query order.
 *
 * `identify` exists for tables whose primary key is composite. A DELETE payload
 * carries only the replica identity — for `message_reactions` that is
 * (message_id, profile_id, emoji) and no `id` at all — so those callers must
 * say how to recognise a row.
 */
export function useLiveRows<T>(
  table: string,
  filter: string | undefined,
  initial: T[],
  options: {
    channel?: string;
    sort?: (a: T, b: T) => number;
    identify?: (row: T) => string;
  } = {},
) {
  const [rows, setRows] = useState<T[]>(initial);
  const [live, setLive] = useState(false);
  const sortRef = useRef(options.sort);
  sortRef.current = options.sort;
  const idRef = useRef(options.identify);
  idRef.current = options.identify;

  // A fresh server render (revalidatePath after a mutation) wins over whatever
  // the socket has folded in — it is the authoritative, RLS-filtered truth.
  useEffect(() => setRows(initial), [initial]);

  const key = options.channel ?? `${table}:${filter ?? "all"}`;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const client = supabaseBrowser();
    const channel = client
      .channel(key)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        (payload) => {
          const idOf =
            idRef.current ?? ((r: T) => String((r as { id?: unknown }).id ?? ""));

          setRows((prev) => {
            let next: T[];
            if (payload.eventType === "DELETE") {
              const gone = idOf(payload.old as T);
              next = prev.filter((r) => idOf(r) !== gone);
            } else {
              const row = payload.new as T;
              const key = idOf(row);
              const i = prev.findIndex((r) => idOf(r) === key);
              if (i === -1) next = [...prev, row];
              else {
                next = [...prev];
                next[i] = row;
              }
            }
            return sortRef.current ? [...next].sort(sortRef.current) : next;
          });
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      void client.removeChannel(channel);
    };
  }, [key, table, filter]);

  return { rows, setRows, live };
}

export type Peer = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  /** Free-text "what they're doing" — "typing", "editing", a shape id. */
  at: string | null;
  joinedAt: number;
};

type PresenceState = Omit<Peer, "joinedAt"> & { joinedAt: number };

/**
 * Who else is on this surface. `room` is any stable string — `doc:<id>`,
 * `board:<id>`, `chat:<id>`. Everyone in the same room sees everyone else.
 *
 * Presence is socket state, not table state: when a tab closes the server drops
 * the entry and the other clients get a `leave` within seconds. Nothing to
 * clean up, nothing to garbage-collect, no stale "online" rows after a crash.
 */
export function usePresence(room: string, me: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const meKey = me.id;

  useEffect(() => {
    if (!isSupabaseConfigured || !room) return;

    const client = supabaseBrowser();
    const channel = client.channel(`presence:${room}`, {
      config: { presence: { key: meKey } },
    });
    channelRef.current = channel;

    const sync = () => {
      const state = channel.presenceState<PresenceState>();
      const list: Peer[] = [];
      for (const [id, entries] of Object.entries(state)) {
        // One person, many tabs — take the earliest entry so the badge doesn't
        // count the same human twice.
        const first = entries[0];
        if (!first) continue;
        list.push({
          id,
          name: first.name,
          email: first.email,
          avatar: first.avatar,
          at: first.at,
          joinedAt: first.joinedAt,
        });
      }
      list.sort((a, b) => a.joinedAt - b.joinedAt);
      setPeers(list);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({
          name: me.full_name ?? me.email.split("@")[0],
          email: me.email,
          avatar: me.avatar_url,
          at: null,
          joinedAt: Date.now(),
        });
      });

    return () => {
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [room, meKey, me.full_name, me.email, me.avatar_url]);

  /** Update what you're shown as doing, without re-subscribing. */
  const setActivity = useCallback(
    (at: string | null) => {
      const channel = channelRef.current;
      if (!channel) return;
      void channel.track({
        name: me.full_name ?? me.email.split("@")[0],
        email: me.email,
        avatar: me.avatar_url,
        at,
        joinedAt: Date.now(),
      });
    },
    [me.full_name, me.email, me.avatar_url],
  );

  /** Everyone except you — the only list a "who else is here" badge wants. */
  const others = useMemo(() => peers.filter((p) => p.id !== meKey), [peers, meKey]);

  return { peers, others, setActivity };
}

/**
 * Ephemeral fan-out on the same socket. Cursor positions at 60fps must never
 * become INSERTs — this is the escape hatch that keeps them off the database.
 *
 * `onMessage` is held in a ref, so passing an inline arrow does not tear down
 * and rebuild the subscription on every render.
 */
export function useBroadcast<T>(
  room: string,
  event: string,
  onMessage: (payload: T, from: string) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    if (!isSupabaseConfigured || !room) return;

    const client = supabaseBrowser();
    const channel = client.channel(`broadcast:${room}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event }, ({ payload }) => {
        handler.current(payload?.data as T, String(payload?.from ?? ""));
      })
      .subscribe();

    return () => {
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [room, event]);

  return useCallback(
    (data: T, from: string) => {
      void channelRef.current?.send({
        type: "broadcast",
        event,
        payload: { data, from },
      });
    },
    [event],
  );
}

/**
 * Heartbeat so "last seen" survives a closed socket. Every five minutes while
 * the tab is visible — cheap enough to ignore, useful when someone wants to
 * know whether a teammate has been near the workspace today at all.
 */
export function usePresenceHeartbeat() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      void supabaseBrowser().rpc("touch_presence");
    };

    beat();
    const timer = setInterval(beat, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);
}
