"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/workspace/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Field, Input, Select } from "@/components/workspace/ui/Primitives";
import { createChannel } from "@/lib/workspace/actions/chat";

export default function NewChannelButton({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New channel"
        className="rounded-md p-1 text-[var(--ws-faint)] transition-colors hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]"
      >
        <Plus size={14} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New channel"
        description="Names are lowercased and hyphenated, Slack-style."
      >
        <ActionForm action={createChannel}>
          <div className="space-y-3.5">
            <Field label="Name">
              <Input name="name" required autoFocus placeholder="dikki-launch" />
            </Field>

            <Field label="Topic" hint="Optional">
              <Input name="topic" placeholder="What this channel is for" />
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

            <label className="flex items-start gap-2 text-[13px] text-[var(--ws-muted)]">
              <input
                type="checkbox"
                name="client_visible"
                className="mt-0.5 accent-[var(--ws-accent)]"
              />
              <span>
                Let the client in
                <span className="block text-[11px] text-[var(--ws-faint)]">
                  Only clients of the chosen project&rsquo;s organization. Leave off
                  and the channel is staff-only.
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
