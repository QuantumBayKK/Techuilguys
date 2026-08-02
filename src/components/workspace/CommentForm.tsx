"use client";

import { useRef } from "react";
import { postComment } from "@/lib/workspace/actions/content";
import { ActionForm, SubmitButton } from "./ui/Form";
import { Textarea } from "./ui/Primitives";
import type { ParentType } from "@/lib/workspace/database.types";

export default function CommentForm({
  projectId,
  parentType,
  parentId,
  internalOnly,
  placeholder,
}: {
  projectId: string;
  parentType: ParentType;
  parentId: string;
  internalOnly?: boolean;
  placeholder?: string;
}) {
  const field = useRef<HTMLTextAreaElement>(null);

  return (
    <ActionForm action={postComment} onDone={() => field.current && (field.current.value = "")}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="parent_type" value={parentType} />
      <input type="hidden" name="parent_id" value={parentId} />
      {internalOnly ? <input type="hidden" name="internal_only" value="true" /> : null}

      <Textarea
        ref={field}
        name="body_md"
        rows={3}
        required
        placeholder={
          placeholder ??
          (internalOnly
            ? "Scope creep, pricing, anything the client shouldn't read. Markdown works."
            : "Add a comment. Markdown works.")
        }
        className={internalOnly ? "border-[var(--ws-internal-line)]" : undefined}
        onKeyDown={(e) => {
          // ⌘/Ctrl+Enter submits — the muscle memory everyone already has.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />

      <div className="mt-2 flex items-center gap-3">
        <SubmitButton size="sm" variant={internalOnly ? "outline" : "primary"} pendingLabel="Posting…">
          {internalOnly ? "Add internal note" : "Comment"}
        </SubmitButton>
        <span className="text-[11px] text-[var(--ws-faint)]">⌘↵ to post</span>
      </div>
    </ActionForm>
  );
}
