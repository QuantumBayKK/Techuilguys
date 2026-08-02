"use client";

import { updateOwnProfile } from "@/lib/workspace/actions/projects";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Field, Input } from "@/components/workspace/ui/Primitives";
import type { Profile } from "@/lib/workspace/database.types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  return (
    <ActionForm action={updateOwnProfile} className="space-y-4">
      <Field label="Display name" hint="What teammates and clients see">
        <Input name="full_name" defaultValue={profile.full_name ?? ""} placeholder="Your name" />
      </Field>
      <SubmitButton>Save</SubmitButton>
    </ActionForm>
  );
}
