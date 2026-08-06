"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Circle,
  MousePointer2,
  Pen,
  Square,
  StickyNote,
  Trash2,
  Type,
} from "lucide-react";
import { useBroadcast, useLiveRows, usePresence } from "@/lib/workspace/realtime";
import { Avatar, Button } from "@/components/workspace/ui/Primitives";
import { addShape, deleteShape, updateShape } from "@/lib/workspace/actions/boards";
import type { Board, Profile, Shape, ShapeKind } from "@/lib/workspace/database.types";

type Tool = "select" | ShapeKind;

/**
 * Six neutral tones. Not a colour picker — a small fixed set that reads as one
 * palette on both themes, so a board full of notes still looks composed.
 * Stored as an index so re-theming never orphans old shapes.
 */
const TONES = [
  "var(--ws-raised)",
  "color-mix(in oklab, var(--ws-text) 8%, var(--ws-raised))",
  "color-mix(in oklab, var(--ws-amber) 16%, var(--ws-raised))",
  "color-mix(in oklab, var(--ws-green) 14%, var(--ws-raised))",
  "color-mix(in oklab, var(--ws-red) 13%, var(--ws-raised))",
  "color-mix(in oklab, var(--ws-live) 14%, var(--ws-raised))",
];

const TOOLS: { tool: Tool; icon: typeof Square; label: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select" },
  { tool: "note", icon: StickyNote, label: "Sticky note" },
  { tool: "rect", icon: Square, label: "Rectangle" },
  { tool: "ellipse", icon: Circle, label: "Ellipse" },
  { tool: "arrow", icon: ArrowUpRight, label: "Arrow" },
  { tool: "text", icon: Type, label: "Text" },
  { tool: "path", icon: Pen, label: "Pen" },
];

type Cursor = { x: number; y: number; name: string; at: number };

