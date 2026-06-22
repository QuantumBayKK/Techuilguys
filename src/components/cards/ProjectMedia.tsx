"use client";

import { useState } from "react";
import type { Project } from "@/data/projects";
import ProjectDemo from "@/components/demos/ProjectDemo";

/**
 * The deck visual for one project. Prefers AI-generated hero art (or a real
 * screenshot) dropped into `public/projects/`; if that file isn't present yet
 * — or fails to load — it silently falls back to the live SVG demo so the page
 * is never broken. Both share the same 16:10 editorial frame so swapping in
 * real images later needs zero layout changes.
 */
export default function ProjectMedia({
  project,
  live,
}: {
  project: Project;
  live: boolean;
}) {
  // null = untried/loading, true = image loaded ok, false = errored → demo only
  const [hasImage, setHasImage] = useState<boolean | null>(
    project.image ? null : false
  );

  // The demo is the base layer; the image fades in on top once it truly loads,
  // so there's never an empty frame before an absent image 404s.
  const showDemo = hasImage !== true;

  return (
    <figure className="group relative m-0 aspect-[16/10] w-full max-w-xl overflow-hidden rounded-xl border border-[var(--color-line)]">
      {/* live SVG proof — base layer + the fallback when there's no art yet */}
      {showDemo && (
        <div className="absolute inset-0">
          <ProjectDemo kind={project.demo} live={live} />
        </div>
      )}

      {/* hero image — mounted only while a path is set and hasn't errored */}
      {project.image && hasImage !== false && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt={project.imageAlt ?? `${project.title} — ${project.subtitle}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setHasImage(true)}
          onError={() => setHasImage(false)}
          className={`absolute inset-0 z-10 h-full w-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.04] ${
            hasImage ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* readability grade over real imagery */}
      {hasImage === true && (
        <span
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,6,4,0) 55%, rgba(8,6,4,0.5) 100%)",
          }}
        />
      )}

      {/* hairline inner frame for the framed-print feel */}
      <span className="pointer-events-none absolute inset-0 z-20 rounded-xl ring-1 ring-inset ring-[var(--color-brass)]/15" />

      {/* corner meta — reinforces "this is a real shipped thing" */}
      <figcaption className="pointer-events-none absolute bottom-2 left-3 z-20 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--color-ink)]/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {showDemo ? "live preview" : project.title}
      </figcaption>
    </figure>
  );
}
