"use client";

import type { Project } from "@/data/projects";

/**
 * The "see it for real" actions for a project: a live preview and/or the source
 * repo. Renders nothing if neither exists, so cards without links stay clean.
 */
export default function ProjectLinks({
  project,
  className = "",
}: {
  project: Project;
  className?: string;
}) {
  if (!project.repo && !project.live) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {project.live && (
        <Action href={project.live} cursor="Live" primary>
          Live preview
        </Action>
      )}
      {project.repo && (
        <Action href={project.repo} cursor="Code">
          {iconGitHub}
          Code
        </Action>
      )}
    </div>
  );
}

function Action({
  href,
  cursor,
  primary,
  children,
}: {
  href: string;
  cursor: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-cursor={cursor}
      data-magnetic
      className={`font-display inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.25em] transition-colors ${
        primary
          ? "bg-[var(--color-neon-amber)] text-[var(--color-noir)] hover:bg-[var(--color-brass-bright)]"
          : "border border-[var(--color-line-warm)] text-[var(--color-ink)] hover:bg-[var(--color-neon-amber)]/10"
      }`}
    >
      {children}
      <span aria-hidden>↗</span>
    </a>
  );
}

const iconGitHub = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
