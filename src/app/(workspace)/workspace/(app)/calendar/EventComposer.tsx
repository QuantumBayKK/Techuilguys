"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/workspace/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/workspace/ui/Primitives";
import { saveEvent } from "@/lib/workspace/actions/calendar";

const KINDS = ["session", "deadline", "review", "launch", "holiday", "other"] as const;

export default function EventComposer({
  projects,
  defaultDate,
}: {
  projects: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [allDay, setAllDay] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Entry
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New calendar entry"
        description="Meetings and milestones already appear here — this is for everything else."
      >
        <ActionForm action={saveEvent} onDone={() => setOpen(false)}>
          <div className="space-y-3.5">
            <Field label="Title">
              <Input name="title" required placeholder="Design review with Aditi" />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Kind">
                <Select name="kind" defaultValue="session">
                  {KINDS.map((k) => (
                    <option key={k} value={k} className="capitalize">
                      {k}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Project" hint="Optional">
                <Select name="project_id" defaultValue="">
                  <option value="">Workspace-wide</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-[var(--ws-muted)]">
              <input
                type="checkbox"
                name="all_day"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="accent-[var(--ws-accent)]"
              />
              All day
            </label>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Starts">
                <Input
                  name="starts_at"
                  type={allDay ? "date" : "datetime-local"}
                  required
                  defaultValue={allDay ? defaultDate : `${defaultDate}T10:00`}
                />
              </Field>
              <Field label="Ends">
                <Input
                  name="ends_at"
                  type={allDay ? "date" : "datetime-local"}
                  defaultValue={allDay ? defaultDate : `${defaultDate}T11:00`}
                />
              </Field>
            </div>

            <Field label="Location" hint="Optional">
              <Input name="location" placeholder="Meet link, room, city" />
            </Field>

            <Field label="Notes" hint="Optional">
              <Textarea name="description" rows={3} />
            </Field>

            <label className="flex items-center gap-2 text-[13px] text-[var(--ws-muted)]">
              <input
                type="checkbox"
                name="client_visible"
                className="accent-[var(--ws-accent)]"
              />
              Show on the client&rsquo;s calendar
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Saving…">Add entry</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
