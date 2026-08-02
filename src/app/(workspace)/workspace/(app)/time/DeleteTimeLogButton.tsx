"use client";

import { deleteTimeLog } from "@/lib/workspace/actions/time";
import { QuickForm } from "@/components/workspace/ui/Form";

export default function DeleteTimeLogButton({ id }: { id: string }) {
  return (
    <QuickForm
      action={deleteTimeLog}
      fields={{ id }}
      variant="ghost"
      size="sm"
      confirm="Delete this entry?"
      className="shrink-0 text-[var(--ws-faint)]"
    >
      ×
    </QuickForm>
  );
}
