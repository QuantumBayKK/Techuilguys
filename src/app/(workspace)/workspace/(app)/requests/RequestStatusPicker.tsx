"use client";

import { setRequestStatus } from "@/lib/workspace/actions/requests";
import { QuickForm } from "@/components/workspace/ui/Form";
import type { RequestStatus } from "@/lib/workspace/database.types";

const NEXT: Record<RequestStatus, [RequestStatus, string][]> = {
  new: [
    ["reviewing", "Start review"],
    ["rejected", "Reject"],
  ],
  reviewing: [
    ["accepted", "Accept"],
    ["rejected", "Reject"],
  ],
  accepted: [
    ["done", "Mark done"],
    ["reviewing", "Back to review"],
  ],
  done: [["accepted", "Reopen"]],
  rejected: [["reviewing", "Reconsider"]],
};

export default function RequestStatusPicker({
  id,
  status,
}: {
  id: string;
  status: RequestStatus;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5">
      {NEXT[status].map(([next, label]) => (
        <QuickForm
          key={next}
          action={setRequestStatus}
          fields={{ id, status: next }}
          variant={next === "rejected" ? "ghost" : "outline"}
          size="sm"
          pendingLabel="…"
        >
          {label}
        </QuickForm>
      ))}
    </div>
  );
}
