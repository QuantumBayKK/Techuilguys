"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/workspace/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Field, Input, Select } from "@/components/workspace/ui/Primitives";
import { createBoard } from "@/lib/workspace/actions/boards";

export default function NewBoardButton({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> New board
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New whiteboard">
        <ActionForm action={createBoard}>
          <div className="space-y-3.5">
            <Field label="Title">
              <Input name="title" required autoFocus placeholder="Sender flow v2" />
            </Field>

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

            <label className="flex items-start gap-2 text-[13px] text-[var(--ws-muted)]">
              <input
                type="checkbox"
                name="client_visible"
                className="mt-0.5 accent-[var(--ws-accent)]"
              />
              <span>
                Share with the client
                <span className="block text-[11px] text-[var(--ws-faint)]">
                  A shared board is collaborative — they can draw on it too.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Creating…">Create</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
