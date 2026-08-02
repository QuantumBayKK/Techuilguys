"use client";

import { addProjectMember, removeProjectMember } from "@/lib/workspace/actions/projects";
import { ActionForm, QuickForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Avatar, Card, CardHeader, Input, Select } from "@/components/workspace/ui/Primitives";
import type { TeamMember } from "@/lib/workspace/queries";

export default function ProjectTeam({
  projectId,
  team,
  staff,
  canEdit,
}: {
  projectId: string;
  team: TeamMember[];
  staff: { id: string; full_name: string | null; email: string }[];
  canEdit: boolean;
}) {
  const assigned = new Set(team.map((m) => m.id));
  const available = staff.filter((s) => !assigned.has(s.id));

  return (
    <Card>
      <CardHeader title="Team" hint={`${team.length} on this project`} />

      {team.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-[var(--ws-muted)]">
          Nobody assigned yet. The client sees these faces on their overview.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--ws-line)]">
          {team.map((member) => (
            <li key={member.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar
                name={member.full_name}
                email={member.email}
                src={member.avatar_url}
                size={30}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {member.full_name ?? member.email.split("@")[0]}
                </p>
                <p className="truncate text-[11px] text-[var(--ws-muted)]">
                  {member.role_on_project ?? "Contributor"}
                </p>
              </div>
              {canEdit ? (
                <QuickForm
                  action={removeProjectMember}
                  fields={{ project_id: projectId, profile_id: member.id }}
                  variant="ghost"
                  size="sm"
                  pendingLabel="…"
                >
                  Remove
                </QuickForm>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit && available.length > 0 ? (
        <div className="border-t border-[var(--ws-line)] p-4">
          <ActionForm action={addProjectMember} className="space-y-2">
            <input type="hidden" name="project_id" value={projectId} />
            <Select name="profile_id" required defaultValue="">
              <option value="" disabled>
                Add someone…
              </option>
              {available.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name ?? person.email}
                </option>
              ))}
            </Select>
            <Input name="role_on_project" placeholder="Role — e.g. Lead engineer" />
            <SubmitButton variant="outline" size="sm" className="w-full">
              Add to project
            </SubmitButton>
          </ActionForm>
        </div>
      ) : null}
    </Card>
  );
}
