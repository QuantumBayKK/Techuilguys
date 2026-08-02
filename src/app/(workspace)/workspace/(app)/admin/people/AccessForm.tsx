"use client";

import { useState } from "react";
import { setUserAccess } from "@/lib/workspace/actions/admin";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Input, Label, Select } from "@/components/workspace/ui/Primitives";
import type { Organization, Profile, Role } from "@/lib/workspace/database.types";

const ROLES: [Role, string][] = [
  ["pending", "Pending — no access"],
  ["client", "Client — their own project only"],
  ["employee", "Employee — all projects, own time"],
  ["admin", "Admin — everything"],
];

export default function AccessForm({
  profile,
  organizations,
}: {
  profile: Profile;
  organizations: Organization[];
}) {
  const [role, setRole] = useState<Role>(profile.role);
  const isStaff = role === "admin" || role === "employee";

  return (
    <ActionForm action={setUserAccess} className="flex flex-wrap items-end gap-2.5">
      <input type="hidden" name="id" value={profile.id} />

      <label className="min-w-[190px] flex-1">
        <Label>Role</Label>
        <Select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>

      {/* Only clients belong to a client organization — staff see everything. */}
      {role === "client" ? (
        <label className="min-w-[190px] flex-1">
          <Label>Organization</Label>
          <Select
            name="organization_id"
            required
            defaultValue={profile.organization_id ?? ""}
          >
            <option value="" disabled>
              Link to…
            </option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      {isStaff ? (
        <label className="w-28">
          <Label>Capacity</Label>
          <Input
            type="number"
            name="weekly_capacity_hours"
            min={0}
            max={80}
            className="mono"
            defaultValue={profile.weekly_capacity_hours}
          />
        </label>
      ) : null}

      <SubmitButton size="md" pendingLabel="Saving…">
        {profile.role === "pending" ? "Grant access" : "Update"}
      </SubmitButton>
    </ActionForm>
  );
}
