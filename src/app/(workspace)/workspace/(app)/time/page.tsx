import { requireStaff } from "@/lib/workspace/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  formatHours,
  formatMinutes,
  isoDate,
  startOfWeek,
} from "@/lib/workspace/format";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Stat,
} from "@/components/workspace/ui/Primitives";
import TimeEntry from "./TimeEntry";
import DeleteTimeLogButton from "./DeleteTimeLogButton";

export const metadata = { title: "Time — Workspace" };

type Row = {
  id: string;
  minutes: number;
  logged_date: string;
  note: string | null;
  profile_id: string;
  projects: { name: string; slug: string } | null;
  tasks: { title: string; ref: number } | null;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Timesheets. RLS does the scoping: an admin's query returns the whole team,
 * an employee's returns only their own rows — same code path, no role branch.
 */
export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const { week } = await searchParams;
  const monday = week ? startOfWeek(new Date(week)) : startOfWeek();
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const [{ data: logs }, { data: projects }, { data: people }] = await Promise.all([
    supabase
      .from("time_logs")
      .select(
        "id, minutes, logged_date, note, profile_id, projects(name, slug), tasks(title, ref)",
      )
      .gte("logged_date", isoDate(monday))
      .lte("logged_date", isoDate(sunday))
      .order("logged_date", { ascending: false })
      .returns<Row[]>(),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name, email, weekly_capacity_hours"),
  ]);

  const rows = logs ?? [];
  const nameById = new Map(
    (people ?? []).map((p) => [p.id, p.full_name ?? p.email.split("@")[0]]),
  );

  const mine = rows.filter((r) => r.profile_id === session.profile.id);
  const myMinutes = mine.reduce((sum, r) => sum + r.minutes, 0);
  const teamMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);

  // Minutes per weekday for the little bar row.
  const perDay = DAYS.map((_, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    const key = isoDate(day);
    return {
      key,
      label: DAYS[i],
      minutes: rows
        .filter((r) => r.logged_date === key && r.profile_id === session.profile.id)
        .reduce((sum, r) => sum + r.minutes, 0),
    };
  });
  const peak = Math.max(60, ...perDay.map((d) => d.minutes));

  const prev = new Date(monday);
  prev.setDate(prev.getDate() - 7);
  const next = new Date(monday);
  next.setDate(next.getDate() + 7);

  return (
    <>
      <PageHeader
        title="Time"
        description={`${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Never visible to clients.`}
        action={
          <div className="flex gap-2 text-xs">
            <a
              href={`/workspace/time?week=${isoDate(prev)}`}
              className="rounded-lg border border-[var(--ws-line-strong)] px-3 py-2 font-semibold hover:bg-[var(--ws-hover)]"
            >
              ← Prev
            </a>
            <a
              href={`/workspace/time?week=${isoDate(next)}`}
              className="rounded-lg border border-[var(--ws-line-strong)] px-3 py-2 font-semibold hover:bg-[var(--ws-hover)]"
            >
              Next →
            </a>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Your week"
          value={formatHours(myMinutes)}
          sub={`of ${session.profile.weekly_capacity_hours}h capacity`}
          tone={
            myMinutes / 60 > session.profile.weekly_capacity_hours ? "red" : undefined
          }
        />
        <Stat label="Entries" value={mine.length} sub="Logged by you" />
        {session.isAdmin ? (
          <>
            <Stat label="Team total" value={formatHours(teamMinutes)} />
            <Stat label="Team entries" value={rows.length} />
          </>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Log time" hint="Timer or manual" />
            <div className="p-4">
              <TimeEntry projects={projects ?? []} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Your week" />
            <div className="flex items-end gap-2 px-5 py-4" style={{ height: 128 }}>
              {perDay.map((day) => (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="mono text-[10px] text-[var(--ws-faint)]">
                    {day.minutes ? formatHours(day.minutes) : ""}
                  </span>
                  <div
                    className="w-full rounded-t bg-[var(--ws-accent)]"
                    style={{
                      height: `${Math.max(2, (day.minutes / peak) * 74)}px`,
                      opacity: day.minutes ? 1 : 0.18,
                    }}
                  />
                  <span className="text-[10px] text-[var(--ws-muted)]">{day.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title={session.isAdmin ? "Team entries" : "Your entries"}
            hint={`${rows.length} this week`}
          />
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Nothing logged this week">
                One-click the timer while you work, or add a manual entry when
                you forget. Either way it never reaches a client.
              </EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--ws-line)]">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="mono w-14 shrink-0 text-xs text-[var(--ws-muted)]">
                    {new Date(`${row.logged_date}T00:00:00`).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">
                      {row.tasks ? (
                        <>
                          <span className="mono text-[var(--ws-accent)]">
                            TASK-{row.tasks.ref}
                          </span>{" "}
                          {row.tasks.title}
                        </>
                      ) : (
                        (row.note ?? "—")
                      )}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--ws-faint)]">
                      {row.projects?.name}
                      {session.isAdmin ? ` · ${nameById.get(row.profile_id) ?? ""}` : ""}
                      {row.tasks && row.note ? ` · ${row.note}` : ""}
                    </span>
                  </span>
                  <span className="mono shrink-0 text-[13px] font-semibold">
                    {formatMinutes(row.minutes)}
                  </span>
                  {row.profile_id === session.profile.id || session.isAdmin ? (
                    <DeleteTimeLogButton id={row.id} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
