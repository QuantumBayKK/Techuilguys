"use client";

import { useState } from "react";
import {
  createMilestone,
  deleteMilestone,
  setMilestoneStatus,
  updateMilestone,
} from "@/lib/workspace/actions/projects";
import { ActionForm, QuickForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Field, Input, Select, Textarea } from "@/components/workspace/ui/Primitives";
import type { Milestone, MilestoneStatus } from "@/lib/workspace/database.types";

const STATUSES: [MilestoneStatus, string][] = [
  ["pending", "Pending"],
  ["in_progress", "In progress"],
  ["done", "Done — send for approval"],
];

/**
 * Doubles as the create form (no milestone) and the per-row editor. `approved`
 * is deliberately absent from the status list: only the client can set it, via
 * the RPC.
 */
export default function MilestoneEditor({
  projectId,
  milestone,
}: {
  projectId?: string;
  milestone?: Milestone;
}) {
  const [editing, setEditing] = useState(false);

  if (!milestone) {
    return (
      <ActionForm action={createMilestone} className="space-y-3" resetOnSuccess>
        <input type="hidden" name="project_id" value={projectId} />
        <Field label="Title">
          <Input name="title" required placeholder="Discovery sign-off" />
        </Field>
        <Field label="Description">
          <Textarea name="description" rows={2} placeholder="What 'done' means here." />
        </Field>
        <Field label="Due date">
          <Input type="date" name="due_date" />
        </Field>
        <SubmitButton size="sm" className="w-full">
          Add milestone
        </SubmitButton>
      </ActionForm>
    );
  }

  if (editing) {
    return (
      <ActionForm action={updateMilestone} className="space-y-3" onDone={() => setEditing(false)}>
        <input type="hidden" name="id" value={milestone.id} />
        <input type="hidden" name="order_index" value={milestone.order_index} />

        <Field label="Title">
          <Input name="title" required defaultValue={milestone.title} />
        </Field>
        <Field label="Description">
          <Textarea name="description" rows={2} defaultValue={milestone.description ?? ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <Select name="status" defaultValue={milestone.status}>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
              {milestone.status === "approved" ? (
                <option value="approved">Approved by client</option>
              ) : null}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" name="due_date" defaultValue={milestone.due_date ?? ""} />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <SubmitButton size="sm">Save</SubmitButton>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </ActionForm>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {milestone.status !== "approved" ? (
        <>
          {milestone.status !== "in_progress" && milestone.status !== "done" ? (
            <QuickForm
              action={setMilestoneStatus}
              fields={{ id: milestone.id, status: "in_progress" }}
              size="sm"
            >
              Start
            </QuickForm>
          ) : null}
          {milestone.status !== "done" ? (
            <QuickForm
              action={setMilestoneStatus}
              fields={{ id: milestone.id, status: "done" }}
              variant="primary"
              size="sm"
            >
              Mark done
            </QuickForm>
          ) : (
            <QuickForm
              action={setMilestoneStatus}
              fields={{ id: milestone.id, status: "in_progress" }}
              size="sm"
            >
              Reopen
            </QuickForm>
          )}
        </>
      ) : null}

      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
        Edit
      </Button>

      <QuickForm
        action={deleteMilestone}
        fields={{ id: milestone.id }}
        variant="ghost"
        size="sm"
        confirm="Delete this milestone? Progress recalculates immediately."
        className="text-[var(--ws-faint)]"
      >
        Delete
      </QuickForm>
    </div>
  );
}
