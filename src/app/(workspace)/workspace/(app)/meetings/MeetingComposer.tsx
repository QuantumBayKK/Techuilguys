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
import { saveMeeting } from "@/lib/workspace/actions/meetings";

/** Next half-hour, in the local-time shape `datetime-local` wants. */
function nextSlot() {
  const d = new Date();
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MeetingComposer({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Schedule
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule a meeting"
        description="It lands on the calendar immediately. Invite people from the meeting page."
      >
        <ActionForm action={saveMeeting}>
          <div className="space-y-3.5">
            <Field label="Title">
              <Input name="title" required autoFocus placeholder="Sprint review" />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Starts">
                <Input
                  name="starts_at"
                  type="datetime-local"
                  required
                  defaultValue={nextSlot()}
                />
              </Field>
              <Field label="Duration">
                <Select name="duration_minutes" defaultValue="30">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1½ hours</option>
                </Select>
              </Field>
            </div>

            <Field label="Project" hint="Optional">
              <Select name="project_id" defaultValue="">
                <option value="">Not tied to a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Join link" hint="Meet, Zoom, anything">
              <Input name="join_url" type="url" placeholder="https://meet.google.com/…" />
            </Field>

            <Field label="Agenda" hint="Markdown">
              <Textarea
                name="agenda_md"
                rows={4}
                placeholder={"- Where we are\n- Blockers\n- What's next"}
              />
            </Field>

            <label className="flex items-center gap-2 text-[13px] text-[var(--ws-muted)]">
              <input
                type="checkbox"
                name="client_visible"
                className="accent-[var(--ws-accent)]"
              />
              Visible to the client
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Scheduling…">Schedule</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
