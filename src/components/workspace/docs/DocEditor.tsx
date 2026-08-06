"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Input } from "@/components/workspace/ui/Primitives";
import { saveDoc } from "@/lib/workspace/actions/docs";
import { usePresence } from "@/lib/workspace/realtime";
import type { Doc, Profile } from "@/lib/workspace/database.types";
import { Avatar } from "@/components/workspace/ui/Primitives";
import DocProse from "./DocProse";

/**
 * Edit a page. Explicit save, not autosave: the version trigger writes a row on
 * every body change, and autosaving a paragraph as you type would bury the real
 * revisions under a hundred keystroke snapshots.
 *
 * Presence broadcasts "editing" while the textarea has focus, so two people who
 * open the same page see each other before they collide rather than after.
 */
export default function DocEditor({
  doc,
  me,
  onCancel,
}: {
  doc: Doc;
  me: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
  onCancel: () => void;
}) {
  const { others, setActivity } = usePresence(`doc:${doc.id}`, me);
  const [preview, setPreview] = useState(false);
  const [body, setBody] = useState(doc.body_md);
  const area = useRef<HTMLTextAreaElement>(null);

  const editors = others.filter((p) => p.at === "editing");

  useEffect(() => () => setActivity(null), [setActivity]);

  // Warn before a reload eats an unsaved draft.
  const dirty = body !== doc.body_md;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <ActionForm action={saveDoc} onDone={onCancel}>
      <input type="hidden" name="id" value={doc.id} />
      <input type="hidden" name="icon" value={doc.icon ?? ""} />

      {editors.length > 0 ? (
        <p className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--ws-internal-line)] bg-[var(--ws-internal)] px-3 py-2 text-[12px] text-[var(--ws-muted)]">
          <span className="ws-face-stack">
            {editors.map((p) => (
              <Avatar key={p.id} name={p.name} email={p.email} src={p.avatar} size={20} />
            ))}
          </span>
          {editors.length === 1 ? `${editors[0].name} is` : `${editors.length} people are`}{" "}
          editing this page right now — last save wins.
        </p>
      ) : null}

      <Input
        name="title"
        defaultValue={doc.title}
        required
        aria-label="Page title"
        className="mb-3 border-0 bg-transparent px-0 text-2xl font-bold tracking-tight focus:border-0"
      />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={preview ? "ghost" : "subtle"}
            onClick={() => setPreview(false)}
          >
            <Pencil size={13} /> Write
          </Button>
          <Button
            type="button"
            size="sm"
            variant={preview ? "subtle" : "ghost"}
            onClick={() => setPreview(true)}
          >
            <Eye size={13} /> Preview
          </Button>
        </div>
        <p className="text-[11px] text-[var(--ws-faint)]">
          Markdown · <code>[[Page Title]]</code> links to another page
        </p>
      </div>

      {preview ? (
        <div className="min-h-[420px] rounded-lg border border-[var(--ws-line)] bg-[var(--ws-surface)] p-5">
          {body ? (
            /* No `targets`, so `[[…]]` renders as dimmed unresolved text. The
               editor cannot know which pages the eventual reader may see, and
               guessing here would preview a link that does not exist for them. */
            <DocProse body={body} />
          ) : (
            <p className="text-[13px] text-[var(--ws-faint)]">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={area}
          name="body_md"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setActivity("editing")}
          onBlur={() => setActivity(null)}
          rows={22}
          spellCheck
          className="mono w-full resize-y rounded-lg border border-[var(--ws-line-strong)] bg-[var(--ws-bg)] p-4 text-[13px] leading-relaxed text-[var(--ws-text)] focus:border-[var(--ws-accent)] focus:outline-none"
          placeholder={"# Heading\n\nWrite the page.\n\nLink another with [[Architecture]]."}
        />
      )}

      {/* Preview mode unmounts the textarea, so carry the body in a hidden
          field — otherwise saving from preview would submit an empty page. */}
      {preview ? <input type="hidden" name="body_md" value={body} /> : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        {dirty ? (
          <span className="mr-auto text-[11px] text-[var(--ws-faint)]">
            Unsaved changes
          </span>
        ) : null}
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
      </div>
    </ActionForm>
  );
}

