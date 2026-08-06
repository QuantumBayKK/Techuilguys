"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Graph, GraphNode, NodeKind } from "@/lib/workspace/database.types";

/**
 * The knowledge graph.
 *
 * Laid out with a small force simulation run to convergence ONCE on mount,
 * then frozen. A permanently animating graph is a toy — you cannot read labels
 * that drift, and the layout is not information. Dragging a node re-settles
 * only its neighbours.
 *
 * Kinds are distinguished by SHAPE and size, not colour: a project is a large
 * ring, a task a small dot, a document a square. Nine hues would undo the whole
 * palette, and shape survives greyscale, colour-blindness and a projector.
 */

const KIND_ORDER: NodeKind[] = [
  "project",
  "milestone",
  "task",
  "document",
  "meeting",
  "board",
  "file",
  "channel",
  "person",
];

const RADIUS: Record<NodeKind, number> = {
  project: 13,
  milestone: 9,
  task: 5,
  document: 7,
  meeting: 7,
  board: 7,
  file: 5,
  channel: 6,
  person: 8,
};

type Sim = GraphNode & { x: number; y: number; vx: number; vy: number };

export default function GraphView({
  graph,
  width = 900,
  height = 560,
}: {
  graph: Graph;
  width?: number;
  height?: number;
}) {
  const [hidden, setHidden] = useState<Set<NodeKind>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const visible = useMemo(() => {
    const nodes = graph.nodes.filter((n) => !hidden.has(n.kind));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges };
  }, [graph, hidden]);

  const [placed, setPlaced] = useState<Sim[]>([]);

  useEffect(() => {
    if (visible.nodes.length === 0) {
      setPlaced([]);
      return;
    }

    // Seed on a circle rather than at random: the same graph lays out the same
    // way every visit, so the picture in your head stays valid.
    const n = visible.nodes.length;
    const nodes: Sim[] = visible.nodes.map((node, i) => ({
      ...node,
      x: width / 2 + Math.cos((i / n) * Math.PI * 2) * Math.min(width, height) * 0.34,
      y: height / 2 + Math.sin((i / n) * Math.PI * 2) * Math.min(width, height) * 0.34,
      vx: 0,
      vy: 0,
    }));

    const index = new Map(nodes.map((node, i) => [node.id, i]));
    const links = visible.edges
      .map((e) => [index.get(e.source), index.get(e.target)] as [number?, number?])
      .filter((pair): pair is [number, number] => pair[0] !== undefined && pair[1] !== undefined);

    // Barnes-Hut would be the grown-up answer; at a few hundred nodes the
    // O(n²) pass is a couple of milliseconds and needs no dependency.
    for (let step = 0; step < 320; step += 1) {
      const cooling = 1 - step / 320;

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const push = Math.min(2600 / (dist * dist), 12);
          const ux = (dx / dist) * push;
          const uy = (dy / dist) * push;
          nodes[i].vx -= ux;
          nodes[i].vy -= uy;
          nodes[j].vx += ux;
          nodes[j].vy += uy;
        }
      }

      for (const [a, b] of links) {
        const dx = nodes[b].x - nodes[a].x;
        const dy = nodes[b].y - nodes[a].y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const pull = (dist - 92) * 0.014;
        const ux = (dx / dist) * pull;
        const uy = (dy / dist) * pull;
        nodes[a].vx += ux;
        nodes[a].vy += uy;
        nodes[b].vx -= ux;
        nodes[b].vy -= uy;
      }

      for (const node of nodes) {
        node.vx += (width / 2 - node.x) * 0.0016;
        node.vy += (height / 2 - node.y) * 0.0016;
        node.x += node.vx * cooling;
        node.y += node.vy * cooling;
        node.vx *= 0.82;
        node.vy *= 0.82;
        node.x = Math.max(24, Math.min(width - 24, node.x));
        node.y = Math.max(24, Math.min(height - 24, node.y));
      }
    }

    setPlaced(nodes);
  }, [visible, width, height]);

  const byId = useMemo(() => new Map(placed.map((n) => [n.id, n])), [placed]);

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const e of visible.edges) {
      if (e.source === focus) set.add(e.target);
      if (e.target === focus) set.add(e.source);
    }
    return set;
  }, [focus, visible.edges]);

  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    setPlaced((prev) => prev.map((n) => (n.id === drag ? { ...n, x, y } : n)));
  }

  const counts = useMemo(() => {
    const map = new Map<NodeKind, number>();
    for (const n of graph.nodes) map.set(n.kind, (map.get(n.kind) ?? 0) + 1);
    return map;
  }, [graph.nodes]);

  return (
    <div>
      {/* legend doubles as the filter */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {KIND_ORDER.filter((k) => counts.get(k)).map((kind) => {
          const off = hidden.has(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={!off}
              onClick={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(kind)) next.delete(kind);
                  else next.add(kind);
                  return next;
                })
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                off
                  ? "border-[var(--ws-line)] text-[var(--ws-faint)]"
                  : "border-[var(--ws-line-strong)] text-[var(--ws-text)]"
              }`}
            >
              <Glyph kind={kind} />
              <span className="capitalize">{kind}</span>
              <span className="mono text-[var(--ws-faint)]">{counts.get(kind)}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]">
        <svg
          ref={svg}
          viewBox={`0 0 ${width} ${height}`}
          className="h-[min(64svh,560px)] w-full touch-none"
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
          role="img"
          aria-label={`Knowledge graph: ${visible.nodes.length} nodes, ${visible.edges.length} connections`}
        >
          <g>
            {visible.edges.map((e, i) => {
              const a = byId.get(e.source);
              const b = byId.get(e.target);
              if (!a || !b) return null;
              const dim = neighbours && !(neighbours.has(e.source) && neighbours.has(e.target));

              return (
                <line
                  key={`${e.source}-${e.target}-${e.rel}-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--ws-line-strong)"
                  strokeWidth={dim ? 0.6 : 1}
                  opacity={dim ? 0.25 : 0.85}
                />
              );
            })}
          </g>

          <g>
            {placed.map((node) => {
              const dim = neighbours && !neighbours.has(node.id);
              const r = RADIUS[node.kind];

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  opacity={dim ? 0.28 : 1}
                  onPointerDown={() => setDrag(node.id)}
                  onMouseEnter={() => setFocus(node.id)}
                  onMouseLeave={() => setFocus(null)}
                  style={{ cursor: "pointer" }}
                >
                  <NodeGlyph kind={node.kind} r={r} />
                  <text
                    x={0}
                    y={r + 12}
                    textAnchor="middle"
                    className="pointer-events-none"
                    style={{
                      fill: "var(--ws-muted)",
                      fontSize: node.kind === "project" ? 12 : 10,
                      fontWeight: node.kind === "project" ? 600 : 400,
                    }}
                  >
                    {node.label.length > 26 ? `${node.label.slice(0, 24)}…` : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {focus && byId.get(focus) ? (
        <FocusCard node={byId.get(focus)!} />
      ) : (
        <p className="mt-3 text-[12px] text-[var(--ws-faint)]">
          Hover a node to isolate what it touches. Drag to rearrange — the layout
          is deterministic, so it looks the same next visit.
        </p>
      )}
    </div>
  );
}

function FocusCard({ node }: { node: GraphNode }) {
  return (
    <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[var(--ws-line)] bg-[var(--ws-surface)] px-3.5 py-2.5">
      <Glyph kind={node.kind} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
        {node.label}
      </span>
      <span className="text-[11px] capitalize text-[var(--ws-faint)]">{node.kind}</span>
      <Link
        href={node.href}
        className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ws-text)] underline underline-offset-2"
      >
        Open
      </Link>
    </div>
  );
}

