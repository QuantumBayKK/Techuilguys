"use client";

import { useState } from "react";
import { createProject } from "@/lib/workspace/actions/projects";
import { slugify } from "@/lib/workspace/format";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Field, Input, Select, Textarea } from "@/components/workspace/ui/Primitives";
import type { Organization } from "@/lib/workspace/database.types";

const STATUSES = ["discovery", "building", "review", "launched", "paused"];

export default function NewProjectForm({
  organizations,
}: {
  organizations: Organization[];
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Slug mirrors the name until someone edits it by hand, then it stops moving.
  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <ActionForm action={createProject} className="space-y-4">
      <Field label="Project name">
        <Input
          name="name"
          required
          autoFocus
          placeholder="Acme Ops Portal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="URL slug" hint={`/workspace/portal/${effectiveSlug || "…"}`}>
        <Input
          name="slug"
          required
          className="mono"
          placeholder="acme-ops-portal"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
      </Field>

      <Field label="Client organization">
        <Select name="organization_id" required defaultValue="">
          <option value="" disabled>
            Pick one…
          </option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description" hint="Shown to the client">
        <Textarea
          name="description"
          rows={3}
          placeholder="What we're building and why it matters."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select name="status" defaultValue="discovery">
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date">
          <Input type="date" name="start_date" />
        </Field>
        <Field label="Target date">
          <Input type="date" name="target_date" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GitHub repo" hint="owner/name">
          <Input name="github_repo" className="mono" placeholder="techuilaguys/acme" />
        </Field>
        <Field label="Notion page ID">
          <Input name="notion_page_id" className="mono" placeholder="32 hex chars" />
        </Field>
      </div>

      <div className="pt-1">
        <SubmitButton pendingLabel="Creating…">Create project</SubmitButton>
      </div>
    </ActionForm>
  );
}