export default function Canvas({
  board,
  initialShapes,
  me,
  canEdit,
}: {
  board: Board;
  initialShapes: Shape[];
  me: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
  canEdit: boolean;
}) {
  const { rows: shapes, setRows: setShapes } = useLiveRows<Shape>(
    "board_shapes",
    `board_id=eq.${board.id}`,
    initialShapes,
    { channel: `board:${board.id}`, sort: (a, b) => a.z - b.z },
  );

  const { others } = usePresence(`board:${board.id}`, me);
  const [tool, setTool] = useState<Tool>("select");
  const [tone, setTone] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<[number, number][] | null>(null);

  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const lastCursorSend = useRef(0);

  /* ------------------------------- cursors ------------------------------- */
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});

  const sendCursor = useBroadcast<{ x: number; y: number; name: string }>(
    `board:${board.id}`,
    "cursor",
    useCallback((payload: { x: number; y: number; name: string }, from: string) => {
      if (!from || !payload) return;
      setCursors((prev) => ({
        ...prev,
        [from]: { x: payload.x, y: payload.y, name: payload.name, at: Date.now() },
      }));
    }, []),
  );

  // A pointer that stops moving is a pointer that left. Expire rather than
  // rely on a "leave" message that a closed tab will never send.
  useEffect(() => {
    const timer = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        const next: Record<string, Cursor> = {};
        let changed = false;
        for (const [id, c] of Object.entries(prev)) {
          if (now - c.at < 6000) next[id] = c;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const topZ = useMemo(
    () => shapes.reduce((max, s) => Math.max(max, s.z), 0),
    [shapes],
  );

  const point = useCallback((e: React.PointerEvent) => {
    const rect = surface.current?.getBoundingClientRect();
    return {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
  }, []);

  /* -------------------------------- writes ------------------------------- */

  async function create(kind: ShapeKind, x: number, y: number, points?: [number, number][]) {
    const form = new FormData();
    form.set("board_id", board.id);
    form.set("kind", kind);
    form.set("x", String(Math.round(x)));
    form.set("y", String(Math.round(y)));
    form.set("w", String(kind === "text" ? 220 : kind === "note" ? 172 : 200));
    form.set("h", String(kind === "text" ? 40 : kind === "note" ? 132 : 130));
    form.set("tone", String(tone));
    form.set("z", String(topZ + 1));
    if (points) form.set("points", JSON.stringify(points));
    await addShape({}, form);
    setTool("select");
  }

  async function persist(id: string, patch: Record<string, number | string>) {
    const form = new FormData();
    form.set("id", id);
    for (const [k, v] of Object.entries(patch)) form.set(k, String(v));
    await updateShape({}, form);
  }

  async function remove(id: string) {
    // Drop it locally first — waiting for the CDC round trip makes delete feel
    // laggy, and the socket echo is idempotent against an already-gone row.
    setShapes((prev) => prev.filter((s) => s.id !== id));
    setSelected(null);
    const form = new FormData();
    form.set("id", id);
    await deleteShape({}, form);
  }

  /* ------------------------------- pointer -------------------------------- */

  function onPointerDown(e: React.PointerEvent) {
    if (!canEdit) return;
    if (e.target !== e.currentTarget) return; // clicked a shape, not the field

    const { x, y } = point(e);
    setSelected(null);
    setEditing(null);

    if (tool === "select") return;
    if (tool === "path" || tool === "arrow") {
      setDrawing([[x, y]]);
      return;
    }
    void create(tool, x - 80, y - 50);
  }

  function onPointerMove(e: React.PointerEvent) {
    const { x, y } = point(e);

    // Throttle to ~20/s. Broadcast is cheap but not free, and the CSS
    // transition on `.ws-cursor` smooths the gaps anyway.
    const now = Date.now();
    if (now - lastCursorSend.current > 50) {
      lastCursorSend.current = now;
      sendCursor({ x, y, name: me.full_name ?? me.email.split("@")[0] }, me.id);
    }

    if (drawing) {
      setDrawing((prev) => (prev ? [...prev, [x, y]] : prev));
      return;
    }

    const d = drag.current;
    if (!d) return;
    setShapes((prev) =>
      prev.map((s) => (s.id === d.id ? { ...s, x: x - d.dx, y: y - d.dy } : s)),
    );
  }

  function onPointerUp() {
    if (drawing && drawing.length > 1) {
      const xs = drawing.map((p) => p[0]);
      const ys = drawing.map((p) => p[1]);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      // Points are stored relative to the shape's own origin, so moving the
      // stroke later is a two-number update instead of rewriting every point.
      void create(
        tool === "arrow" ? "arrow" : "path",
        minX,
        minY,
        tool === "arrow"
          ? [
              [0, 0],
              [drawing[drawing.length - 1][0] - minX, drawing[drawing.length - 1][1] - minY],
            ]
          : drawing.map(([px, py]) => [px - minX, py - minY] as [number, number]),
      );
      setDrawing(null);
      return;
    }
    setDrawing(null);

    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const moved = shapes.find((s) => s.id === d.id);
    if (moved) void persist(d.id, { x: Math.round(moved.x), y: Math.round(moved.y) });
  }

  /* ------------------------------ shortcuts ------------------------------- */
  useEffect(() => {
    if (!canEdit) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === "TEXTAREA" || el?.tagName === "INPUT" || el?.isContentEditable) {
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        e.preventDefault();
        void remove(selected);
      }
      if (e.key === "Escape") {
        setSelected(null);
        setEditing(null);
        setTool("select");
      }
      const index = Number(e.key);
      if (index >= 1 && index <= TOOLS.length) setTool(TOOLS[index - 1].tool);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `remove` is stable enough here
  }, [selected, canEdit]);

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {canEdit ? (
          <>
            <div className="flex items-center gap-0.5 rounded-lg border border-[var(--ws-line)] bg-[var(--ws-surface)] p-1">
              {TOOLS.map(({ tool: t, icon: Icon, label }, i) => (
                <button
                  key={t}
                  type="button"
                  title={`${label} (${i + 1})`}
                  aria-label={label}
                  aria-pressed={tool === t}
                  onClick={() => setTool(t)}
                  className={`rounded-md p-1.5 transition-colors ${
                    tool === t
                      ? "bg-[var(--ws-accent)] text-[var(--ws-accent-ink)]"
                      : "text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]"
                  }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[var(--ws-line)] bg-[var(--ws-surface)] p-1">
              {TONES.map((swatch, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Tone ${i + 1}`}
                  aria-pressed={tone === i}
                  onClick={() => {
                    setTone(i);
                    if (selected) void persist(selected, { tone: i });
                  }}
                  className="h-5 w-5 rounded-full border transition-transform"
                  style={{
                    background: swatch,
                    borderColor:
                      tone === i ? "var(--ws-text)" : "var(--ws-line-strong)",
                    transform: tone === i ? "scale(1.12)" : undefined,
                  }}
                />
              ))}
            </div>

            {selected ? (
              <Button size="sm" variant="ghost" onClick={() => void remove(selected)}>
                <Trash2 size={13} /> Delete
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-[12px] text-[var(--ws-faint)]">
            Read-only — you can watch this board but not change it.
          </p>
        )}

        {others.length > 0 ? (
          <span className="ml-auto ws-face-stack">
            {others.slice(0, 5).map((p) => (
              <span key={p.id} className="ws-here" title={p.name}>
                <Avatar name={p.name} email={p.email} src={p.avatar} size={24} />
              </span>
            ))}
          </span>
        ) : null}
      </div>

      {/* surface */}
      <div
        ref={surface}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="ws-board-field relative h-[calc(100svh-240px)] min-h-[440px] touch-none overflow-hidden rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]"
        style={{ cursor: tool === "select" ? "default" : "crosshair" }}
      >
        {shapes.map((shape) => (
          <ShapeNode
            key={shape.id}
            shape={shape}
            selected={selected === shape.id}
            editing={editing === shape.id}
            canEdit={canEdit}
            onSelect={() => canEdit && setSelected(shape.id)}
            onEdit={() => canEdit && setEditing(shape.id)}
            onCommit={(text) => {
              setEditing(null);
              if (text !== shape.text) void persist(shape.id, { text });
            }}
            onDragStart={(e) => {
              if (!canEdit) return;
              const { x, y } = point(e);
              drag.current = { id: shape.id, dx: x - shape.x, dy: y - shape.y };
              setSelected(shape.id);
            }}
          />
        ))}

        {/* in-flight pen stroke */}
        {drawing && drawing.length > 1 ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <polyline
              points={
                tool === "arrow"
                  ? `${drawing[0][0]},${drawing[0][1]} ${drawing[drawing.length - 1][0]},${drawing[drawing.length - 1][1]}`
                  : drawing.map(([x, y]) => `${x},${y}`).join(" ")
              }
              fill="none"
              stroke="var(--ws-text)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}

        {/* remote cursors */}
        {Object.entries(cursors).map(([id, c]) => (
          <div
            key={id}
            className="ws-cursor"
            style={{ ["--x" as string]: `${c.x}px`, ["--y" as string]: `${c.y}px` }}
          >
            <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden>
              <path
                d="M1 1l11 7-5 1.2L4.5 15 1 1z"
                fill="var(--ws-text)"
                stroke="var(--ws-bg)"
                strokeWidth="1.2"
              />
            </svg>
            <span className="mt-0.5 inline-block whitespace-nowrap rounded bg-[var(--ws-text)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ws-bg)]">
              {c.name}
            </span>
          </div>
        ))}

        {shapes.length === 0 && !drawing ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-[var(--ws-faint)]">
            {canEdit
              ? "Pick a tool and click the board. Keys 1–7 switch tools."
              : "Nothing on this board yet."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ShapeNode({
  shape,
  selected,
  editing,
  canEdit,
  onSelect,
  onEdit,
  onCommit,
  onDragStart,
}: {
  shape: Shape;
  selected: boolean;
  editing: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onCommit: (text: string) => void;
  onDragStart: (e: React.PointerEvent) => void;
}) {
  const ring = selected ? "0 0 0 2px var(--ws-text)" : undefined;

  if (shape.kind === "path" || shape.kind === "arrow") {
    const points = shape.points ?? [];
    if (points.length < 2) return null;
    const w = Math.max(...points.map((p) => p[0])) + 4;
    const h = Math.max(...points.map((p) => p[1])) + 4;

    return (
      <svg
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
        onClick={onSelect}
        className="absolute"
        style={{
          left: shape.x,
          top: shape.y,
          width: w,
          height: h,
          overflow: "visible",
          cursor: canEdit ? "move" : "default",
          filter: selected ? "drop-shadow(0 0 0 var(--ws-text))" : undefined,
        }}
      >
        {shape.kind === "arrow" ? (
          <defs>
            <marker
              id={`head-${shape.id}`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--ws-text)" />
            </marker>
          </defs>
        ) : null}
        <polyline
          points={points.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="var(--ws-text)"
          strokeWidth={selected ? 3 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={shape.kind === "arrow" ? `url(#head-${shape.id})` : undefined}
        />
      </svg>
    );
  }

  const isText = shape.kind === "text";

  return (
    <div
      onPointerDown={(e) => {
        if (editing) return;
        e.stopPropagation();
        onDragStart(e);
      }}
      onClick={onSelect}
      onDoubleClick={onEdit}
      className="absolute flex p-2.5"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: shape.h,
        cursor: canEdit ? "move" : "default",
        borderRadius: shape.kind === "ellipse" ? "50%" : isText ? 0 : 10,
        background: isText ? "transparent" : TONES[shape.tone] ?? TONES[0],
        border: isText ? "none" : "1px solid var(--ws-line-strong)",
        boxShadow: ring,
      }}
    >
      {editing ? (
        <textarea
          autoFocus
          defaultValue={shape.text}
          onBlur={(e) => onCommit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          className="h-full w-full resize-none bg-transparent text-[13px] leading-snug text-[var(--ws-text)] focus:outline-none"
        />
      ) : (
        <p
          className={`h-full w-full overflow-hidden whitespace-pre-wrap break-words leading-snug ${
            isText ? "text-[15px] font-medium" : "text-[13px]"
          } ${shape.text ? "" : "text-[var(--ws-faint)]"}`}
        >
          {shape.text || (canEdit ? "Double-click to write" : "")}
        </p>
      )}
    </div>
  );
}
