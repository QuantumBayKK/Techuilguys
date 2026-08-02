"use client";

import { submitRequest } from "@/lib/workspace/actions/requests";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Field, Input, Select, Textarea } from "@/components/workspace/ui/Primitives";

const TYPES = [
  ["change", "Change — do something differently"],
  ["bug", "Bug — something's broken"],
  ["question", "Question — I need to know something"],
  ["new_project", "New project — let's talk about something new"],
];

export default function RequestForm({
  projectId,
  organizationId,
  canSubmit,
}: {
  projectId: string;
  organizationId: string;
  canSubmit: boolean;
}) {
  if (!canSubmit) {
    return (
      <p className="text-xs leading-relaxed text-[var(--ws-muted)]">
        This is the client&apos;s intake form. Employees raise work on the board
        instead — that keeps the client&apos;s own pipeline honest.
      </p>
    );
  }

  return (
    <ActionForm action={submitRequest} className="space-y-3" resetOnSuccess>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="organization_id" value={organizationId} />

      <Field label="Type">
        <Select name="request_type" defaultValue="change">
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="One line">
        <Input name="title" required placeholder="Invoice PDFs are missing the VAT line" />
      </Field>

      <Field label="Detail">
        <Textarea
          name="description"
          rows={5}
          required
          placeholder="What you expected, what happened, and how urgent it is."
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Sending…">
        Send it
      </SubmitButton>

      <p className="text-[11px] leading-relaxed text-[var(--ws-faint)]">
        Goes straight into our queue and pings the team. Attach files on the
        Deliverables tab if it needs a screenshot.
      </p>
    </ActionForm>
  );
}
