"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/workspace/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Field, Input, Select } from "@/components/workspace/ui/Primitives";
import { createDoc } from "@/lib/workspace/actions/docs";
import type { DocKind } from "@/lib/workspace/database.types";

export default function NewDocButton({
  kind,
  projects,
  parentId,
}: {
  kind: DocKind;
  projects: { id: string; name: string }[];
  parentId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> New page
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={kind === "wiki" ? "New wiki page" : "New document"}
        description="Pages start internal. Share one explicitly when it's ready for the client."
      >
        <ActionForm action={createDoc}>
          <input type="hidden" name="kind" value={kind} />
          {parentId ? <input type="hidden" name="parent_id" value={parentId} /> : null}

          <div className="space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-[72px_1fr]">
              <Field label="Icon" hint="Emoji">
                <Input name="icon" maxLength={4} placeholder="📄" className="text-center" />
              </Field>
              <Field label="Title">
                <Input
                  name="title"
                  required
                  autoFocus
                  placeholder={kind === "wiki" ? "How we run a handover" : "Technical spec"}
                />
              </Field>
            </div>

            {kind === "doc" ? (
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
            ) : null}
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
