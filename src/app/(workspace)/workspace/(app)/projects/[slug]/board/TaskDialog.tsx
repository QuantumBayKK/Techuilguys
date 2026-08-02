"use client";

import { createTask, deleteTask, updateTask } from "@/lib/workspace/actions/tasks";
import { ActionForm, QuickForm, SubmitButton } from "@/components/workspace/ui/Form";
import Modal from "@/components/workspace/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/workspace/ui/Primitives";
import type { Task, TaskStatus } from "@/lib/workspace/database.types";
import type { Person } from "./Board";

const STATUSES: [TaskStatus, string][] = [
  ["backlog", "Backlog"],
  ["todo", "To do"],
  ["in_progress", "In progress"],
  ["review", "Review"],
  ["done", "Done"],
];

export default function TaskDialog({
  projectId,
  task,
  defaultStatus,
  milestones,
  staff,
  onClose,
}: {
  projectId: string;
  task: Task | null;
  defaultStatus: TaskStatus;
  milestones: { id: string; title: string }[];
  staff: Person[];
  onClose: () => void;
}) {
  const editing = Boolean(task);

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `TASK-${task!.ref}` : "New task"}
      description={editing ? "Changes sync to everyone on the board instantly." : undefined}
    >
      <ActionForm
        action={editing ? updateTask : createTask}
        className="space-y-4"
        onDone={onClose}
      >
        <input type="hidden" name="project_id" value={projectId} />
        {editing ? <input type="hidden" name="id" value={task!.id} /> : null}

        <Field label="Title">
          <Input name="title" required autoFocus defaultValue={task?.title ?? ""} />
        </Field>

        <Field label="Description">
          <Textarea name="description" rows={4} defaultValue={task?.description ?? ""} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select name="status" defaultValue={task?.status ?? defaultStatus}>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue={task?.priority ?? "med"}>
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assignee">
            <Select name="assignee_id" defaultValue={task?.assignee_id ?? ""}>
              <option value="">Unassigned</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name ?? person.email}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Milestone">
            <Select name="milestone_id" defaultValue={task?.milestone_id ?? ""}>
              <option value="">None</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Due date">
          <Input type="date" name="due_date" defaultValue={task?.due_date ?? ""} />
        </Field>

        {/* The one toggle that keeps the client's board meaningful. */}
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--ws-line)] p-3">
          <input
            type="checkbox"
            name="client_visible"
            defaultChecked={task ? task.client_visible : true}
            className="mt-0.5 h-3.5 w-3.5 accent-[var(--ws-accent)]"
          />
          <span>
            <span className="block text-[13px] font-semibold">Visible to the client</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ws-muted)]">
              Turn off for internal chores — refactors, chasing invoices, anything
              that would make their board noisier rather than clearer.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-2 pt-1">
          <SubmitButton pendingLabel="Saving…">
            {editing ? "Save task" : "Create task"}
          </SubmitButton>
          {editing ? (
            <span className="ml-auto">
              <QuickForm
                action={deleteTask}
                fields={{ id: task!.id }}
                variant="danger"
                size="sm"
                confirm="Delete this task permanently?"
                pendingLabel="Deleting…"
              >
                Delete
              </QuickForm>
            </span>
          ) : null}
        </div>
      </ActionForm>
    </Modal>
  );
}
