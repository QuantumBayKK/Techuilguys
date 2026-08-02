"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { FileText, FolderKanban, Megaphone, Paperclip, Search } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { SearchHit } from "@/lib/workspace/database.types";

const EVENT = "ws:command-palette";

/** Called from the topbar button; keeps the palette itself mounted once. */
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

const ICONS = {
  project: FolderKanban,
  task: FileText,
  update: Megaphone,
  file: Paperclip,
} as const;

/**
 * ⌘K search. Backed by `workspace_search`, a SECURITY INVOKER function — so RLS
 * filters the result set and a client physically cannot get a hit on another
 * org's project, however they phrase the query.
 */
export default function CommandPalette({ isStaff }: { isStaff: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Bare "/" opens search, but not while typing in a field.
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable;
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);

    document.addEventListener("keydown", onKey);
    window.addEventListener(EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(EVENT, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 10);
    else {
      setQuery("");
      setHits([]);
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabaseBrowser().rpc("workspace_search", { q });
      setHits(data ?? []);
      setCursor(0);
      setLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  const hrefFor = useCallback(
    (hit: SearchHit) => {
      const base = isStaff
        ? `/workspace/projects/${hit.project_slug}`
        : `/workspace/portal/${hit.project_slug}`;
      if (hit.kind === "project") return base;
      if (hit.kind === "task") return isStaff ? `${base}/board` : base;
      if (hit.kind === "update") return `${base}/updates`;
      return `${base}/files`;
    },
    [isStaff],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, hits.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter" && hits[cursor]) {
      e.preventDefault();
      setOpen(false);
      router.push(hrefFor(hits[cursor]));
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ws fixed inset-0 z-[220] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the workspace"
        className="ws-in w-full max-w-lg overflow-hidden rounded-xl border border-[var(--ws-line-strong)] bg-[var(--ws-surface)] shadow-[var(--ws-shadow)]"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--ws-line)] px-4">
          <Search size={16} className="shrink-0 text-[var(--ws-faint)]" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, tasks, updates, files…"
            className="w-full bg-transparent py-3.5 text-sm text-[var(--ws-text)] placeholder:text-[var(--ws-faint)] focus:outline-none"
          />
          <kbd className="mono shrink-0 rounded border border-[var(--ws-line)] px-1.5 py-0.5 text-[10px] text-[var(--ws-faint)]">
            esc
          </kbd>
        </div>

        <ul className="ws-scroll max-h-[52vh] overflow-y-auto py-1.5">
          {query.trim().length < 2 ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--ws-faint)]">
              Type at least two characters.
            </li>
          ) : loading ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--ws-faint)]">
              Searching…
            </li>
          ) : hits.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--ws-faint)]">
              Nothing matched “{query.trim()}”.
            </li>
          ) : (
            hits.map((hit, i) => {
              const Icon = ICONS[hit.kind];
              return (
                <li key={`${hit.kind}-${hit.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => {
                      setOpen(false);
                      router.push(hrefFor(hit));
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                      i === cursor ? "bg-[var(--ws-hover)]" : ""
                    }`}
                  >
                    <Icon size={15} className="shrink-0 text-[var(--ws-faint)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {hit.title}
                      </span>
                      {hit.subtitle ? (
                        <span className="mono block truncate text-[11px] text-[var(--ws-faint)]">
                          {hit.subtitle}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-[var(--ws-faint)]">
                      {hit.kind}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
