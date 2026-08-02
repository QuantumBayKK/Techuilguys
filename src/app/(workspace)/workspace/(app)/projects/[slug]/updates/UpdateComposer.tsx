"use client";

import { useState } from "react";
import { postUpdate } from "@/lib/workspace/actions/content";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Field, Input, Select, Textarea } from "@/components/workspace/ui/Primitives";
import Markdown from "@/components/workspace/ui/Markdown";

const TYPES = [
  ["progress", "Progress — what shipped"],
  ["launch", "Launch — something went live"],
  ["blocker", "Blocker — we need something"],
  ["note", "Note — FYI"],
];

export default function UpdateComposer({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <ActionForm
      action={postUpdate}
      className="space-y-3"
      onDone={() => setBody("")}
      resetOnSuccess
    >
      <input type="hidden" name="project_id" value={projectId} />

      <Field label="Type">
        <Select name="update_type" defaultValue="progress">
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Headline">
        <Input name="title" required placeholder="Auth and billing are live" />
      </Field>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-muted)]">
            Body
          </span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-[11px] font-semibold text-[var(--ws-accent)] hover:underline"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[132px] rounded-lg border border-[var(--ws-line-strong)] bg-[var(--ws-bg)] px-3 py-2">
            {body.trim() ? (
              <Markdown>{body}</Markdown>
            ) : (
              <p className="text-xs text-[var(--ws-faint)]">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <Textarea
            name="body_md"
            rows={6}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Markdown works.\n\n- Bullet what shipped\n- Link the demo\n- Say what's next"}
          />
        )}
        {preview ? <input type="hidden" name="body_md" value={body} /> : null}
      </div>

      <SubmitButton className="w-full" pendingLabel="Posting…">
        Post update
      </SubmitButton>
      <p className="text-[11px] leading-relaxed text-[var(--ws-faint)]">
        Clients get an in-app notification and an email. Keep it short — this is
        the thing they forward to their boss.
      </p>
    </ActionForm>
  );
}
