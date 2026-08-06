"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { clsx } from "clsx";
import { Eye, EyeOff, Plus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { moveTask, syncGithubRefs } from "@/lib/workspace/actions/tasks";
import type { Task, TaskStatus } from "@/lib/workspace/database.types";
import { Avatar, Badge, Button } from "@/components/workspace/ui/Primitives";
import { QuickForm } from "@/components/workspace/ui/Form";
import Presence from "@/components/workspace/Presence";
import TaskDialog from "./TaskDialog";

const COLUMNS: [TaskStatus, string][] = [
  ["backlog", "Backlog"],
  ["todo", "To do"],
  ["in_progress", "In progress"],
  ["review", "Review"],
  ["done", "Done"],
];

export type Person = { id: string; full_name: string | null; email: string; avatar_url: string | null };

export default function Board({
  projectId,
  githubRepo,
  initialTasks,
  milestones,
  staff,
  me,
}: {
  projectId: string;
  githubRepo: string | null;
  initialTasks: Task[];
  milestones: { id: string; title: string }[];
  staff: Person[];
  me: Person;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [dragging, setDragging] = useState<Task | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null);
  const [live, setLive] = useState(false);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  /* --------------------------- realtime sync --------------------------- */
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const channel = supabaseBrowser()
      .channel(`board:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setTasks((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== (payload.old as Task).id);
            }
            const row = payload.new as Task;
            const index = prev.findIndex((t) => t.id === row.id);
            if (index === -1) return [...prev, row];
            const next = [...prev];
            next[index] = row;
            return next;
          });
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      void supabaseBrowser().removeChannel(channel);
    };
  }, [projectId]);

  /* ---------------------------- shortcuts ------------------------------ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) {
        return;
      }
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCreatingIn("todo");
      }
      if (e.key === "f") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------ dnd ---------------------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        `task-${t.ref}` === q,
    );
  }, [tasks, query]);

  const byColumn = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(COLUMNS.map(([s]) => [s, []]));
    for (const task of visible) map.get(task.status)?.push(task);
    for (const list of map.values()) list.sort((a, b) => a.order_index - b.order_index);
    return map;
  }, [visible]);

  const columnOf = useCallback(
    (id: string): TaskStatus | null => {
      if (COLUMNS.some(([s]) => s === id)) return id as TaskStatus;
      return tasks.find((t) => t.id === id)?.status ?? null;
    },
    [tasks],
  );

  function onDragStart(event: DragStartEvent) {
    setDragging(tasks.find((t) => t.id === event.active.id) ?? null);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (!over) return;

    const taskId = String(active.id);
    const target = columnOf(String(over.id));
    if (!target) return;

    const source = tasks.find((t) => t.id === taskId);
    if (!source) return;

    // Where in the target column did it land?
    const column = (byColumn.get(target) ?? []).filter((t) => t.id !== taskId);
    const overIndex = column.findIndex((t) => t.id === String(over.id));
    const insertAt = overIndex === -1 ? column.length : overIndex;
    const ordered = [...column.slice(0, insertAt), source, ...column.slice(insertAt)];

    if (source.status === target && ordered.findIndex((t) => t.id === taskId) === byColumn.get(target)?.findIndex((t) => t.id === taskId)) {
      return;
    }

    const snapshot = tasks;
    // Optimistic: the card must land under the cursor, not after a round trip.
    setTasks((prev) =>
      prev.map((t) => {
        const index = ordered.findIndex((o) => o.id === t.id);
        if (index === -1) return t;
        return { ...t, status: target, order_index: index };
      }),
    );

    const ok = await moveTask(taskId, target, ordered.map((t) => t.id));
    if (!ok) setTasks(snapshot);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          ref={search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter tasks…  (f)"
          className="w-48 rounded-lg border border-[var(--ws-line-strong)] bg-[var(--ws-bg)] px-3 py-1.5 text-xs placeholder:text-[var(--ws-faint)] focus:border-[var(--ws-accent)] focus:outline-none"
        />

        <Button size="sm" variant="primary" onClick={() => setCreatingIn("todo")}>
          <Plus size={13} /> New task
          <kbd className="mono ml-1 rounded border border-current/30 px-1 text-[10px] opacity-70">
            n
          </kbd>
        </Button>

        {githubRepo ? (
          <QuickForm
            action={syncGithubRefs}
            fields={{ project_id: projectId, repo: githubRepo }}
            variant="outline"
            size="sm"
            pendingLabel="Syncing…"
          >
            Sync #TASK- from commits
          </QuickForm>
        ) : null}

        <span className="ml-auto flex items-center gap-3">
          <Presence room={`board:${projectId}`} me={me} label="on the board" />
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--ws-muted)]">
            <span
              className={clsx("h-1.5 w-1.5 rounded-full", live && "ws-blip")}
              style={{ background: live ? "var(--ws-live)" : "var(--ws-faint)" }}
            />
            {live ? "Live — changes sync instantly" : "Connecting…"}
          </span>
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        {/* Desktop: five columns side by side. Mobile: a stacked list — dragging
            on a phone fights the scroll, so tap-to-edit is the path there. */}
        <div className="ws-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {COLUMNS.map(([status, label]) => (
            <Column
              key={status}
              status={status}
              label={label}
              tasks={byColumn.get(status) ?? []}
              staffById={staffById}
              onOpen={setEditing}
              onAdd={() => setCreatingIn(status)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
          {dragging ? (
            <TaskCard task={dragging} assignee={staffById.get(dragging.assignee_id ?? "")} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="mt-4 text-[11px] text-[var(--ws-faint)]">
        <kbd className="mono rounded border border-[var(--ws-line)] px-1">n</kbd> new
        task · <kbd className="mono rounded border border-[var(--ws-line)] px-1">f</kbd>{" "}
        filter · <kbd className="mono rounded border border-[var(--ws-line)] px-1">⌘K</kbd>{" "}
        search everything
      </p>

      {editing || creatingIn ? (
        <TaskDialog
          projectId={projectId}
          task={editing}
          defaultStatus={creatingIn ?? "todo"}
          milestones={milestones}
          staff={staff}
          onClose={() => {
            setEditing(null);
            setCreatingIn(null);
          }}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Column({
  status,
  label,
  tasks,
  staffById,
  onOpen,
  onAdd,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  staffById: Map<string, Person>;
  onOpen: (task: Task) => void;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-[268px] shrink-0 flex-col sm:w-auto sm:flex-1">
      <div className="mb-2 flex items-center gap-2 px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-muted)]">
          {label}
        </h3>
        <span className="mono text-[11px] text-[var(--ws-faint)]">{tasks.length}</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add task to ${label}`}
          className="ml-auto rounded p-0.5 text-[var(--ws-faint)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]"
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          "flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors",
          isOver
            ? "border-[var(--ws-accent)] bg-[var(--ws-accent-soft)]"
            : "border-[var(--ws-line)] bg-[var(--ws-surface)]",
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <p className="px-2 py-6 text-center text-[11px] text-[var(--ws-faint)]">
              Nothing here
            </p>
          ) : (
            tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                assignee={staffById.get(task.assignee_id ?? "")}
                onOpen={onOpen}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTask({
  task,
  assignee,
  onOpen,
}: {
  task: Task;
  assignee?: Person;
  onOpen: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-30" : undefined}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(task);
      }}
    >
      <TaskCard task={task} assignee={assignee} />
    </div>
  );
}

