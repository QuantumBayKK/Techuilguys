"use client";

import { useState } from "react";
import {
  createOrganization,
  deleteOrganization,
  updateOrganization,
} from "@/lib/workspace/actions/admin";
import { ActionForm, QuickForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Field, Input } from "@/components/workspace/ui/Primitives";
import type { Organization } from "@/lib/workspace/database.types";

export default function OrgForm({ organization }: { organization?: Organization }) {
  const [editing, setEditing] = useState(false);

  if (!organization) {
    return (
      <ActionForm action={createOrganization} className="space-y-3" resetOnSuccess>
        <Field label="Name">
          <Input name="name" required placeholder="Acme Industries" />
        </Field>
        <Field label="Logo URL" hint="Shown in their portal header">
          <Input name="logo_url" type="url" placeholder="https://acme.com/logo.svg" />
        </Field>
        <SubmitButton size="sm" className="w-full">
          Create organization
        </SubmitButton>
      </ActionForm>
    );
  }

  if (editing) {
    return (
      <ActionForm
        action={updateOrganization}
        className="space-y-3"
        onDone={() => setEditing(false)}
      >
        <input type="hidden" name="id" value={organization.id} />
        <Field label="Name">
          <Input name="name" required defaultValue={organization.name} />
        </Field>
        <Field label="Logo URL">
          <Input name="logo_url" type="url" defaultValue={organization.logo_url ?? ""} />
        </Field>
        <div className="flex gap-2">
          <SubmitButton size="sm">Save</SubmitButton>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </ActionForm>
    );
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={() => setEditing(true)}>
        Edit
      </Button>
      <QuickForm
        action={deleteOrganization}
        fields={{ id: organization.id }}
        variant="ghost"
        size="sm"
        confirm={`Delete ${organization.name}?`}
        className="text-[var(--ws-faint)]"
      >
        Delete
      </QuickForm>
    </div>
  );
}
