"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button, Card, CardHeader } from "@/components/workspace/ui/Primitives";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import Markdown from "@/components/workspace/ui/Markdown";
import { usePresence } from "@/lib/workspace/realtime";
import { saveMeetingNotes } from "@/lib/workspace/actions/meetings";
import type { Meeting, Profile } from "@/lib/workspace/database.types";

/**
 * Live notes. Not a CRDT — one person types, everyone else watches the
 * "taking notes" marker and stays out of the box. For a five-person studio
 * that is the honest trade: real co-editing needs conflict resolution nobody
 * here is going to maintain, and last-write-wins on a shared textarea silently
 * eats work.
 */
export default function MeetingNotes({
  meeting,
  me,
}: {
  meeting: Meeting;
  me: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
}) {
  const [editing, setEditing] = useState(false);
  const { others, setActivity } = usePresence(`meeting:${meeting.id}`, me);
  const scribe = others.find((p) => p.at === "notes");

  return (
    <Card>
      <CardHeader
        title="Notes"
        hint={scribe ? `${scribe.name} is taking notes right now` : undefined}
        action={
          !editing ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil size={13} /> Edit
            </Button>
          ) : null
        }
      />

      <div className="px-5 py-4">
        {editing ? (
          <ActionForm action={saveMeetingNotes} onDone={() => setEditing(false)}>
            <input type="hidden" name="id" value={meeting.id} />
            <textarea
              name="notes_md"
              defaultValue={meeting.notes_md}
              rows={12}
              autoFocus
              onFocus={() => setActivity("notes")}
              onBlur={() => setActivity(null)}
              placeholder="What was decided, and by whom."
              className="mono w-full resize-y rounded-lg border border-[var(--ws-line-strong)] bg-[var(--ws-bg)] p-3 text-[13px] leading-relaxed text-[var(--ws-text)] focus:border-[var(--ws-accent)] focus:outline-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActivity(null);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <SubmitButton pendingLabel="Saving…">Save notes</SubmitButton>
            </div>
          </ActionForm>
        ) : meeting.notes_md.trim() ? (
          <Markdown>{meeting.notes_md}</Markdown>
        ) : (
          <p className="text-[13px] text-[var(--ws-muted)]">
            No notes yet.
          </p>
        )}
      </div>
    </Card>
  );
}