/** SVG marks. Shape carries the kind; fill only says hollow or solid. */
function NodeGlyph({ kind, r }: { kind: NodeKind; r: number }) {
  const stroke = "var(--ws-text)";
  const fill = "var(--ws-surface)";

  if (kind === "project") {
    return <circle r={r} fill={fill} stroke={stroke} strokeWidth={2.5} />;
  }
  if (kind === "milestone") {
    return (
      <rect
        x={-r}
        y={-r}
        width={r * 2}
        height={r * 2}
        transform="rotate(45)"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  }
  if (kind === "document" || kind === "file") {
    return (
      <rect
        x={-r}
        y={-r}
        width={r * 2}
        height={r * 2}
        rx={1.5}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  }
  if (kind === "meeting" || kind === "channel") {
    return (
      <polygon
        points={`0,${-r} ${r},${r * 0.6} ${-r},${r * 0.6}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  }
  if (kind === "board") {
    return (
      <rect
        x={-r * 1.2}
        y={-r * 0.8}
        width={r * 2.4}
        height={r * 1.6}
        rx={2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  }
  // task, person
  return <circle r={r} fill={stroke} />;
}

/** The same vocabulary at legend size, in HTML. */
function Glyph({ kind }: { kind: NodeKind }) {
  return (
    <svg width="12" height="12" viewBox="-8 -8 16 16" aria-hidden>
      <NodeGlyph kind={kind} r={kind === "task" || kind === "file" ? 3.5 : 5.5} />
    </svg>
  );
}
