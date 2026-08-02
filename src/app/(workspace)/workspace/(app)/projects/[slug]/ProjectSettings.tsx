"use client";

import { useState } from "react";
import { deleteProject, updateProject } from "@/lib/workspace/actions/projects";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/workspace/ui/Primitives";
import type { Organization, Project } from "@/lib/workspace/database.types";

const STATUSES = ["discovery", "building", "review", "launched", "paused"];
const HEALTHS = [
  ["green", "Green — on track"],
  ["amber", "Amber — at risk"],
  ["red", "Red — blocked"],
];

export default function ProjectSettings({
  project,
  organizations,
  canDelete,
}: {
  project: Project;
  organizations: Pick<Organization, "id" | "name">[];
  canDelete: boolean;
}) {
  const [danger, setDanger] = useState(false);
  const org = organizations.find((o) => o.id === project.organization_id);

  return (
    <div className="space-y-6">
      <ActionForm action={updateProject} className="space-y-4">
        <input type="hidden" name="id" value={project.id} />
        <input type="hidden" name="slug" value={project.slug} />

        <Field label="Name">
          <Input name="name" required defaultValue={project.name} />
        </Field>

        <Field label="Description" hint="Visible to the client">
          <Textarea name="description" rows={3} defaultValue={project.description ?? ""} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select name="status" defaultValue={project.status}>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Health">
            <Select name="health" defaultValue={project.health}>
              {HEALTHS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Health note" hint="One line, shown to the client">
          <Input
            name="health_note"
            defaultValue={project.health_note ?? ""}
            placeholder="Waiting on API credentials from the client's vendor."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <Input type="date" name="start_date" defaultValue={project.start_date ?? ""} />
          </Field>
          <Field label="Target date">
            <Input type="date" name="target_date" defaultValue={project.target_date ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GitHub repo" hint="owner/name">
            <Input
              name="github_repo"
              className="mono"
              defaultValue={project.github_repo ?? ""}
              placeholder="techuilaguys/acme"
            />
          </Field>
          <Field label="Notion page ID">
            <Input
              name="notion_page_id"
              className="mono"
              defaultValue={project.notion_page_id ?? ""}
            />
          </Field>
        </div>

        <p className="text-xs text-[var(--ws-faint)]">
          Client organization: <span className="text-[var(--ws-muted)]">{org?.name ?? "—"}</span>.
          Moving a project between organizations changes who can see it, so it
          isn&apos;t editable here by design.
        </p>

        <SubmitButton>Save changes</SubmitButton>
      </ActionForm>

      {canDelete ? (
        <div className="rounded-lg border border-[var(--ws-red)]/25 p-4">
          <p className="text-[13px] font-semibold text-[var(--ws-red)]">Delete project</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ws-muted)]">
            Removes every task, milestone, update, comment and file record. The
            client loses their portal immediately. This cannot be undone.
          </p>

          {danger ? (
            <ActionForm action={deleteProject} className="mt-3">
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="name" value={project.name} />
              <Input
                name="confirm"
                autoFocus
                placeholder={`Type "${project.name}" to confirm`}
                className="max-w-sm"
              />
              <div className="mt-2.5 flex gap-2">
                <SubmitButton variant="danger" pendingLabel="Deleting…">
                  Delete permanently
                </SubmitButton>
                <Button type="button" variant="ghost" onClick={() => setDanger(false)}>
                  Cancel
                </Button>
              </div>
            </ActionForm>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="mt-3"
              onClick={() => setDanger(true)}
            >
              Delete this project
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
