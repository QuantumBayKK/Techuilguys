"use client";

import { approveMilestone } from "@/lib/workspace/actions/projects";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";

export default function ApproveButton({
  id,
  disabled,
  disabledReason,
}: {
  id: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  if (disabled) {
    return (
      <p className="text-xs text-[var(--ws-faint)]">
        {disabledReason ?? "Not available."}
      </p>
    );
  }

  return (
    <ActionForm action={approveMilestone}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="primary" pendingLabel="Recording…">
        ✓ Approve this milestone
      </SubmitButton>
    </ActionForm>
  );
}
