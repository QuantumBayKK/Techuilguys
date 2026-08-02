"use client";

import { deleteComment } from "@/lib/workspace/actions/content";
import { QuickForm } from "./ui/Form";

export default function DeleteCommentButton({ id }: { id: string }) {
  return (
    <QuickForm
      action={deleteComment}
      fields={{ id }}
      variant="ghost"
      size="sm"
      confirm="Delete this comment?"
      className="text-[var(--ws-faint)]"
    >
      Delete
    </QuickForm>
  );
}
