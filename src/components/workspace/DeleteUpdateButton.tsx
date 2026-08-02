"use client";

import { deleteUpdate } from "@/lib/workspace/actions/content";
import { QuickForm } from "./ui/Form";

export default function DeleteUpdateButton({ id }: { id: string }) {
  return (
    <QuickForm
      action={deleteUpdate}
      fields={{ id }}
      variant="ghost"
      size="sm"
      confirm="Delete this update? The client loses it from their feed."
      className="text-[var(--ws-faint)]"
    >
      Delete
    </QuickForm>
  );
}
