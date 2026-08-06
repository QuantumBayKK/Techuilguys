"use client";

import { useState } from "react";
import { History, Pencil, Share2, Archive } from "lucide-react";
import { Button } from "@/components/workspace/ui/Primitives";
import { QuickForm } from "@/components/workspace/ui/Form";
import Presence from "@/components/workspace/Presence";
import { relativeTime } from "@/lib/workspace/format";
import { archiveDoc, restoreVersion, setDocVisibility } from "@/lib/workspace/actions/docs";
import type { Doc, DocVersion, Profile } from "@/lib/workspace/database.types";
import DocEditor from "./DocEditor";
import DocProse, { type WikiTarget } from "./DocProse";

/**
 * A page, read or written. The read view is the default and the quiet one — the
 * controls only appear for staff, and history is folded away until asked for.
 */
export default function DocView({
  doc,
  targets,
  versions,
  editors,
  me,
  canEdit,
}: {
  doc: Doc;
  targets: WikiTarget[];
  versions: (DocVersion & { editor: string | null })[];
  editors: Record<string, string>;
  me: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (editing) {
    return <DocEditor doc={doc} me={me} onCancel={() => setEditing(false)} />;
  }

  return (
    <>
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Presence room={`doc:${doc.id}`} me={me} label="reading" />
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <QuickForm
                action={setDocVisibility}
                fields={{ id: doc.id, client_visible: !doc.client_visible }}
                variant={doc.client_visible ? "subtle" : "outline"}
              >
                <Share2 size={13} />
                {doc.client_visible ? "Shared with client" : "Internal only"}
              </QuickForm>
              <Button size="sm" variant="ghost" onClick={() => setShowHistory((v) => !v)}>
                <History size={13} /> History
                {versions.length ? ` (${versions.length})` : ""}
              </Button>
              <Button size="sm" variant="primary" onClick={() => setEditing(true)}>
                <Pencil size={13} /> Edit
              </Button>
            </div>
          ) : null}
        </div>

        <h1 className="font-display flex items-start gap-2.5 text-2xl font-bold tracking-tight sm:text-[30px]">
          {doc.icon ? <span aria-hidden>{doc.icon}</span> : null}
          <span>{doc.title}</span>
        </h1>
        <p className="mt-1.5 text-[12px] text-[var(--ws-faint)]">
          Updated {relativeTime(doc.updated_at)}
          {doc.updated_by && editors[doc.updated_by]
            ? ` by ${editors[doc.updated_by]}`
            : ""}
        </p>
      </header>

      {showHistory && canEdit ? (
        <div className="mb-6 rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]">
          <p className="border-b border-[var(--ws-line)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
            Version history
          </p>
          {versions.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-[var(--ws-muted)]">
              No edits yet — history starts with the second save.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ws-line)]">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{v.title}</span>
                    <span className="text-[11px] text-[var(--ws-faint)]">
                      {relativeTime(v.created_at)}
                      {v.editor ? ` · ${v.editor}` : ""} · {v.body_md.length} chars
                    </span>
                  </span>
                  <QuickForm
                    action={restoreVersion}
                    fields={{ version_id: v.id }}
                    confirm="Replace the current body with this version? The current text is kept in history."
                  >
                    Restore
                  </QuickForm>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {doc.body_md.trim() ? (
        <DocProse body={doc.body_md} targets={targets} />
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--ws-line-strong)] px-5 py-10 text-center text-[13px] text-[var(--ws-muted)]">
          This page is empty.
          {canEdit ? " Press Edit to start writing." : ""}
        </p>
      )}

      {canEdit ? (
        <div className="mt-10 border-t border-[var(--ws-line)] pt-4">
          <QuickForm
            action={archiveDoc}
            fields={{ id: doc.id }}
            variant="ghost"
            confirm="Archive this page? It disappears for clients and stays readable for staff."
          >
            <Archive size={13} /> Archive page
          </QuickForm>
        </div>
      ) : null}
    </>
  );
}