const PRIORITY_TONE = { high: "red", med: "neutral", low: "neutral" } as const;

function TaskCard({
  task,
  assignee,
  overlay,
}: {
  task: Task;
  assignee?: Person;
  overlay?: boolean;
}) {
  return (
    <article
      className={clsx(
        "cursor-grab rounded-lg border bg-[var(--ws-raised)] p-2.5 active:cursor-grabbing",
        overlay
          ? "border-[var(--ws-accent)] shadow-[var(--ws-shadow)] rotate-2"
          : "border-[var(--ws-line)] hover:border-[var(--ws-line-strong)]",
      )}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-[13px] leading-snug">{task.title}</p>
        {!task.client_visible ? (
          <EyeOff
            size={12}
            className="mt-0.5 shrink-0 text-[var(--ws-amber)]"
            aria-label="Hidden from client"
          />
        ) : (
          <Eye size={12} className="mt-0.5 shrink-0 text-[var(--ws-faint)]" aria-label="Client can see this" />
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="mono text-[10px] text-[var(--ws-faint)]">TASK-{task.ref}</span>
        {task.priority === "high" ? (
          <Badge tone={PRIORITY_TONE[task.priority]}>High</Badge>
        ) : null}
        <span className="ml-auto">
          {assignee ? (
            <Avatar
              name={assignee.full_name}
              email={assignee.email}
              src={assignee.avatar_url}
              size={20}
            />
          ) : null}
        </span>
      </div>
    </article>
  );
}
