import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/workspace/session";
import { PageHeader, Card, buttonClass } from "@/components/workspace/ui/Primitives";
import type { CalendarItem } from "@/lib/workspace/database.types";
import EventComposer from "./EventComposer";

export const metadata = { title: "Calendar · Workspace" };

/**
 * The month is in the URL (`?m=2026-08`), not in React state — so the view is
 * server-rendered, shareable, and back/forward works. Navigation is two links.
 */
function monthFrom(param: string | undefined) {
  const match = /^(\d{4})-(\d{2})$/.exec(param ?? "");
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) - 1 : now.getMonth();
  return new Date(Date.UTC(year, month, 1));
}

const key = (d: Date) => d.toISOString().slice(0, 10);
const param = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; p?: string }>;
}) {
  const { m, p } = await searchParams;
  const session = await requireSession();
  const supabase = await supabaseServer();

  const first = monthFrom(m);
  const prev = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1));
  const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));

  // The grid always shows whole weeks, so the query window is the grid window —
  // otherwise the leading/trailing days would render suspiciously empty.
  const lead = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - lead);
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 42);

  const [{ data: feed }, { data: projects }] = await Promise.all([
    supabase.rpc("calendar_feed", {
      p_from: gridStart.toISOString(),
      p_to: gridEnd.toISOString(),
      p_project: p ?? null,
    }),
    supabase.from("projects").select("id, name, slug").order("name"),
  ]);

  const items = (feed ?? []) as CalendarItem[];

  // Bucket by local day. An item spanning days appears on each day it touches.
  const byDay = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const from = new Date(item.starts_at);
    const to = new Date(item.ends_at);
    const cursor = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
    const last = new Date(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()));
    for (let guard = 0; cursor <= last && guard < 60; guard += 1) {
      const k = key(cursor);
      byDay.set(k, [...(byDay.get(k) ?? []), item]);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setUTCDate(day.getUTCDate() + i);
    return day;
  });

  const today = key(new Date(Date.UTC(
    new Date().getFullYear(), new Date().getMonth(), new Date().getDate(),
  )));

  const title = first.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const upcoming = items
    .filter((i) => new Date(i.ends_at) >= new Date())
    .slice(0, 8);

  const q = (d: Date) => `/workspace/calendar?m=${param(d)}${p ? `&p=${p}` : ""}`;

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title={title}
        description="Sessions, deadlines, meetings and milestone dates in one grid."
        action={
          <div className="flex items-center gap-2">
            <Link href={q(prev)} aria-label="Previous month" className={buttonClass("ghost", "sm")}>
              <ChevronLeft size={15} />
            </Link>
            <Link href="/workspace/calendar" className={buttonClass("outline", "sm")}>
              Today
            </Link>
            <Link href={q(next)} aria-label="Next month" className={buttonClass("ghost", "sm")}>
              <ChevronRight size={15} />
            </Link>
            {session.isStaff ? (
              <EventComposer projects={projects ?? []} defaultDate={key(first)} />
            ) : null}
          </div>
        }
      />

      {/* Project filter — a plain row of links, no dropdown to open. */}
      {(projects ?? []).length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <FilterChip href={`/workspace/calendar?m=${param(first)}`} active={!p}>
            All projects
          </FilterChip>
          {(projects ?? []).map((proj) => (
            <FilterChip
              key={proj.id}
              href={`/workspace/calendar?m=${param(first)}&p=${proj.id}`}
              active={p === proj.id}
            >
              {proj.name}
            </FilterChip>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_268px]">
        <div>
          <div className="mb-1.5 grid grid-cols-7 gap-1 px-1">
            {DAYS.map((d) => (
              <span
                key={d}
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-faint)]"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="ws-month">
            {cells.map((day) => {
              const k = key(day);
              const outside = day.getUTCMonth() !== first.getUTCMonth();
              const dayItems = byDay.get(k) ?? [];

              return (
                <div
                  key={k}
                  className={`min-h-[92px] p-1.5 ${outside ? "opacity-40" : ""}`}
                >
                  <span
                    className={`mono mb-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] ${
                      k === today
                        ? "bg-[var(--ws-accent)] font-bold text-[var(--ws-accent-ink)]"
                        : "text-[var(--ws-faint)]"
                    }`}
                  >
                    {day.getUTCDate()}
                  </span>

                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <DayItem key={`${item.source}-${item.id}-${k}`} item={item} />
                    ))}
                    {dayItems.length > 3 ? (
                      <p className="px-1 text-[10px] text-[var(--ws-faint)]">
                        +{dayItems.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="h-fit p-4">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
            Coming up
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-[var(--ws-muted)]">
              Nothing scheduled this month.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((item) => (
                <li key={`${item.source}-${item.id}`}>
                  <Link href={item.href} className="group block">
                    <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--ws-faint)]">
                      {new Date(item.starts_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {item.all_day
                        ? ""
                        : ` · ${new Date(item.starts_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                    </p>
                    <p className="text-[13px] leading-snug group-hover:underline">
                      {item.title}
                    </p>
                    {item.project_name ? (
                      <p className="text-[11px] text-[var(--ws-faint)]">
                        {item.project_name}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/**
 * A calendar entry reads as a line of text with one hairline marker, not a
 * coloured block. The marker carries the only meaning colour is allowed here:
 * a milestone is a deadline, everything else is just time.
 */
function DayItem({ item }: { item: CalendarItem }) {
  const tone =
    item.source === "milestone"
      ? "var(--ws-amber)"
      : item.source === "meeting"
        ? "var(--ws-text)"
        : "var(--ws-faint)";

  return (
    <Link
      href={item.href}
      title={item.title}
      className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-[var(--ws-hover)]"
    >
      <span
        aria-hidden
        className="h-1 w-1 shrink-0 rounded-full"
        style={{ background: tone }}
      />
      <span className="truncate text-[11px] leading-tight text-[var(--ws-muted)]">
        {item.title}
      </span>
    </Link>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? "border-[var(--ws-text)] bg-[var(--ws-accent-soft)] font-semibold text-[var(--ws-text)]"
          : "border-[var(--ws-line)] text-[var(--ws-muted)] hover:bg-[var(--ws-hover)]"
      }`}
    >
      {children}
    </Link>
  );
}
